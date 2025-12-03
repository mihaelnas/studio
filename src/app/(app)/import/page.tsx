import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "./file-uploader";

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Importer les Logs Biométriques</CardTitle>
          <CardDescription>
            Téléchargez le fichier `.txt` brut de votre appareil de pointage biométrique pour traiter les données d'arrivée et de départ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader />
        </CardContent>
      </Card>
    </div>
  );
}
