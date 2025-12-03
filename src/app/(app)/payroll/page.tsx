"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i > currentYear - 5; i--) {
        years.push(i.toString());
    }
    return years;
}

const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const summaryData = {
    totalHours: "4,230.50",
    overtimeHours: "152.75",
    totalEmployees: 28,
};

export default function PayrollPage() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear().toString();
  const currentMonthIndex = new Date().getMonth();
  const currentMonth = months[currentMonthIndex];

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const handleDownload = () => {
    toast({
      title: "Téléchargement Lancé",
      description: `Votre rapport de paie pour ${month} ${year} est en cours de génération.`,
    });
    // Simulate download
    setTimeout(() => {
        const link = document.createElement("a");
        const content = "Employé,Heures Totales,Heures Supplémentaires\nDr. Elara Vance,168,8\nInfirmière Kai Tanaka,160,0";
        const file = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        link.href = URL.createObjectURL(file);
        link.download = `paie_${month.toLowerCase()}_${year}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Centre de Paie et d'Exports</CardTitle>
        <CardDescription>
          Générez et téléchargez les rapports de paie mensuels au format Excel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Mois</label>
                <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le mois" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Année</label>
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez l'année" />
                    </SelectTrigger>
                    <SelectContent>
                        {generateYears().map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle className="text-lg">Résumé pour {month} {year}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Métrique</TableHead>
                                <TableHead className="text-right">Valeur</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Total des Heures Travaillées</TableCell>
                                <TableCell className="text-right">{summaryData.totalHours} h</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Total des Heures Supplémentaires</TableCell>
                                <TableCell className="text-right">{summaryData.overtimeHours} h</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Total des Employés Traités</TableCell>
                                <TableCell className="text-right">{summaryData.totalEmployees}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        <Button size="lg" className="w-full md:w-auto" onClick={handleDownload}>
            <FileDown className="mr-2 h-5 w-5" />
            Télécharger le Fichier de Paie
        </Button>
      </CardContent>
    </Card>
  );
}
