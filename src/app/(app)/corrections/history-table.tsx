"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { corrections } from "@/lib/data";
import { format } from 'date-fns';

export function HistoryTable() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Modified By</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Date Modified</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {corrections.map((correction) => (
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
              <TableCell>{correction.employeeName}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{format(correction.timestamp, "PPP")}</span>
                  <span className="text-xs text-muted-foreground">{format(correction.timestamp, "p")}</span>
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate">{correction.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
