"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud, FileText, X, AlertCircle, CheckCircle2, RefreshCw,
  Loader2, ArrowRight,
} from "lucide-react";
import { generateReactHelpers } from "@uploadthing/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseResume } from "@/actions/parse-resume";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

interface UploadProgress {
  name: string;
  progress: number;
  status: "uploading" | "parsing" | "completed" | "error";
  error?: string;
  resumeId?: string;
}

export function UploadResume() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("resumeUploader", {
    onClientUploadComplete: async (res) => {
      if (!res || res.length === 0) return;

      const file = res[0];
      setUploadProgress((prev) =>
        prev ? { ...prev, status: "parsing", progress: 100 } : null
      );

      const result = await parseResume({
        title: file.name.replace(/\.[^.]+$/, ""),
        fileUrl: file.ufsUrl ?? file.url,
        fileKey: file.key,
        fileName: file.name,
        fileType: file.name.endsWith(".pdf") ? "pdf" : "docx",
        fileSize: file.size,
      });

      if (result.success) {
        setUploadProgress((prev) =>
          prev ? { ...prev, status: "completed", progress: 100, resumeId: result.data.resumeId } : null
        );
      } else {
        setUploadProgress((prev) =>
          prev ? { ...prev, status: "error", error: result.error } : null
        );
      }
    },
    onUploadError: (error) => {
      setUploadProgress((prev) =>
        prev ? { ...prev, status: "error", error: error.message } : null
      );
    },
    onUploadProgress: (p) => {
      setUploadProgress((prev) =>
        prev ? { ...prev, progress: p } : null
      );
    },
  });

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload a PDF or DOCX file.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 8MB limit.";
    }
    return null;
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);

    if (validationError) {
      setUploadProgress({
        name: file.name,
        progress: 0,
        status: "error",
        error: validationError,
      });
      return;
    }

    setSelectedFile(file);
    setUploadProgress({
      name: file.name,
      progress: 0,
      status: "uploading",
    });

    await startUpload([file]);
  }, [startUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      setUploadProgress({
        name: selectedFile.name,
        progress: 0,
        status: "uploading",
      });
      startUpload([selectedFile]);
    }
  }, [selectedFile, startUpload]);

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const getFileIcon = () => {
    return <FileText className="h-10 w-10 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-8 text-center",
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
          uploadProgress?.status === "completed" && "border-green-500 bg-green-50",
          uploadProgress?.status === "error" && "border-red-500 bg-red-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploadProgress?.status === "uploading"}
        />

        {!uploadProgress ? (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-blue-100 p-4">
              <UploadCloud className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your resume here or click to upload
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports PDF and DOCX up to 8MB
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {getFileIcon()}
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">{uploadProgress.name}</p>
              {selectedFile && (
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {uploadProgress.status === "uploading" && (
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              )}
              {uploadProgress.status === "completed" && (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              )}
              {uploadProgress.status === "error" && (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {(uploadProgress?.status === "uploading" || uploadProgress?.status === "parsing") && (
          <div className="mt-4">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  uploadProgress.status === "parsing" ? "bg-purple-600" : "bg-blue-600"
                )}
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-2">
              {uploadProgress.status === "parsing" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {uploadProgress.status === "uploading"
                ? `Uploading... ${uploadProgress.progress}%`
                : "Parsing resume with AI..."}
            </p>
          </div>
        )}

        {uploadProgress?.status === "error" && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{uploadProgress.error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {uploadProgress?.status === "completed" && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700 font-medium">Resume parsed successfully!</p>
            </div>
            <Button asChild variant="premium" size="sm">
              <Link href={`/dashboard/resume/${uploadProgress.resumeId}`}>
                View Analysis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}