
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parse } from "date-fns";
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Employee, ProcessedAttendance } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";


const formSchema = z.object({
  employeeId: z.string({ required_error: "Veuillez sélectionner un employé." }),
  date: z.date({ required_error: "Une date est requise." }),
  morningIn: z.string().optional().or(z.literal('')),
  morningOut: z.string().optional().or(z.literal('')),
  afternoonIn: z.string().optional().or(z.literal('')),
  afternoonOut: z.string().optional().or(z.literal('')),
  reason: z.string().min(10, { message: "La raison doit comporter au moins 10 caractères." }),
});

export function CorrectionForm() {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const employeesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  const { data: employees, isLoading: employeesLoading } = useCollection<Employee>(employeesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      morningIn: "",
      morningOut: "",
      afternoonIn: "",
      afternoonOut: "",
    },
  });

  const selectedEmployeeId = form.watch('employeeId');
  const selectedDate = form.watch('date');

  const fetchAndSetAttendance = useCallback(async () => {
    if (!firestore || !selectedEmployeeId || !selectedDate) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const docId = `${selectedEmployeeId}-${dateStr}`;
    const attendanceDocRef = doc(firestore, 'processedAttendance', docId);

    try {
      const docSnap = await getDoc(attendanceDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as ProcessedAttendance;
        form.setValue('morningIn', data.morning_in || "");
        form.setValue('morningOut', data.morning_out || "");
        form.setValue('afternoonIn', data.afternoon_in || "");
        form.setValue('afternoonOut', data.afternoon_out || "");
      } else {
        // Reset fields if no data exists for that day
        form.setValue('morningIn', "");
        form.setValue('morningOut', "");
        form.setValue('afternoonIn', "");
        form.setValue('afternoonOut', "");
      }
    } catch (error) {
      console.error("Error fetching attendance for correction:", error);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger les pointages existants." });
    }
  }, [firestore, selectedEmployeeId, selectedDate, form, toast]);

  useEffect(() => {
    fetchAndSetAttendance();
  }, [selectedEmployeeId, selectedDate, fetchAndSetAttendance]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    
    const dateStr = format(values.date, "yyyy-MM-dd");
    const docId = `${values.employeeId}-${dateStr}`;
    const attendanceDocRef = doc(firestore, 'processedAttendance', docId);

    const originalDocSnap = await getDoc(attendanceDocRef);
    const originalData = originalDocSnap.exists() ? originalDocSnap.data() : null;

    // Calculate new total hours
    let totalWorkedMs = 0;
    const timeToMs = (timeStr: string | undefined | null) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return (hours * 60 + minutes) * 60 * 1000;
    }
    const morningInMs = timeToMs(values.morningIn);
    const morningOutMs = timeToMs(values.morningOut);
    const afternoonInMs = timeToMs(values.afternoonIn);
    const afternoonOutMs = timeToMs(values.afternoonOut);
    if(morningOutMs > morningInMs) totalWorkedMs += morningOutMs - morningInMs;
    if(afternoonOutMs > afternoonInMs) totalWorkedMs += afternoonOutMs - afternoonInMs;
    const total_worked_hours = totalWorkedMs / (1000 * 60 * 60);

    const correctedAttendanceData: Partial<ProcessedAttendance> = {
      employee_id: values.employeeId,
      date: dateStr,
      morning_in: values.morningIn || null,
      morning_out: values.morningOut || null,
      afternoon_in: values.afternoonIn || null,
      afternoon_out: values.afternoonOut || null,
      total_worked_hours: total_worked_hours,
      total_late_minutes: 0, // Recalculate if needed
      total_overtime_minutes: Math.max(0, (total_worked_hours - 8) * 60),
    };

    setDocumentNonBlocking(attendanceDocRef, correctedAttendanceData, { merge: true });

    const correctionLogData = {
      employeeId: values.employeeId,
      correctionDate: dateStr,
      correctedBy: user.uid,
      correctionReason: values.reason,
      timestamp: serverTimestamp(),
      originalMorningIn: originalData?.morning_in || null,
      originalMorningOut: originalData?.morning_out || null,
      originalAfternoonIn: originalData?.afternoon_in || null,
      originalAfternoonOut: originalData?.afternoon_out || null,
      correctedMorningIn: values.morningIn || null,
      correctedMorningOut: values.morningOut || null,
      correctedAfternoonIn: values.afternoonIn || null,
      correctedAfternoonOut: values.afternoonOut || null,
    };
    
    addDocumentNonBlocking(collection(firestore, 'manualCorrections'), correctionLogData);

    toast({
      title: "Correction Appliquée",
      description: "Le journal de présence a été mis à jour avec succès.",
    });
    form.reset({
        reason: "",
        morningIn: "",
        morningOut: "",
        afternoonIn: "",
        afternoonOut: "",
    });
    form.setValue('employeeId', values.employeeId);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Employé</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={employeesLoading}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={employeesLoading ? "Chargement..." : "Sélectionnez un employé à corriger"} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {employees?.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Date de la Correction</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                        ) : (
                            <span>Choisissez une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        locale={fr}
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                        date > new Date() || date < new Date("2023-01-01")
                        }
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {selectedEmployeeId && selectedDate && (
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Chargement des données</AlertTitle>
                <AlertDescription>
                    Les pointages existants pour cette journée sont pré-remplis. Modifiez-les et enregistrez.
                </AlertDescription>
            </Alert>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <FormField control={form.control} name="morningIn" render={({ field }) => (
                <FormItem><FormLabel>Arrivée Matin</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="morningOut" render={({ field }) => (
                <FormItem><FormLabel>Départ Matin</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="afternoonIn" render={({ field }) => (
                <FormItem><FormLabel>Arrivée A-M</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="afternoonOut" render={({ field }) => (
                <FormItem><FormLabel>Départ A-M</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Raison de la Correction</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: L'employé a oublié de badger en partant déjeuner."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Cette raison sera consignée dans le journal d'audit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Enregistrer la Correction</Button>
      </form>
    </Form>
  );
}
