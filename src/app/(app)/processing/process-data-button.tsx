
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader, Cog } from "lucide-react";
import { useFirebase } from "@/firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import type { AttendanceLog, ProcessedAttendance, Employee } from "@/lib/types";
import { format, parse } from 'date-fns';
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
        const logsSnapshot = await getDocs(collection(firestore, "attendanceLogs")).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'attendanceLogs', operation: 'list' }));
            throw error;
        });

        const employeesSnapshot = await getDocs(collection(firestore, "employees")).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'employees', operation: 'list' }));
            throw error;
        });

        const logs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog));
        const existingEmployees = new Set(employeesSnapshot.docs.map(doc => doc.id));

        if (logs.length === 0) {
            toast({ variant: "default", title: "Information", description: "Aucun log brut à traiter." });
            setIsProcessing(false);
            return;
        }

        const groupedByEmployeeAndDay: { [key: string]: AttendanceLog[] } = {};
        const employeesToCreate = new Map<string, Partial<Employee>>();

        logs.forEach(log => {
            const trimmedPersonnelId = log.personnelId?.trim();
            if (!trimmedPersonnelId || trimmedPersonnelId === 'Personnel ID') return;
            
            const trimmedDateTime = log.dateTime?.trim();
            if (!trimmedDateTime) return;

            // Add to employees to create if not existing
            if (!existingEmployees.has(trimmedPersonnelId) && !employeesToCreate.has(trimmedPersonnelId)) {
                employeesToCreate.set(trimmedPersonnelId, {
                    id: trimmedPersonnelId,
                    name: `${log.firstName?.trim() || ''} ${log.lastName?.trim() || ''}`.trim(),
                    email: `${(log.firstName?.trim() || '').toLowerCase()}.${(log.lastName?.trim() || 'user').toLowerCase()}@miaraka.mg`, // Dummy email
                    department: 'Non assigné', // Default department
                });
            }

            const logDate = parse(trimmedDateTime, "yyyy-MM-dd HH:mm:ss", new Date());

            if (isNaN(logDate.getTime())) {
                console.warn(`Invalid date format for log entry: ${log.id}, dateTime: ${log.dateTime}`);
                return;
            }

            const dayKey = format(logDate, 'yyyy-MM-dd');
            const key = `${trimmedPersonnelId}-${dayKey}`;
            if (!groupedByEmployeeAndDay[key]) {
                groupedByEmployeeAndDay[key] = [];
            }
            groupedByEmployeeAndDay[key].push(log);
        });

        const batch = writeBatch(firestore);
        let processedCount = 0;

        // Add new employees to the batch
        employeesToCreate.forEach((employeeData, employeeId) => {
            const employeeDocRef = doc(firestore, "employees", employeeId);
            batch.set(employeeDocRef, employeeData);
        });

        for (const key in groupedByEmployeeAndDay) {
            const dayLogs = groupedByEmployeeAndDay[key].sort((a, b) => new Date(a.dateTime.trim()).getTime() - new Date(b.dateTime.trim()).getTime());
            const employeeId = dayLogs[0].personnelId.trim();
            const date = format(new Date(dayLogs[0].dateTime.trim()), 'yyyy-MM-dd');

            let morning_in: Date | null = null;
            let morning_out: Date | null = null;
            let afternoon_in: Date | null = null;
            let afternoon_out: Date | null = null;
            
            let totalWorkedMs = 0;
            let totalLateMinutes = 0;
            let totalOvertimeMinutes = 0;

            const standardMorningIn = parse(`${date} 08:00:00`, "yyyy-MM-dd HH:mm:ss", new Date());
            const standardMorningOut = parse(`${date} 12:00:00`, "yyyy-MM-dd HH:mm:ss", new Date());
            const standardAfternoonIn = parse(`${date} 14:00:00`, "yyyy-MM-dd HH:mm:ss", new Date());
            const standardAfternoonOut = parse(`${date} 17:00:00`, "yyyy-MM-dd HH:mm:ss", new Date());
            
            // Find first morning check-in
            const firstCheckIn = dayLogs.find(l => l.inOutStatus.trim() === 'Check-In');
            if (firstCheckIn) {
                morning_in = parse(firstCheckIn.dateTime.trim(), "yyyy-MM-dd HH:mm:ss", new Date());
                const lateness = (morning_in.getTime() - standardMorningIn.getTime()) / (1000 * 60);
                if (lateness > 0) totalLateMinutes += lateness;
            }

            // Find last afternoon check-out
            const reversedLogs = [...dayLogs].reverse();
            const lastCheckOut = reversedLogs.find(l => l.inOutStatus.trim() === 'Check-Out');
             if (lastCheckOut) {
                afternoon_out = parse(lastCheckOut.dateTime.trim(), "yyyy-MM-dd HH:mm:ss", new Date());
             }

            // Find check-in/out pairs
            let lastCheckInTime: Date | null = null;
            dayLogs.forEach(log => {
                const logTime = parse(log.dateTime.trim(), "yyyy-MM-dd HH:mm:ss", new Date());
                if (log.inOutStatus.trim() === 'Check-In') {
                    if (!lastCheckInTime) {
                        lastCheckInTime = logTime;
                    }
                    // Handle afternoon check-in lateness
                    if (logTime > standardMorningOut && logTime < standardAfternoonOut) { // It's an afternoon check-in
                        const afternoonLateness = (logTime.getTime() - standardAfternoonIn.getTime()) / (1000 * 60);
                        if (afternoonLateness > 0 && !afternoon_in) { // Only add lateness for the first afternoon checkin
                            totalLateMinutes += afternoonLateness;
                            afternoon_in = logTime;
                        }
                    }
                } else if (log.inOutStatus.trim() === 'Check-Out' && lastCheckInTime) {
                    totalWorkedMs += logTime.getTime() - lastCheckInTime.getTime();
                    
                    // Handle overtime
                    if (logTime > standardMorningOut && lastCheckInTime < standardMorningOut) { // Morning overtime
                        const overtime = (logTime.getTime() - standardMorningOut.getTime()) / (1000 * 60);
                        if (overtime > 0) totalOvertimeMinutes += overtime;
                    }
                    if (logTime > standardAfternoonOut) { // Afternoon overtime
                        const overtime = (logTime.getTime() - standardAfternoonOut.getTime()) / (1000 * 60);
                        if (overtime > 0) totalOvertimeMinutes += overtime;
                    }

                    if (logTime < standardAfternoonIn) morning_out = logTime;
                    if (logTime > standardAfternoonIn) afternoon_out = logTime;

                    lastCheckInTime = null; // Reset for next pair
                }
            });

            const total_worked_hours = totalWorkedMs > 0 ? totalWorkedMs / (1000 * 60 * 60) : 0;
            
            const processedDoc: Omit<ProcessedAttendance, 'id'> = {
                employee_id: employeeId,
                date,
                morning_in: morning_in ? format(morning_in, 'HH:mm') : null,
                morning_out: morning_out ? format(morning_out, 'HH:mm') : null,
                afternoon_in: afternoon_in ? format(afternoon_in, 'HH:mm') : null,
                afternoon_out: afternoon_out ? format(afternoon_out, 'HH:mm') : null,
                total_worked_hours: total_worked_hours,
                total_late_minutes: Math.round(totalLateMinutes),
                total_overtime_minutes: Math.round(totalOvertimeMinutes),
                is_leave: false,
                leave_type: null,
            };
            
            const docId = `${employeeId}-${date}`;
            const docRef = doc(firestore, "processedAttendance", docId);
            batch.set(docRef, processedDoc, { merge: true });
            processedCount++;
        }

        await batch.commit().catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: '/processedAttendance (batch write)',
                operation: 'write',
            }));
        });

        let toastMessage = `${processedCount} enregistrements de présence ont été traités.`;
        if (employeesToCreate.size > 0) {
            toastMessage += ` ${employeesToCreate.size} nouveaux employés ont été créés.`
        }

        toast({
            title: "Traitement Terminé",
            description: toastMessage,
        });

    } catch (error: any) {
        // Errors are now emitted and will be caught by the global error handler
        // but we keep this catch block to prevent unhandled promise rejections
        // and to give a generic feedback to the user.
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

    
    