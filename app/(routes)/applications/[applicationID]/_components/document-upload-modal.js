"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  Trash2,
  FileSpreadsheet,
  FileImage,
  FileCode,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  uploadStaffDocument,
  getStaffDocuments,
  deleteStaffDocument,
} from "@/actions/staff-documents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StaffDocuments from "./staff-documents";

const MAX_FILES = 5;

// Helper function to get the appropriate icon based on file type
const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();

  // Excel files
  if (["xlsx", "xls", "csv", "numbers"].includes(extension)) {
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  }

  // Image files
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(extension)) {
    return <FileImage className="h-4 w-4 text-blue-500" />;
  }

  // PDF files
  if (extension === "pdf") {
    return <FileText className="h-4 w-4 text-red-500" />;
  }

  // Archive files
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return <FileText className="h-4 w-4 text-yellow-500" />;
  }

  // Code/text files
  if (
    ["txt", "doc", "docx", "rtf", "md", "html", "js", "css", "json"].includes(
      extension
    )
  ) {
    return <FileCode className="h-4 w-4 text-purple-500" />;
  }

  // Default file icon
  return <FileText className="h-4 w-4 text-gray-500" />;
};

// Helper function to check if file is previewable
const isPreviewable = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  // Currently only supporting image previews
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
};

const FilePreviewModal = ({ file, onClose }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [file]);

  if (!preview)
    return <div className="p-8 text-center">Loading preview...</div>;

  const extension = file.name.split(".").pop().toLowerCase();

  return (
    <Dialog open={!!file} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Preview: {file.name}</DialogTitle>
          <div className="border-2 border-primary w-[25%] rounded-sm" />
        </DialogHeader>

        <div className="mt-4 flex justify-center">
          {["jpg", "jpeg", "png", "gif", "webp"].includes(extension) ? (
            <div className="relative max-h-[500px] overflow-auto">
              <img
                src={preview}
                alt={file.name}
                className="max-w-full h-auto object-contain"
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p>Preview not available for this file type</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DocumentUploadModal = ({ applicationId }) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [filePreviews, setFilePreviews] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const dropZoneRef = useRef(null);
  const router = useRouter();

  // Fetch documents on component mount
  useEffect(() => {
    // Immediate fetch on mount
    fetchDocuments();
    
    // Set up a refresh interval to keep the count updated
    const intervalId = setInterval(fetchDocuments, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(intervalId); // Clean up on unmount
    };
  }, [applicationId]);

  const fetchDocuments = async () => {
    try {
      setError(null);
      const response = await getStaffDocuments(applicationId);
      
      if (response.error) {
        console.error("Error fetching documents:", response.error);
        setError(response.error);
        setDocuments([]);
      } else {
        setDocuments(response.documents || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Failed to fetch documents");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open, applicationId]);

  // Generate previews for image files
  useEffect(() => {
    const newPreviews = {};

    files.forEach((file, index) => {
      if (isPreviewable(file.name)) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews((prev) => ({
            ...prev,
            [`${file.name}-${index}`]: reader.result,
          }));
        };
        reader.readAsDataURL(file);
      }
    });

    return () => {
      // Clean up any object URLs when component unmounts
      Object.values(filePreviews).forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [files]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      // Check if adding these files would exceed the limit
      if (files.length + selectedFiles.length > MAX_FILES) {
        toast.warning(`You can only upload up to ${MAX_FILES} files at once`);
        // Add as many files as possible up to the limit
        const availableSlots = MAX_FILES - files.length;
        if (availableSlots > 0) {
          setFiles((prev) => [
            ...prev,
            ...selectedFiles.slice(0, availableSlots),
          ]);
        }
      } else {
        setFiles((prev) => [...prev, ...selectedFiles]);
      }
    }
    // Reset the input value so the same file can be selected again
    e.target.value = "";
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set isDragging to false if we're leaving the dropzone itself
    // not when leaving its children
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      // Check if adding these files would exceed the limit
      if (files.length + droppedFiles.length > MAX_FILES) {
        toast.warning(`You can only upload up to ${MAX_FILES} files at once`);
        // Add as many files as possible up to the limit
        const availableSlots = MAX_FILES - files.length;
        if (availableSlots > 0) {
          setFiles((prev) => [
            ...prev,
            ...droppedFiles.slice(0, availableSlots),
          ]);
        }
      } else {
        setFiles((prev) => [...prev, ...droppedFiles]);
      }
    }
  };

  const uploadFile = async (file) => {
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", applicationId);
      
      const result = await uploadStaffDocument(formData);

      return result;
    } catch (error) {
      console.error("Upload error:", error);
      return { error: "Failed to upload document" };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    setIsUploading(true);
    setError(null);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      const file = files[i];

      try {
        const result = await uploadFile(file);

        if (result.error) {
          console.error("Upload error:", result.error);
          toast.error(`Error uploading ${file.name}: ${result.error}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Error uploading ${file.name}: ${error.message || "Unknown error"}`);
        errorCount++;
      }
    }

    setIsUploading(false);
    setCurrentFileIndex(null);

    if (successCount > 0) {
      if (errorCount > 0) {
        toast.warning(
          `Uploaded ${successCount} files successfully. ${errorCount} files failed.`
        );
      } else {
        toast.success(`Uploaded ${successCount} files successfully`);
      }
      setFiles([]);
      setFilePreviews({});
      fetchDocuments();
    } else if (errorCount > 0) {
      toast.error(
        "Failed to upload documents. The system may need to be configured for document uploads."
      );
    }
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFiles([]);
      setError(null);
      setCurrentFileIndex(null);
      setFilePreviews({});
    }
  };

  const handleDelete = async (documentId) => {
    try {
      setError(null);
      const result = await deleteStaffDocument(documentId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Document deleted successfully");
        fetchDocuments();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button size="default2" className="relative">
            <Upload className="mr-2 h-4 w-4" />
            Staff Upload
            {documents.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white border-2 border-white shadow-sm">
                {documents.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Staff Upload</DialogTitle>
            <div className="border-2 border-primary w-[25%] rounded-sm" />
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="mb-4">
                <div
                  ref={dropZoneRef}
                  className={`border-2 border-dashed rounded-md p-6 ${
                    isDragging ? "border-primary bg-primary/5" : 
                    files.length > 0 ? "border-primary" : "border-stroke dark:border-strokedark"
                  } flex flex-col items-center justify-center ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} transition-colors`}
                  onClick={() => !isUploading && document.getElementById("file-input").click()}
                  onDragEnter={!isUploading ? handleDragEnter : undefined}
                  onDragOver={!isUploading ? handleDragOver : undefined}
                  onDragLeave={!isUploading ? handleDragLeave : undefined}
                  onDrop={!isUploading ? handleDrop : undefined}
                >
                  {files.length > 0 ? (
                    <div className="w-full">
                      <div className="flex flex-col items-center mb-4">
                        {isUploading ? (
                          <Loader2 className="h-10 w-10 text-primary mb-2 animate-spin" />
                        ) : (
                          <FileText className="h-10 w-10 text-primary mb-2" />
                        )}
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {isUploading ? 'Uploading files...' : `${files.length} ${files.length === 1 ? 'file' : 'files'} selected`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {isUploading 
                            ? `Processing ${currentFileIndex !== null ? currentFileIndex + 1 : '0'} of ${files.length}` 
                            : files.length < MAX_FILES ? 'Click or drag to add more files' : 'Maximum files reached'}
                        </p>
                      </div>

                      <div className="max-h-[150px] overflow-y-auto">
                        {files.map((file, index) => {
                          const fileKey = `${file.name}-${index}`;
                          const hasPreview = isPreviewable(file.name);
                          const previewUrl = filePreviews[fileKey];

                          return (
                            <div
                              key={fileKey}
                              className={`flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded mb-2 ${hasPreview ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (hasPreview) {
                                  handlePreview(file);
                                }
                              }}
                            >
                              <div className="flex items-center">
                                {getFileIcon(file.name)}
                                <div className="ml-2">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[400px]">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {(file.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <div
                                className="flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className={`h-8 w-8 ${
                                          isUploading
                                            ? "opacity-50 cursor-not-allowed text-gray-400"
                                            : "text-gray-500 hover:text-red-500"
                                        }`}
                                        onClick={() => !isUploading && handleRemoveFile(index)}
                                        disabled={isUploading}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Remove file</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload
                        className={`h-10 w-10 ${isDragging ? "text-primary" : "text-gray-400"} mb-2`}
                      />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {isDragging
                          ? "Drop files here"
                          : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PDF, Word, Excel, or image files (max {MAX_FILES} files)
                      </p>
                    </div>
                  )}
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-primary text-white"
                  disabled={files.length === 0 || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading{" "}
                      {currentFileIndex !== null
                        ? `(${currentFileIndex + 1}/${files.length})`
                        : "..."}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {files.length > 0 ? files.length : ""}{" "}
                      Document{files.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Documents List */}
            <div className="border-t border-stroke pt-4">
              <h3 className="text-md font-medium mb-2">Uploaded Documents</h3>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <p>Loading documents...</p>
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {error ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                      <p className="text-sm font-medium text-gray-900">
                        Error loading documents
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        The document system may need to be configured by an
                        administrator.
                      </p>
                    </div>
                  ) : (
                    <StaffDocuments
                      documents={documents}
                      onDelete={handleDelete}
                      isDisabled={isUploading}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
};

export default DocumentUploadModal;
