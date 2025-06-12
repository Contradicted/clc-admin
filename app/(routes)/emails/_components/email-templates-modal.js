"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { FileIcon, FolderIcon, FolderOpenIcon, Check } from "lucide-react";
import { Tree, TreeItem, TreeItemLabel } from "@/components/tree.jsx";
import { hotkeysCoreFeature, syncDataLoaderFeature, selectionFeature } from "@headless-tree/core";
import { AssistiveTreeDescription, useTree } from "@headless-tree/react";

// Template data will be passed as a prop

const indent = 20;

const LetterTemplatesModal = ({ open, onClose, onSelectTemplate, letterTemplates }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

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
      getItem: (itemId) => letterTemplates[itemId],
      getChildren: (itemId) => letterTemplates[itemId]?.children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature, selectionFeature],
    setSelectedItems: (selectedIds) => {
      const selectedId = selectedIds[0]; // Assuming single selection for templates

      if (selectedId && letterTemplates[selectedId] && !letterTemplates[selectedId].children) {
        // It's a leaf node (actual template)
        const templateData = letterTemplates[selectedId];
        setSelectedTemplate({
          id: selectedId,
          name: templateData.name,
          content: templateData.content,
        });
      } else {
        setSelectedTemplate(null);
      }
    },
  });

  // We don't need the handleTemplateSelect function anymore as selection is handled by onSelectionChange
  // in the tree configuration. We'll just need a function to handle the Use Template button click.
  const handleUseTemplateClick = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Letter Templates</DialogTitle>
          <DialogDescription>
            Browse and select a letter template to use.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-4">
          <div>
            <p className="text-sm font-medium mb-2">Select a template category:</p>
            <ScrollArea className="h-[300px] border rounded-md p-2">
              <Tree
                className="relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]" 
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
                      className={isCategory ? "mt-3" : ""}
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
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUseTemplateClick}
            disabled={!selectedTemplate}
          >
            Use Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LetterTemplatesModal;
