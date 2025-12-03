
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
            if (!log.personnelId || log.personnelId.trim() === 'Personnel ID') return;
            
            const trimmedDateTime = log.dateTime?.trim();
            const trimmedPersonnelId = log.personnelId?.trim();

            if (!trimmedDateTime || !trimmedPersonnelId) return;

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
            const dayLogs = groupedByEmployeeAndDay[key].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
            const employeeId = dayLogs[0].personnelId.trim();
            const date = format(new Date(dayLogs[0].dateTime.trim()), 'yyyy-MM-dd');

            const checkIns = dayLogs.filter(l => l.inOutStatus.trim() === 'Check-In');
            const checkOuts = dayLogs.filter(l => l.inOutStatus.trim() === 'Check-Out');

            let morning_in: Date | null = null;
            let morning_out: Date | null = null;
            let afternoon_in: Date | null = null;
            let afternoon_out: Date | null = null;
            
            if (checkIns.length > 0) morning_in = new Date(checkIns[0].dateTime.trim());
            if (checkOuts.length > 0) afternoon_out = new Date(checkOuts[checkOuts.length - 1].dateTime.trim());
            
            const middayCutoff = new Date(date);
            middayCutoff.setHours(12, 30, 0, 0);

            const morningCheckOuts = checkOuts.filter(l => new Date(l.dateTime.trim()) < middayCutoff);
            if(morningCheckOuts.length > 0) morning_out = new Date(morningCheckOuts[morningCheckOuts.length -1].dateTime.trim());

            const afternoonCheckIns = checkIns.filter(l => new Date(l.dateTime.trim()) > middayCutoff);
            if(afternoonCheckIns.length > 0) afternoon_in = new Date(afternoonCheckIns[0].dateTime.trim());
            
            if(dayLogs.length === 2 && checkIns.length === 1 && checkOuts.length === 1) {
                morning_out = null;
                afternoon_in = null;
            }

            let totalWorkedMs = 0;
            if (morning_in && morning_out) {
                totalWorkedMs += morning_out.getTime() - morning_in.getTime();
            }
            if (afternoon_in && afternoon_out) {
                totalWorkedMs += afternoon_out.getTime() - afternoon_in.getTime();
            }
            if (morning_in && !morning_out && !afternoon_in && afternoon_out) {
                totalWorkedMs = afternoon_out.getTime() - morning_in.getTime();
            }

            const total_worked_hours = totalWorkedMs > 0 ? totalWorkedMs / (1000 * 60 * 60) : 0;
            
            const processedDoc: Omit<ProcessedAttendance, 'id'> = {
                employee_id: employeeId,
                date,
                morning_in: morning_in ? format(morning_in, 'HH:mm') : null,
                morning_out: morning_out ? format(morning_out, 'HH:mm') : null,
                afternoon_in: afternoon_in ? format(afternoon_in, 'HH:mm') : null,
                afternoon_out: afternoon_out ? format(afternoon_out, 'HH:mm') : null,
                total_worked_hours: total_worked_hours,
                total_late_minutes: 0,
                total_overtime_minutes: 0,
                is_leave: false,
                leave_type: null,
            };
            
            const docRef = doc(firestore, "processedAttendance", key);
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
        console.error("Processing error:", error);
        toast({
            variant: "destructive",
            title: "Échec du traitement",
            description: "Une erreur de permission est survenue lors de la lecture ou de l'écriture des données. Vérifiez la console pour plus de détails.",
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
