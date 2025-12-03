"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon } from "lucide-react";

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
import { employees } from "@/lib/data";

const formSchema = z.object({
  employeeId: z.string({ required_error: "Veuillez sélectionner un employé." }),
  date: z.date({ required_error: "Une date est requise." }),
  morningIn: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Format de l'heure invalide (HH:MM)" }).optional(),
  morningOut: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Format de l'heure invalide (HH:MM)" }).optional(),
  afternoonIn: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Format de l'heure invalide (HH:MM)" }).optional(),
  afternoonOut: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Format de l'heure invalide (HH:MM)" }).optional(),
  reason: z.string().min(10, { message: "La raison doit comporter au moins 10 caractères." }),
});

export function CorrectionForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Correction Soumise",
      description: "Le journal de présence a été mis à jour avec succès.",
    });
    form.reset();
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un employé à corriger" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {employees.map(emp => (
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
                        date > new Date() || date < new Date("1900-01-01")
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

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <FormField control={form.control} name="morningIn" render={({ field }) => (
                <FormItem><FormLabel>Arrivée Matin</FormLabel><FormControl><Input placeholder="08:00" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="morningOut" render={({ field }) => (
                <FormItem><FormLabel>Départ Matin</FormLabel><FormControl><Input placeholder="12:00" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="afternoonIn" render={({ field }) => (
                <FormItem><FormLabel>Arrivée Après-midi</FormLabel><FormControl><Input placeholder="13:00" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="afternoonOut" render={({ field }) => (
                <FormItem><FormLabel>Départ Après-midi</FormLabel><FormControl><Input placeholder="17:00" {...field} /></FormControl><FormMessage /></FormItem>
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
