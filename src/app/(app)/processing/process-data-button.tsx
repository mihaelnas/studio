

'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader, Cog } from "lucide-react";
import { useFirebase } from "@/firebase";
import { collection, getDocs, writeBatch, doc, query, where, serverTimestamp, addDoc, WriteBatch, collectionGroup } from "firebase/firestore";
import type { AttendanceLog, ProcessedAttendance, Employee, Schedule } from "@/lib/types";
import { format, parse, isValid } from 'date-fns';
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export function ProcessDataButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handleProcessData = async () => {
    if (!firestore) {
        toast({ variant: "destructive", title: "Erreur", description: "Firestore n'est pas initialisé." });
        return;
    }
    setIsProcessing(true);
    toast({ title: "Début du traitement...", description: "Veuillez patienter." });

    try {
        const logsQuery = query(collection(firestore, "attendanceLogs"), where("status", "==", "pending"));
        const logsSnapshot = await getDocs(logsQuery).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'attendanceLogs', operation: 'list' }));
            throw error;
        });

        const employeesSnapshot = await getDocs(collection(firestore, "employees")).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'employees', operation: 'list' }));
            throw error;
        });
        
        const schedulesSnapshot = await getDocs(collectionGroup(firestore, "schedules")).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'schedules', operation: 'list' }));
            throw error;
        });

        const logs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog));
        const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        const employeeMapByPersonnelId = new Map(employees.map(e => [e.employeeId, e]));

        const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));

        if (logs.length === 0) {
            toast({ variant: "default", title: "Information", description: "Aucun nouveau log brut à traiter." });
            setIsProcessing(false);
            return;
        }

        const groupedByEmployeeAndDay: { [key: string]: AttendanceLog[] } = {};
        const newEmployeesToCreate = new Map<string, Omit<Employee, 'id' | 'authUid'>>();
        
        for (const log of logs) {
            const trimmedPersonnelId = log.personnelId?.trim();
            if (!trimmedPersonnelId || trimmedPersonnelId === 'Personnel ID') continue;
            
            let employee = employeeMapByPersonnelId.get(trimmedPersonnelId);
            
            if (!employee && !newEmployeesToCreate.has(trimmedPersonnelId)) {
                console.log(`Nouvel employé détecté avec l'ID d'appareil: ${trimmedPersonnelId}. Création d'un profil provisoire.`);
                const newEmployeeData: Omit<Employee, 'id'| 'authUid'> = {
                    employeeId: trimmedPersonnelId,
                    name: `${log.firstName} ${log.lastName}`.trim() || `Employé (ID: ${trimmedPersonnelId})`,
                    email: `placeholder+${trimmedPersonnelId}@miaraka.com`,
                    department: "Non assigné",
                    hourlyRate: 25000,
                };
                newEmployeesToCreate.set(trimmedPersonnelId, newEmployeeData);
            }

            const trimmedDateTime = log.dateTime?.trim();
            if (!trimmedDateTime) continue;
            
            const logDate = parse(trimmedDateTime, "yyyy-MM-dd HH:mm:ss", new Date());
            if (!isValid(logDate)) {
                 console.warn(`Invalid date format for log entry: ${log.id}, dateTime: ${log.dateTime}`);
                continue;
            }

            const dayKey = format(logDate, 'yyyy-MM-dd');
            const key = `${trimmedPersonnelId}-${dayKey}`; 
            if (!groupedByEmployeeAndDay[key]) {
                groupedByEmployeeAndDay[key] = [];
            }
            groupedByEmployeeAndDay[key].push(log);
        };
        
        let batch = writeBatch(firestore);

        // Create new employees first and get their new IDs
        for (const [personnelId, employeeData] of newEmployeesToCreate.entries()) {
            const newDocRef = doc(collection(firestore, "employees"));
            const newEmployeeWithId: Employee = { 
                ...employeeData, 
                id: newDocRef.id, 
                authUid: null
            };
            batch.set(newDocRef, newEmployeeWithId);
            await batch.commit(); // Commit this batch to get the new employee in the next step
            
            // Re-create batch for subsequent operations
            batch = writeBatch(firestore);

            employeeMapByPersonnelId.set(personnelId, newEmployeeWithId); // Add to map for current session
        }


        let processedCount = 0;
        let rejectedCount = 0;

        for (const key in groupedByEmployeeAndDay) {
            const dayLogs = groupedByEmployeeAndDay[key].sort((a, b) => new Date(a.dateTime.trim()).getTime() - new Date(b.dateTime.trim()).getTime());
            
            const validSequenceLogs: AttendanceLog[] = [];
            let lastStatus: 'Check-In' | 'Check-Out' | null = null;
            
            for (const log of dayLogs) {
                const logRef = doc(firestore, "attendanceLogs", log.id);
                
                if (lastStatus === null && log.inOutStatus !== 'Check-In') {
                    batch.update(logRef, { status: "rejected", rejectionReason: "La journée doit commencer par un 'Check-In'." });
                    rejectedCount++;
                    continue;
                }

                if (log.inOutStatus === lastStatus) {
                    batch.update(logRef, { status: "rejected", rejectionReason: "Pointage en double ou invalide (séquence non alternée)." });
                    rejectedCount++;
                    continue;
                }

                validSequenceLogs.push(log);
                lastStatus = log.inOutStatus;
                batch.update(logRef, { status: "processed" });
                processedCount++;
            }
            
            if (validSequenceLogs.length === 0) {
                continue;
            }

            const personnelId = key.split(/-(.*)/s)[0];
            const date = key.split(/-(.*)/s)[1];
            const employee = employeeMapByPersonnelId.get(personnelId);
            if (!employee) continue; // Should not happen after creation logic, but as a safeguard

            let totalWorkedMs = 0;
            let lastCheckIn: Date | null = null;
            
            validSequenceLogs.forEach(log => {
                const logTime = parse(log.dateTime.trim(), "yyyy-MM-dd HH:mm:ss", new Date());
                if (log.inOutStatus === 'Check-In') {
                    lastCheckIn = logTime;
                } else if (log.inOutStatus === 'Check-Out' && lastCheckIn) {
                    totalWorkedMs += logTime.getTime() - lastCheckIn.getTime();
                    lastCheckIn = null; // Reset for next pair
                }
            });

            const total_worked_hours = totalWorkedMs > 0 ? totalWorkedMs / (1000 * 60 * 60) : 0;
            
            const checkIns = validSequenceLogs.filter(l => l.inOutStatus === 'Check-In').map(l => parse(l.dateTime.trim(), "yyyy-MM-dd HH:mm:ss", new Date()));
            const checkOuts = validSequenceLogs.filter(l => l.inOutStatus === 'Check-Out').map(l => parse(l.dateTime.trim(), "yyyy-MM-dd HH:mm:ss", new Date()));

            const noon = parse(`${date} 13:00:00`, "yyyy-MM-dd HH:mm:ss", new Date());
            const morningIn = checkIns.find(ci => ci < noon);
            const morningOut = checkOuts.find(co => co < noon);
            const afternoonIn = checkIns.find(ci => ci >= noon);
            const afternoonOut = checkOuts.sort((a,b) => b.getTime() - a.getTime()).find(co => co >= noon);
            
            let totalLateMinutes = 0;
            const standardMorningIn = parse(`${date} 08:00:00`, "yyyy-MM-dd HH:mm:ss", new Date());
            if (morningIn && morningIn > standardMorningIn) {
                totalLateMinutes += (morningIn.getTime() - standardMorningIn.getTime()) / (1000 * 60);
            }
            const standardAfternoonIn = parse(`${date} 14:00:00`, "yyyy-MM-dd HH:mm:ss", new Date());
            if(afternoonIn && afternoonIn > standardAfternoonIn) {
                 totalLateMinutes += (afternoonIn.getTime() - standardAfternoonIn.getTime()) / (1000 * 60);
            }
            
            const schedule = schedules.find(s => s.employeeId === employee.id && s.date.toString() === date);

            const processedDoc: Omit<ProcessedAttendance, 'id'> = {
                employee_id: employee.id,
                employee_name: employee.name,
                date,
                morning_in: morningIn ? format(morningIn, 'HH:mm') : null,
                morning_out: morningOut ? format(morningOut, 'HH:mm') : null,
                afternoon_in: afternoonIn ? format(afternoonIn, 'HH:mm') : null,
                afternoon_out: afternoonOut ? format(afternoonOut, 'HH:mm') : null,
                total_worked_hours,
                total_late_minutes: Math.max(0, Math.round(totalLateMinutes)),
                total_overtime_minutes: Math.max(0, Math.round(((total_worked_hours - 8) * 60))),
                is_leave: false,
                leave_type: null,
                taskDescription: schedule?.taskDescription || null,
            };
            
            const docId = `${employee.id}-${date}`;
            const docRef = doc(firestore, "processedAttendance", docId);
            batch.set(docRef, processedDoc, { merge: true });
        }

        await batch.commit().catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: '/ (batch write)',
                operation: 'write',
            }));
            throw error;
        });

        let toastMessage = `${processedCount} logs traités avec succès.`;
        if (newEmployeesToCreate.size > 0) {
            toastMessage += ` ${newEmployeesToCreate.size} nouveaux profils employés créés.`;
        }
        if (rejectedCount > 0) {
            toastMessage += ` ${rejectedCount} logs ont été rejetés.`
        }

        toast({
            title: "Traitement Terminé",
            description: toastMessage,
        });

    } catch (error: any) {
        console.error("Processing error:", error);
        toast({
            variant: "destructive",
            title: "Échec du traitement",
            description: error.message || "Une erreur est survenue lors du traitement. Vérifiez la console pour plus de détails.",
        });
    } finally {
        setIsProcessing(false);
    }
  };


  return (
    <Button onClick={handleProcessData} disabled={isProcessing} size="lg">
      {isProcessing ? (
        <Loader className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <Cog className="mr-2 h-5 w-5" />
      )}
      {isProcessing ? "Traitement en cours..." : "Lancer le Traitement des Données"}
    </Button>
  );
}
