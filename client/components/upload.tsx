"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useEffect, useState } from "react";
import { headers } from "next/headers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import { LogsMetadata } from "@/types";

export function Upload({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serverName, setServerName] = useState<string>("");
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  // const handleClick = async (e: any) => {
  //   e.preventDefault();
  //   if (!selectedFile) return;
  //   const formData = new FormData();
  //   formData.append("file", selectedFile);

  //   try {
  //     const res = await axios.post(
  //       "http://localhost:8000/api/upload",
  //       formData,
  //       {
  //         headers: { "Content-Type": "multipart/form-data" },
  //       }
  //     );
  //     console.log("Upload successful:", res.data);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const handleUploadMetadata = async (metadata: LogsMetadata) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/logs/upload-metadata",
        metadata,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClick = async (e: React.FormEvent<HTMLFormElement>) => {
    // Ensure that a file is selected before proceeding
    if (!selectedFile) {
      console.error("❌ No file selected!");
      return;
    }
    e.preventDefault();
    try {
      const presignedurlRes = await axios.post(
        "http://localhost:8000/api/get-presigned-url-s3",
        {
          fileName: selectedFile?.name,
          fileType: selectedFile?.type,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const { uploadUrl, newFileName } = presignedurlRes.data;
      const decodedUrl = decodeURIComponent(uploadUrl);

      const uploadFile = await axios.put(decodedUrl, selectedFile, {
        headers: {
          "Content-Type": selectedFile?.type,
        },
        transformRequest: [(data, headers) => data],
      });

      console.log("File uploaded successfully!");

      // 3️⃣ Call handleMetadataUpload ONLY if upload was successful
      await handleUploadMetadata({
        fileName: newFileName,
        s3FilePath: uploadUrl,
        serverName: serverName,
        fileSize: selectedFile?.size,
        fileType: selectedFile?.type,
      });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };
  useEffect(() => {
    console.log(selectedFile);
    // console.log(preSignedUrl);
  }, [selectedFile]);
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Log Parser</CardTitle>
          <CardDescription>Upload your log txt file below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleClick(e)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="logFile">Log File</Label>
                <Input
                  id="logFile"
                  type="file"
                  placeholder="log file here"
                  required
                  onChange={handleFileChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="server">Server</Label>
                <Select
                  value={serverName}
                  onValueChange={(e) => setServerName(e)}
                  required
                >
                  <SelectTrigger id="server" aria-label="Select Server">
                    <SelectValue placeholder="Select Server" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warmaneIcecrow">
                      Warmane-Icecrown
                    </SelectItem>
                    <SelectItem value="whitemaneFrostmourne">
                      Whitemane-Frostmourne
                    </SelectItem>
                    <SelectItem value="warmaneLordaeron">
                      Warmane-Lordaeron
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Upload
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
