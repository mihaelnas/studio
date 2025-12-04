
"use client";

import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Employee } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Pencil } from 'lucide-react';
import { EmployeeEditDialog } from './[employeeId]/edit-dialog';
import { Button } from '@/components/ui/button';

const RowSkeleton = () => (
  <TableRow>
    <TableCell>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </TableCell>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-10 w-24" /></TableCell>
  </TableRow>
);

export function EmployeeList() {
  const { firestore } = useFirebase();

  const employeesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'employees'), orderBy('name')) : null, 
    [firestore]
  );
  
  const { data: employees, isLoading, error } = useCollection<Employee>(employeesQuery);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>ID Employé</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Département</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <RowSkeleton key={index} />)
          ) : error ? (
             <TableRow>
                <TableCell colSpan={5}>
                    <Alert variant="destructive" className="m-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Erreur de Chargement</AlertTitle>
                        <AlertDescription>Impossible de charger la liste des employés.</AlertDescription>
                    </Alert>
                </TableCell>
            </TableRow>
          ) : employees && employees.length > 0 ? (
            employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <Link href={`/employees/${employee.id}`} className="flex items-center gap-3 hover:underline">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{employee.name ? employee.name.split(' ').map(n => n[0]).join('') : 'EM'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{employee.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{employee.id}</TableCell>
                <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell className="text-right">
                  <EmployeeEditDialog employee={employee}>
                    <Button variant="outline" size="sm">
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                    </Button>
                  </EmployeeEditDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
             <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                    Aucun employé trouvé. Traitez un fichier de logs pour les ajouter automatiquement.
                </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
