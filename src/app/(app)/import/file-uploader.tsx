"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      if (acceptedFiles[0].type !== 'text/plain') {
          setStatus('error');
          setErrorMessage("Invalid file type. Please upload a .txt file.");
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
    if (!file) return;
    setStatus("uploading");
    setProgress(0);

    // Simulate file upload
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          return prev;
        }
        return prev + 10;
      });
    }, 200);
    
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      // Simulate a random error
      if (Math.random() > 0.8) {
          setStatus("error");
          setErrorMessage("An unexpected error occurred during processing. The log file might be corrupted.");
      } else {
          setStatus("success");
      }
    }, 2500);
  };
  
  const handleRemoveFile = () => {
      setFile(null);
      setStatus('idle');
      setProgress(0);
      setErrorMessage('');
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
                <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
                Biometric log files (.txt only)
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
          Start Import
        </Button>
      )}

      {status === "uploading" && (
        <div className="space-y-2">
            <p className="text-sm font-medium">Importing <span className="text-primary">{file?.name}</span>...</p>
            <Progress value={progress} />
        </div>
      )}

      {status === "success" && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">Import Successful!</AlertTitle>
          <AlertDescription className="text-green-700">
            Success: 150 pointages traités, 0 erreur. The attendance records have been updated.
          </AlertDescription>
        </Alert>
      )}
      
      {status === "error" && (
        <Alert variant="destructive">
          <AlertTitle>Import Failed</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
            {errorMessage.includes("corrupted") && (
                <pre className="mt-2 p-2 bg-destructive/10 rounded-md font-code text-xs"><code>Error on line 42: Invalid time format '25:70'</code></pre>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
