"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, serverTimestamp } from "firebase/firestore";
import type { AttendanceLog } from "@/lib/types";

export function FileUploader() {
  const { firestore } = useFirebase();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      if (acceptedFiles[0].type !== 'text/plain') {
          setStatus('error');
          setErrorMessage("Type de fichier invalide. Veuillez télécharger un fichier .txt.");
          setFile(null);
          return;
      }
      setFile(acceptedFiles[0]);
      setStatus("idle");
      setErrorMessage("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/plain": [".txt"] },
    multiple: false,
  });
    
  const handleUpload = () => {
    if (!file || !firestore) return;
    setStatus("uploading");
    setProgress(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim() !== '');
      const totalLines = lines.length;
      let processedLines = 0;
      let errorCount = 0;

      const attendanceLogsCollection = collection(firestore, "attendanceLogs");

      for (const line of lines) {
        // Assuming the file is tab-separated as is common with ZK devices
        const parts = line.split('\t');
        if (parts.length >= 9) { // Check for minimum required parts
            try {
                const logData: Partial<AttendanceLog> = {
                    dateTime: parts[0],
                    personnelId: parts[1],
                    firstName: parts[2] || '',
                    lastName: parts[3] || '',
                    cardNumber: parts[4] || '',
                    deviceName: parts[5] || 'Unknown',
                    eventPoint: parts[6] || 'Unknown',
                    verifyType: parts[7] || 'Unknown',
                    inOutStatus: parts[8] as any || 'Unknown',
                    eventDescription: parts[9] || '',
                    remarks: parts[10] || '',
                    createdAt: serverTimestamp() as any, // For ordering
                };

                await addDocumentNonBlocking(attendanceLogsCollection, logData);
            } catch (e) {
                console.error("Error adding document: ", e);
                errorCount++;
            }
        } else {
            errorCount++;
        }
        processedLines++;
        setProgress(Math.round((processedLines / totalLines) * 100));
      }
      
      if (errorCount > 0) {
        setStatus("error");
        setErrorMessage(`Importation terminée avec ${errorCount} erreur(s) sur ${totalLines} lignes.`);
      } else {
        setStatus("success");
        setSuccessMessage(`Succès : ${totalLines} pointages traités, 0 erreur. Les registres de présence ont été mis à jour.`);
      }
    };
    reader.onerror = () => {
        setStatus("error");
        setErrorMessage("Impossible de lire le fichier.");
    }
    reader.readAsText(file);
  };
  
  const handleRemoveFile = () => {
      setFile(null);
      setStatus('idle');
      setProgress(0);
      setErrorMessage('');
      setSuccessMessage('');
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors ${
          isDragActive ? "border-primary" : "border-border"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
            </p>
            <p className="text-xs text-muted-foreground">
                Fichiers de log biométriques (.txt uniquement)
            </p>
        </div>
      </div>
      
      {file && status !== 'uploading' && (
        <div className="flex items-center justify-between p-3 border rounded-md bg-secondary/50">
            <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <span className="font-medium text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                <X className="h-4 w-4" />
            </Button>
        </div>
      )}

      {file && status === "idle" && (
        <Button onClick={handleUpload} className="w-full">
          Démarrer l'Importation
        </Button>
      )}

      {status === "uploading" && (
        <div className="space-y-2">
            <p className="text-sm font-medium">Importation de <span className="text-primary">{file?.name}</span>...</p>
            <Progress value={progress} />
        </div>
      )}

      {status === "success" && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">Importation Réussie !</AlertTitle>
          <AlertDescription className="text-green-700">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {status === "error" && (
        <Alert variant="destructive">
          <AlertTitle>Échec de l'Importation</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

    