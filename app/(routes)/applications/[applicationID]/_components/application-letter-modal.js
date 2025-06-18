"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  Check,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Send,
  Loader2,
} from "lucide-react";
import { Tree, TreeItem, TreeItemLabel } from "@/components/tree";
import {
  hotkeysCoreFeature,
  syncDataLoaderFeature,
  selectionFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { getDocumentTemplateReview } from "@/lib/doc-preview.js";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function to convert ArrayBuffer/Uint8Array to base64 without stack overflow
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // Process in chunks to avoid stack overflow

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }

  return btoa(binary);
}

// Template data structure
const letterTemplatesData = {
  root: { name: "Letter Templates", children: ["attendance", "generic"] },
  attendance: {
    name: "Attendance",
    children: ["non-attendance-a", "non-attendance-b", "non-attendance-c"],
  },
  generic: { name: "Generic", children: ["student_status", "council_tax"] },
  "non-attendance-a": {
    name: "Non-Attendance - Letter A",
    subject: "Attendance Notice - First Warning",
  },
  "non-attendance-b": {
    name: "Non-Attendance - Letter B",
    subject: "Attendance Notice - Second Warning",
  },
  "non-attendance-c": {
    name: "Non-Attendance - Letter C",
    subject: "Attendance Notice - Final Warning",
  },
  student_status: { name: "Student Status", subject: "Student Status" },
  council_tax: { name: "Council Tax", subject: "Council Tax" },
};

const ApplicationLetterModal = ({ open, onOpenChange, application }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [sendingStatus, setSendingStatus] = useState("idle");
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Ensure component only renders on client to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      resetModalState();
    }
  }, [open]);

  const resetModalState = () => {
    setSelectedTemplate(null);
    setPreviewData(null);
    setIsLoadingPreview(false);
    setZoomLevel(1);
    setSendingStatus("idle");
    // Clean up scrollbar hiding classes
    document.querySelectorAll(".hide-scrollbar").forEach((container) => {
      container.classList.remove("hide-scrollbar");
    });
  };

  const tree = useTree({
    initialState: {
      expandedItems: ["root"],
      selectedItems: selectedTemplate ? [selectedTemplate.id] : [],
    },
    indent: 20,
    rootItemId: "root",
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (itemId) => letterTemplatesData[itemId],
      getChildren: (itemId) => letterTemplatesData[itemId]?.children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature, selectionFeature],
    setSelectedItems: (selectedIds) => {
      const selectedId = selectedIds[0];
      if (
        selectedId &&
        letterTemplatesData[selectedId] &&
        !letterTemplatesData[selectedId].children
      ) {
        const templateData = letterTemplatesData[selectedId];
        const template = {
          id: selectedId,
          name: templateData.name,
          subject:
            templateData.subject ||
            `Regarding Your Application: ${application.id}`,
          content: templateData.content || "",
        };
        setSelectedTemplate(template);
        loadDocumentPreview(template);
      } else {
        setSelectedTemplate(null);
        setPreviewData(null);
        setZoomLevel(1);
      }
    },
  });

  // Load document preview
  const loadDocumentPreview = async (template, customZoomLevel = null) => {
    setIsLoadingPreview(true);
    setPreviewData(null);

    const currentZoom = customZoomLevel !== null ? customZoomLevel : zoomLevel;

    try {
      const result = await getDocumentTemplateReview(
        template,
        application,
        currentZoom
      );
      setPreviewData(result);
    } catch (error) {
      console.error("Error loading document preview:", error);
      setPreviewData({
        success: false,
        error: "Failed to load document preview",
        preview: null,
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Unified zoom handler
  const handleZoom = (newZoom) => {
    setZoomLevel(newZoom);
    if (selectedTemplate) {
      loadDocumentPreview(selectedTemplate, newZoom);
    }
  };

  const handleSendLetter = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Please select a template first",
        variant: "destructive",
      });
      return;
    }

    setSendingStatus("sending");

    try {
      // Generate PDF
      const pdfResponse = await getDocumentTemplateReview(
        selectedTemplate,
        application,
        zoomLevel
      );

      if (!pdfResponse || !pdfResponse.pdfBytes) {
        toast({
          title: "Failed to generate PDF",
          variant: "destructive",
        });
        setSendingStatus("failed");
        return;
      }

      // Convert PDF bytes to base64 for email attachment
      const pdfBase64 = arrayBufferToBase64(pdfResponse.pdfBytes);

      // Send email with PDF attachment
      const emailResponse = await fetch("/api/letters/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: application.id,
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          subject:
            selectedTemplate.subject || `Letter from City of London College`,
          pdfAttachment: {
            filename: `${selectedTemplate.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${application.firstName}_${application.lastName}.pdf`,
            content: pdfBase64,
          },
        }),
      });

      if (!emailResponse.ok) {
        let errorData;
        try {
          errorData = await emailResponse.json();
        } catch (parseError) {
          // If response is not JSON (like HTML error page), create generic error
          const responseText = await emailResponse.text();
          console.error("Non-JSON error response:", responseText);
          throw new Error(
            `Server error (${emailResponse.status}): ${responseText.includes("<html>") ? "Server returned HTML error page" : responseText.substring(0, 100)}`
          );
        }
        throw new Error(errorData.error || "Failed to send email");
      }

      let result;
      try {
        result = await emailResponse.json();
      } catch (parseError) {
        console.error("Error parsing success response:", parseError);
        throw new Error("Email sent but received invalid response from server");
      }

      toast({
        title: `Letter sent successfully!`,
        variant: "success",
      });

      setSendingStatus("sent");

      // Close modal after successful send
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);

      // Update router
      router.refresh();
    } catch (error) {
      console.error("Error sending letter:", error);
      toast({
        title: "Failed to send letter",
        description: error.message,
        variant: "destructive",
      });
      setSendingStatus("failed");
    }
  };

  const handleDownloadPDF = () => {
    if (!previewData?.success || !previewData.pdfBytes) {
      toast({ title: "No PDF available to download", variant: "destructive" });
      return;
    }

    try {
      const blob = new Blob([previewData.pdfBytes], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedTemplate.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${application.firstName}_${application.lastName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "PDF downloaded successfully", variant: "success" });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  // Render preview content based on state
  const renderPreviewContent = () => {
    if (isLoadingPreview) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            </div>
            <p className="text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (previewData?.success && previewData.preview) {
      return (
        <div className="h-full overflow-auto">
          <div
            key={`${selectedTemplate?.id}-${zoomLevel}`}
            className="p-4 flex flex-col items-center min-h-full"
          >
            <div
              ref={(el) => {
                if (el && previewData.preview) {
                  el.innerHTML = "";
                  if (zoomLevel > 1) {
                    const wrapper = document.createElement("div");
                    wrapper.style.cssText = `
                      width: ${150 * zoomLevel}%;
                      padding: 80px;
                      display: flex;
                      justify-content: center;
                      min-height: 100%;
                    `;
                    wrapper.appendChild(previewData.preview);
                    el.appendChild(wrapper);
                  } else {
                    el.appendChild(previewData.preview);
                  }
                }
              }}
              className={
                zoomLevel > 1 ? "w-full" : "w-full flex justify-center"
              }
            />
            <div className="w-full flex justify-center mt-2">
              <p className="text-xs text-muted-foreground text-center">
                Preview of {selectedTemplate?.name || "Selected Template"}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Handle case where preview generation succeeded but preview is null (PDF.js issues)
    if (previewData?.success && !previewData.preview && selectedTemplate) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-lg font-semibold mb-2">
              {selectedTemplate.name}
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              Template ready to send
            </p>
            <p className="text-xs text-muted-foreground">
              Preview temporarily unavailable
            </p>
          </div>
        </div>
      );
    }

    if (previewData && !previewData.success) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-2 bg-destructive/10 rounded-full mb-4">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
            <h4 className="text-lg font-semibold mb-2 text-destructive">
              Preview Error
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              {previewData.error || "Could not load document preview"}
            </p>
            {selectedTemplate && (
              <p className="text-xs text-muted-foreground">
                Template: {selectedTemplate.name}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (selectedTemplate) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-lg font-semibold mb-2">
              {selectedTemplate.name}
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              Template selected and ready to send
            </p>
            <p className="text-xs text-muted-foreground">
              Preview not available for this template
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-2 bg-muted rounded-full mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Please select a template to see preview
          </p>
        </div>
      </div>
    );
  };

  // Don't render until we're on the client to prevent hydration issues
  if (!isClient) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl md:max-w-5xl p-6"
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onOpenChange(false);
        }}
      >
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Send Letter
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Application ID: {application.id} | Recipient:{" "}
            {application.firstName} {application.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
          {/* Template Selection */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <span className="inline-block w-1 h-4 bg-primary mr-2"></span>
              Select a Template
            </h3>
            <div className="border rounded-md shadow-sm overflow-y-auto max-h-[400px] bg-card">
              <Tree
                className="space-y-2 p-3 relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]"
                indent={20}
                tree={tree}
              >
                {tree.getItems().map((item) => {
                  const isLeaf = !item.isFolder();
                  const isRoot = item.getId() === "root";
                  const isCategory = item.isFolder() && !isRoot;

                  return (
                    <TreeItem key={item.getId()} item={item}>
                      <TreeItemLabel
                        className={`before:bg-background relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10 
                          ${isLeaf && item.isSelected() ? "bg-primary/10 border border-primary rounded-sm" : ""}
                          ${isCategory ? "font-medium text-base" : ""}
                        `}
                      >
                        <span className="-order-1 flex flex-1 items-center gap-2">
                          {item.isFolder() ? (
                            item.isExpanded() ? (
                              <FolderOpenIcon
                                className={`text-muted-foreground pointer-events-none ${isCategory ? "size-5" : "size-4"}`}
                              />
                            ) : (
                              <FolderIcon
                                className={`text-muted-foreground pointer-events-none ${isCategory ? "size-5" : "size-4"}`}
                              />
                            )
                          ) : (
                            <FileIcon className="text-muted-foreground pointer-events-none size-4" />
                          )}
                          {item.getItemName()}
                          {isLeaf && item.isSelected() && (
                            <Check className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </span>
                      </TreeItemLabel>
                    </TreeItem>
                  );
                })}
              </Tree>
            </div>
          </div>

          {/* Document Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center">
                <span className="inline-block w-1 h-4 bg-secondary mr-2"></span>
                Document Preview
              </h3>
              {previewData?.success && (
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleZoom(Math.max(zoomLevel - 0.25, 0.25))
                          }
                          disabled={zoomLevel <= 0.25}
                          className="h-8 w-8 p-0"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom out</TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleZoom(Math.min(zoomLevel + 0.25, 3))
                          }
                          disabled={zoomLevel >= 3}
                          className="h-8 w-8 p-0"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom in</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleZoom(1)}
                          className="h-8 w-8 p-0"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reset zoom to 100%</TooltipContent>
                    </Tooltip>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadPDF}
                          className="h-8 w-8 p-0"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download PDF</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
            <div className="border rounded-md shadow-sm h-[450px] bg-card relative overflow-hidden">
              {renderPreviewContent()}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t mt-2">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {sendingStatus === "idle" && selectedTemplate
                ? `Ready to send "${selectedTemplate.name}" template`
                : sendingStatus === "sending"
                  ? "Sending letter..."
                  : sendingStatus === "sent"
                    ? "Letter sent successfully!"
                    : sendingStatus === "failed"
                      ? "Failed to send letter"
                      : "Select a template to continue"}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sendingStatus === "sending"}
              >
                {sendingStatus === "sent" ? "Close" : "Cancel"}
              </Button>
              <Button
                onClick={handleSendLetter}
                disabled={
                  !selectedTemplate ||
                  sendingStatus === "sending" ||
                  sendingStatus === "sent"
                }
                className="px-6"
              >
                {sendingStatus === "sending" ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Sending...
                  </>
                ) : sendingStatus === "sent" ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Sent
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Letter
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationLetterModal;
