
"use client";

import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { processedAttendanceData, employees } from "@/lib/data";
import type { ProcessedAttendance } from "@/lib/types";

const TimeCell = ({ time }: { time: string | null }) => (
    <TableCell className="text-center">{time || 'N/A'}</TableCell>
);

const renderValue = (value: number) => {
    if (value > 0) {
        return <span className={value > 15 ? "text-destructive" : "text-amber-600"}>{value} min</span>;
    }
    return <span className="text-green-600">0 min</span>;
}

export function ProcessedAttendanceTable({ employeeId }: { employeeId?: string }) {
  const data = (employeeId ? processedAttendanceData.filter(d => d.employee_id === employeeId) : processedAttendanceData)
    .map(record => {
        const employee = employees.find(e => e.id === record.employee_id);
        return {
            ...record,
            employee_name: employee?.name || record.employee_id
        }
    });
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {!employeeId && <TableHead>Employé</TableHead>}
            <TableHead>Date</TableHead>
            <TableHead className="text-center">Arrivée Matin</TableHead>
            <TableHead className="text-center">Départ Matin</TableHead>
            <TableHead className="text-center">Arrivée A-M</TableHead>
            <TableHead className="text-center">Départ Soir</TableHead>
            <TableHead className="text-center">Heures Travaillées</TableHead>
            <TableHead className="text-center">Retard Total</TableHead>
            <TableHead className="text-center">H. Supp. Total</TableHead>
            <TableHead className="text-center">En Congé</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record: ProcessedAttendance) => (
            <TableRow key={record.id}>
              {!employeeId && (
                <TableCell className="font-medium">
                    <Link href={`/employees/${record.employee_id}`} className="hover:underline">
                    {record.employee_name}
                    </Link>
                </TableCell>
              )}
              <TableCell>{record.date}</TableCell>
              <TimeCell time={record.morning_in} />
              <TimeCell time={record.morning_out} />
              <TimeCell time={record.afternoon_in} />
              <TimeCell time={record.afternoon_out} />
              <TableCell className="text-center">{record.total_worked_hours.toFixed(2)}</TableCell>
              <TableCell className="text-center">{renderValue(record.total_late_minutes)}</TableCell>
              <TableCell className="text-center">{renderValue(record.total_overtime_minutes)}</TableCell>
              <TableCell className="text-center">
                {record.is_leave ? (
                  <Badge variant="secondary">{record.leave_type || 'Oui'}</Badge>
                ) : (
                  <Badge variant="outline">Non</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
