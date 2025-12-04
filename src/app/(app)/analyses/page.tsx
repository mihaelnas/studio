
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessedAttendanceTable } from "./processed-attendance-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from './date-range-picker';
import type { DateRange } from 'react-day-picker';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Employee } from '@/lib/types';
import { subDays } from 'date-fns';

const departments = [
  "Tous",
  "Non assigné",
  "Cardiologie",
  "Chirurgie",
  "Pédiatrie",
  "Radiologie",
  "Urgence",
  "Administration",
  "Pharmacie"
];

export default function AnalysesPage() {
  const { firestore } = useFirebase();
  const [employeeId, setEmployeeId] = useState<string | undefined>(undefined);
  const [department, setDepartment] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const employeesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  const { data: employees, isLoading: employeesLoading } = useCollection<Employee>(employeesQuery);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyses de Présence</CardTitle>
        <CardDescription>
          Filtrez et explorez les données de présence quotidiennes nettoyées et agrégées pour tous les employés.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select value={employeeId} onValueChange={(value) => setEmployeeId(value === 'all' ? undefined : value)} disabled={employeesLoading}>
            <SelectTrigger>
              <SelectValue placeholder={employeesLoading ? "Chargement..." : "Filtrer par employé"} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Tous les employés</SelectItem>
                {employees?.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={department} onValueChange={(value) => setDepartment(value === 'Tous' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par département" />
            </SelectTrigger>
            <SelectContent>
                {departments.map(dep => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DateRangePicker date={dateRange} setDate={setDateRange} />
        </div>
        <ProcessedAttendanceTable 
            employeeId={employeeId}
            department={department}
            dateRange={dateRange}
        />
      </CardContent>
    </Card>
  );
}
