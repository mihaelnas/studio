import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "./file-uploader";

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Import Biometric Logs</CardTitle>
          <CardDescription>
            Upload the raw `.txt` file from your biometric attendance device to process clock-in and clock-out data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader />
        </CardContent>
      </Card>
    </div>
  );
}
