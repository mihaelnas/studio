"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { corrections, employees } from "@/lib/data";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Correction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface FormattedCorrection extends Omit<Correction, 'timestamp' | 'date'> {
  timestamp: string;
  date: string;
  employeeId?: string;
}

export function HistoryTable() {
  const [formattedCorrections, setFormattedCorrections] = useState<FormattedCorrection[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setFormattedCorrections(
      corrections.map(c => {
        const employee = employees.find(e => e.name === c.employeeName);
        return {
        ...c,
        employeeId: employee?.id,
        timestamp: `${format(c.timestamp, "PPP", { locale: fr })} à ${format(c.timestamp, "p", { locale: fr })}`,
        date: format(c.date, "PPP", { locale: fr }),
      }})
    );
  }, []);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Modifié Par</TableHead>
            <TableHead>Employé</TableHead>
            <TableHead>Date de Modification</TableHead>
            <TableHead>Raison</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isClient ? (
            formattedCorrections.map((correction) => (
              <TableRow key={correction.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={correction.adminAvatarUrl} alt={correction.adminName} data-ai-hint="person portrait" />
                      <AvatarFallback>{correction.adminName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{correction.adminName}</span>
                  </div>
                </TableCell>
                <TableCell>
                    {correction.employeeId ? (
                        <Link href={`/employees/${correction.employeeId}`} className="hover:underline">{correction.employeeName}</Link>
                    ) : (
                        correction.employeeName
                    )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{correction.timestamp.split(' à ')[0]}</span>
                    <span className="text-xs text-muted-foreground">{correction.timestamp.split(' à ')[1]}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{correction.reason}</TableCell>
              </TableRow>
            ))
          ) : (
            Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
