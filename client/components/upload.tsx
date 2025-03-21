"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
// import { headers } from "next/headers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";

import { LogsMetadata } from "@/types";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

// const socket = io("http://localhost:8000");

export function Upload({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enableUpload, setEnableUpload] = useState<boolean>(false);
  const [serverName, setServerName] = useState<string>("");
  const [logId, setLogId] = useState<string>("");
  const [status, setStatus] = useState<string>("processing");
  const [progress, setProgress] = useState({ stage: "", progress: 0 });

  const socketRef = useRef<Socket | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      //  Enforce .zip file uploads
      if (!e.target.files[0].name.endsWith(".zip")) {
        setEnableUpload(false);
        toast("Please upload a .zip file only!");
        return;
      }
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleNavigation = () => {
    if (!logId) return;
    router.push(`/logs/${logId}`);
  };

  const handleUploadMetadata = async (metadata: LogsMetadata) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/upload-logs/upload-metadata",
        metadata,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(response.data);
      setLogId(response?.data?.log.logId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClick = async (e: React.FormEvent<HTMLFormElement>) => {
    // Ensure that a file is selected before proceeding
    if (!selectedFile) {
      console.error(" No file selected!");
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

      setSelectedFile(null);
      setServerName("");
      setEnableUpload(false);
    } catch (error) {
      console.error("Upload failed:", error);
    }
    setSelectedFile(null);
    setServerName("");
    setEnableUpload(false);
  };
  useEffect(() => {
    if (selectedFile && serverName) setEnableUpload(true);
  }, [selectedFile, serverName]);

  useEffect(() => {
    if (!logId) return;

    console.log("🔍 Listening for WebSocket event:", `log:${logId}`);

    if (!socketRef.current) {
      socketRef.current = io("http://localhost:8000", {
        reconnectionAttempts: 5, // ✅ Try reconnecting 5 times
        reconnectionDelay: 2000, // ✅ Wait 2 seconds between reconnects
      });
    }

    const socket = socketRef.current;
    socket.on(`log:${logId}`, (data) => {
      console.log("Progress Update Received:", data);
      setProgress(data);
    });

    return () => {
      socket.off(`log:${logId}`);
    };
  }, [logId]);

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

              <Button type="submit" className="w-full" disabled={!enableUpload}>
                Upload
              </Button>
            </div>
          </form>
          {logId && (
            <div className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>
                    Processing Log: <Badge>{logId}</Badge>
                  </CardTitle>
                  <CardDescription>
                    <span className="font-medium">Stage:</span> {progress.stage}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    <span className="font-medium">Status: </span>{" "}
                    {progress.stage === "saving to database completed"
                      ? "Completed"
                      : `${progress.progress}%`}
                  </p>
                  {progress.stage !== "saving to database completed" && (
                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                      <Progress value={progress.progress} />
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {progress.stage === "saving to database completed" && (
                    <Button className="w-full" onClick={handleNavigation}>
                      View Log
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
