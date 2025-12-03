
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollTable } from "./payroll-table";
import { useToast } from "@/hooks/use-toast";
import { sendPayslipsByEmail } from "@/lib/actions";
import { Loader, Send } from "lucide-react";

export default function PayrollPage() {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendPayslips = async () => {
    setIsSending(true);
    const result = await sendPayslipsByEmail();
    setIsSending(false);

    if (result.success) {
      toast({
        title: "Envoi Réussi",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Échec de l'envoi",
        description: result.message,
      });
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle>Paie en Temps Réel</CardTitle>
            <CardDescription>
                Suivi en direct du calcul de la paie pour le mois en cours, basé sur les heures de présence traitées.
            </CardDescription>
        </div>
        <Button onClick={handleSendPayslips} disabled={isSending}>
            {isSending ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Send className="mr-2 h-4 w-4" />
            )}
            {isSending ? "Envoi en cours..." : "Envoyer les Fiches de Paie"}
        </Button>
      </CardHeader>
      <CardContent>
        <PayrollTable />
      </CardContent>
    </Card>
  );
}
