"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, FileImage, FileCode, Download, Trash2, AlertCircle, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { formatDateTime, formatTimeAgo } from "@/lib/utils";

const StaffDocuments = ({ documents = [], onDelete, isDisabled = false }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();

  // Check if any actions should be disabled (either uploading or deleting)
  const areActionsDisabled = isDisabled || isDeleting;

  const handleDelete = async (documentId) => {
    try {
      setIsDeleting(true);
      setDeletingId(documentId);
      
      if (onDelete) {
        await onDelete(documentId);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  // Function to handle file download
  const handleDownload = async (doc) => {
    try {
      // Fetch the file
      const response = await fetch(doc.fileUrl);
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  // Function to check if file is previewable
  const isPreviewable = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    // Files that can be previewed in browser
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(extension);
  };

  // Function to get file type
  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    }
    return 'other';
  };

  // Function to get file icon based on file extension
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    // Excel files
    if (['xlsx', 'xls', 'csv', 'numbers'].includes(extension)) {
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    }
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return <FileImage className="h-4 w-4 text-blue-500" />;
    }
    
    // PDF files
    if (extension === 'pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <FileText className="h-4 w-4 text-yellow-500" />;
    }
    
    // Code/text files
    if (['txt', 'doc', 'docx', 'rtf', 'md', 'html', 'js', 'css', 'json'].includes(extension)) {
      return <FileCode className="h-4 w-4 text-purple-500" />;
    }
    
    // Default file icon
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  return (
    <>
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-gray-50 rounded-full p-3 mb-3">
            <AlertCircle className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">No documents uploaded</p>
          <p className="text-xs text-gray-500 mt-1">
            Upload documents related to this application
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stroke">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 hover:bg-gray-50/50 transition-colors"
            >
              {/* Document Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-gray/80 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {doc.user.firstName[0] + doc.user.lastName[0]}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {doc.user.firstName + " " + doc.user.lastName}
                    </span>
                    <span className="inline-flex w-fit items-center rounded-md bg-meta-1 text-white py-0.5 px-2 text-xs font-medium">
                      {doc.user.role}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end text-xs text-gray-500">
                  <span>{formatDateTime(doc.createdAt).date}</span>
                  <span className="text-gray-400">
                    {formatTimeAgo(doc.createdAt)}
                  </span>
                </div>
              </div>

              {/* Document Content */}
              <div className="pl-[42px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.fileName)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.fileName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isPreviewable(doc.fileName) && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 text-gray-500 rounded-full ${
                          areActionsDisabled 
                            ? "opacity-50 cursor-not-allowed" 
                            : "hover:text-blue-500 hover:bg-gray-100 transition-colors"
                        }`}
                        onClick={(e) => areActionsDisabled && e.preventDefault()}
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!areActionsDisabled) {
                          handleDownload(doc);
                        }
                      }}
                      className={`p-2 text-gray-500 rounded-full ${
                        areActionsDisabled 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:text-primary hover:bg-gray-100"
                      }`}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => !areActionsDisabled && handleDelete(doc.id)}
                      disabled={areActionsDisabled}
                      className={`p-2 text-gray-500 rounded-full ${
                        isDeleting && deletingId === doc.id
                          ? "opacity-100" // Keep the active delete button visible
                          : areActionsDisabled
                            ? "opacity-50 cursor-not-allowed" 
                            : "hover:text-red hover:bg-gray-100 transition-colors"
                      }`}
                    >
                      {isDeleting && deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default StaffDocuments;
