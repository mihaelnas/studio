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
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

const summaryData = {
    totalHours: "4,230.50",
    overtimeHours: "152.75",
    totalEmployees: 28,
};

export default function PayrollPage() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = months[new Date().getMonth()];

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: `Your payroll report for ${month} ${year} is being generated.`,
    });
    // Simulate download
    setTimeout(() => {
        const link = document.createElement("a");
        const content = "Employee,Total Hours,Overtime Hours\nDr. Elara Vance,168,8\nNurse Kai Tanaka,160,0";
        const file = new Blob([content], { type: 'text/csv' });
        link.href = URL.createObjectURL(file);
        link.download = `payroll_${month.toLowerCase()}_${year}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll & Exports Center</CardTitle>
        <CardDescription>
          Generate and download monthly payroll reports in Excel format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Month</label>
                <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {generateYears().map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle className="text-lg">Summary for {month} {year}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Total Hours Worked</TableCell>
                                <TableCell className="text-right">{summaryData.totalHours} hrs</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Total Overtime Hours</TableCell>
                                <TableCell className="text-right">{summaryData.overtimeHours} hrs</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Total Employees Processed</TableCell>
                                <TableCell className="text-right">{summaryData.totalEmployees}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        <Button size="lg" className="w-full md:w-auto" onClick={handleDownload}>
            <FileDown className="mr-2 h-5 w-5" />
            Download Excel de Paie
        </Button>
      </CardContent>
    </Card>
  );
}
