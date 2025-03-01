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

export function Upload({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  const handleClick = async (e: any) => {
    e.preventDefault();
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Upload successful:", res.data);
    } catch (error) {
      console.error(error);
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
