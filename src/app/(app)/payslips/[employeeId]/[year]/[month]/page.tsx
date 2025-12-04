
'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { Employee, ProcessedAttendance } from '@/lib/types';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PayslipData {
  employee: Employee;
  payPeriod: string;
  totalHours: number;
  totalOvertime: number;
  hourlyRate: number;
  baseSalary: number;
  overtimePay: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(value);
};

function PayslipSkeleton() {
    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <div className="text-right space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <Skeleton className="h-px w-full" />
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-full" /></div>
                   <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-full" /></div>
                </div>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    )
}

export default function PayslipPage() {
    const params = useParams();
    const router = useRouter();
    const { employeeId, year, month } = params;
    const { firestore } = useFirebase();

    const employeeDocRef = useMemoFirebase(() => 
        firestore && employeeId ? doc(firestore, 'employees', employeeId as string) : null,
        [firestore, employeeId]
    );

    const attendanceQuery = useMemoFirebase(() => {
        if (!firestore || !year || !month) return null;
        const startDate = format(new Date(Number(year), Number(month) - 1, 1), 'yyyy-MM-dd');
        const endDate = format(new Date(Number(year), Number(month), 0), 'yyyy-MM-dd');
        return query(
            collection(firestore, 'processedAttendance'),
            where('employee_id', '==', employeeId),
            where('date', '>=', startDate),
            where('date', '<=', endDate)
        );
    }, [firestore, employeeId, year, month]);

    const { data: employee, isLoading: employeeLoading, error: employeeError } = useDoc<Employee>(employeeDocRef);
    const { data: attendance, isLoading: attendanceLoading, error: attendanceError } = useCollection<ProcessedAttendance>(attendanceQuery);

    const payslipData: PayslipData | null = useMemo(() => {
        if (!employee || !attendance) return null;

        const { totalHours, overtimeHours } = attendance.reduce((acc, record) => {
            acc.totalHours += record.total_worked_hours;
            acc.overtimeHours += record.total_overtime_minutes > 0 ? record.total_overtime_minutes / 60 : 0;
            return acc;
        }, { totalHours: 0, overtimeHours: 0 });

        const hourlyRate = employee.department === 'Chirurgie' || employee.department === 'Cardiologie' ? 35000 : 25000;
        const baseSalary = (totalHours - overtimeHours) * hourlyRate;
        const overtimePay = overtimeHours * hourlyRate * 1.5;
        const grossSalary = baseSalary + overtimePay;
        const deductions = grossSalary * 0.20; // 20% flat tax/deduction
        const netSalary = grossSalary - deductions;

        return {
            employee,
            payPeriod: format(new Date(Number(year), Number(month) - 1), 'MMMM yyyy', { locale: fr }),
            totalHours,
            totalOvertime: overtimeHours,
            hourlyRate,
            baseSalary,
            overtimePay,
            grossSalary,
            deductions,
            netSalary,
        };
    }, [employee, attendance, year, month]);

    const isLoading = employeeLoading || attendanceLoading;
    const error = employeeError || attendanceError;

    if (isLoading) {
        return <PayslipSkeleton />;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>Impossible de charger les données de la fiche de paie.</AlertDescription>
            </Alert>
        );
    }
    
    if (!payslipData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Aucune Donnée</AlertTitle>
                    <AlertDescription>Aucune donnée de présence ou d'employé trouvée pour générer cette fiche de paie.</AlertDescription>
                </Alert>
                 <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
            </div>
        )
    }
    
    return (
        <div className="space-y-4">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>
            <Card className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Fiche de Paie</CardTitle>
                    <CardDescription className="text-lg capitalize">{payslipData.payPeriod}</CardDescription>
                </CardHeader>
                <CardContent className="mt-6 space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20 border">
                                <AvatarImage src={payslipData.employee.avatarUrl} alt={payslipData.employee.name} />
                                <AvatarFallback>{payslipData.employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-2xl font-bold">{payslipData.employee.name}</h2>
                                <p className="text-muted-foreground">{payslipData.employee.department}</p>
                            </div>
                        </div>
                        <div className="text-left sm:text-right mt-4 sm:mt-0">
                            <p className="text-sm text-muted-foreground">Fiche de Paie du {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
                            <p className="text-sm text-muted-foreground">Employé ID: {payslipData.employee.id}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                        <div><span className="font-medium">Taux Horaire :</span> {formatCurrency(payslipData.hourlyRate)}</div>
                        <div><span className="font-medium">Heures Travaillées :</span> {payslipData.totalHours.toFixed(2)}h</div>
                        <div><span className="font-medium">Heures de Base :</span> {(payslipData.totalHours - payslipData.totalOvertime).toFixed(2)}h</div>
                        <div><span className="font-medium">Heures Supplémentaires :</span> {payslipData.totalOvertime.toFixed(2)}h</div>
                    </div>
                    
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Salaire de base</TableCell>
                                    <TableCell className="text-right">{formatCurrency(payslipData.baseSalary)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Rémunération des heures supplémentaires (majorées à 150%)</TableCell>
                                    <TableCell className="text-right">{formatCurrency(payslipData.overtimePay)}</TableCell>
                                </TableRow>
                                <TableRow className="font-bold bg-secondary/50">
                                    <TableCell>Salaire Brut</TableCell>
                                    <TableCell className="text-right">{formatCurrency(payslipData.grossSalary)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Déductions (Impôts, charges sociales, etc. - 20% du brut)</TableCell>
                                    <TableCell className="text-right text-destructive">- {formatCurrency(payslipData.deductions)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end mt-4">
                        <div className="w-full sm:w-1/2 p-4 bg-secondary rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-xl font-bold">Salaire Net à Payer</span>
                                <span className="text-2xl font-bold text-primary">{formatCurrency(payslipData.netSalary)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground pt-8">
                        Ceci est une fiche de paie générée par ordinateur et ne nécessite pas de signature.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
