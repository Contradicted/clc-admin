"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Label } from "@/components/ui/label.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { FileIcon, FolderIcon, FolderOpenIcon, Check, Send, FileText } from "lucide-react";
import { Tree, TreeItem, TreeItemLabel } from "@/components/tree.jsx";
import { hotkeysCoreFeature, syncDataLoaderFeature, selectionFeature } from "@headless-tree/core";
import { AssistiveTreeDescription, useTree } from "@headless-tree/react";
import { toast } from "sonner";

// Mock template data (ideally fetched from API)
const letterTemplatesData = {
  root: {
    name: "Letter Templates",
    children: ["attendance", "generic"],
  },
  attendance: {
    name: "Attendance",
    children: ["non-attendance-a", "non-attendance-b", "non-attendance-c"],
  },
  generic: {
    name: "Generic",
    children: ["student_status", "council_tax"],
  },
  "non-attendance-a": { name: "Non-Attendance - Letter A", subject: "Attendance Notice - First Warning" },
  "non-attendance-b": { name: "Non-Attendance - Letter B", subject: "Attendance Notice - Second Warning" },
  "non-attendance-c": { name: "Non-Attendance - Letter C", subject: "Attendance Notice - Final Warning" },
  "student_status": { name: "Student Status", subject: "Student Status" },
  "council_tax": { name: "Council Tax", subject: "Council Tax" },
};

const indent = 20;

const ApplicationLetterModal = ({ open, onOpenChange, application = { id: "4564564564" }, student = { firstName: "John", lastName: "Doe" } }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedTemplate(null);
    }
  }, [open]);

  const tree = useTree({
    initialState: {
      expandedItems: ["root"],
      selectedItems: selectedTemplate ? [selectedTemplate.id] : [],
    },
    indent,
    rootItemId: "root",
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (itemId) => letterTemplatesData[itemId],
      getChildren: (itemId) => letterTemplatesData[itemId]?.children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature, selectionFeature],
    setSelectedItems: (selectedIds) => {
      const selectedId = selectedIds[0]; // Assuming single selection for templates

      if (selectedId && letterTemplatesData[selectedId] && !letterTemplatesData[selectedId].children) {
        // It's a leaf node (actual template)
        const templateData = letterTemplatesData[selectedId];
        const template = {
          id: selectedId,
          name: templateData.name,
          subject: templateData.subject || `Regarding Your Application: ${application.id}`,
          content: templateData.content || "",
        };
        
        setSelectedTemplate(template);
      } else {
        setSelectedTemplate(null);
      }
    },
  });

  const handleSendLetter = () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first");
      return;
    }
    
    // Here you would typically send the letter via API
    console.log(`Sending letter to ${student.firstName} ${student.lastName} using template: ${selectedTemplate.name}`);
    console.log(`Subject: ${selectedTemplate.subject || selectedTemplate.name}`);
    console.log(`Template ID: ${selectedTemplate.id}`);
    
    // In a real implementation, the API would use the template ID to get the full template content
    toast.success(`Letter based on '${selectedTemplate.name}' sent to ${student.firstName} ${student.lastName}. (Simulated send)`);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent 
        className="sm:max-w-4xl md:max-w-5xl p-6" 
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onOpenChange(false);
        }}
      >
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Send Letter</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Application ID: {application.id} | Recipient: {student.firstName} {student.lastName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
          {/* Left side: Template selection */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <span className="inline-block w-1 h-4 bg-primary mr-2"></span>
              Select a Template
            </h3>
            <div className="border rounded-md shadow-sm overflow-y-auto max-h-[400px] bg-card">
              <Tree
                className="space-y-2 p-3 relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]" 
                indent={indent}
                tree={tree}>
                {tree.getItems().map((item) => {
                  const isLeaf = !item.isFolder();
                  const isRoot = item.getId() === "root";
                  const isCategory = item.isFolder() && !isRoot;
                  
                  return (
                    <TreeItem 
                      key={item.getId()} 
                      item={item} 
                      // className={isCategory ? "mt-4" : ""}
                    >
                      <TreeItemLabel
                        className={`before:bg-background relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10 
                          ${isLeaf && item.isSelected() ? "bg-primary/10 border border-primary rounded-sm" : ""}
                          ${isCategory ? "font-medium text-base" : ""}
                        `}
                      >
                        <span className="-order-1 flex flex-1 items-center gap-2">
                          {item.isFolder() ? (
                            item.isExpanded() ? (
                              <FolderOpenIcon className={`text-muted-foreground pointer-events-none ${isCategory ? "size-5" : "size-4"}`} />
                            ) : (
                              <FolderIcon className={`text-muted-foreground pointer-events-none ${isCategory ? "size-5" : "size-4"}`} />
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
          
          {/* Right side: Template Preview */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <span className="inline-block w-1 h-4 bg-secondary mr-2"></span>
              Selected Template
            </h3>
            <div className="border rounded-md shadow-sm p-6 h-[300px] flex items-center justify-center bg-card">
              {selectedTemplate ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">{selectedTemplate.name}</h4>
                  <p className="text-muted-foreground">Template selected and ready to send</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-2 bg-muted rounded-full mb-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Please select a template from the list</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="pt-4 border-t mt-2">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {selectedTemplate ? 
                `Ready to send "${selectedTemplate.name}" template` : 
                "Select a template to continue"}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button 
                onClick={handleSendLetter}
                disabled={!selectedTemplate}
                className="px-6"
              >
                Send Letter
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationLetterModal;
