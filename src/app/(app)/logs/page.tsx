import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { attendanceLogs } from "@/lib/data";

export default function LogsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Pointage</CardTitle>
        <CardDescription>
          Historique brut de tous les événements de pointage importés depuis les appareils biométriques.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date et Heure</TableHead>
                        <TableHead>ID Personnel</TableHead>
                        <TableHead>Prénom</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>N° de Carte</TableHead>
                        <TableHead>Appareil</TableHead>
                        <TableHead>Point d'Événement</TableHead>
                        <TableHead>Type de Vérification</TableHead>
                        <TableHead>Statut E/S</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Remarques</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {attendanceLogs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell>{log.dateTime}</TableCell>
                            <TableCell>{log.personnelId}</TableCell>
                            <TableCell>{log.firstName}</TableCell>
                            <TableCell>{log.lastName}</TableCell>
                            <TableCell>{log.cardNumber}</TableCell>
                            <TableCell>{log.deviceName}</TableCell>
                            <TableCell>{log.eventPoint}</TableCell>
                            <TableCell>{log.verifyType}</TableCell>
                            <TableCell>{log.inOutStatus}</TableCell>
                            <TableCell>{log.eventDescription}</TableCell>
                            <TableCell>{log.remarks}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
