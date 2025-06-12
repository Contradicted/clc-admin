"use client";

import { useState, Fragment } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const ITEMS_PER_PAGE = 10;

export default function EmailHistory({ emailBatches }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedBatches, setExpandedBatches] = useState(new Set());
  const [viewingBatch, setViewingBatch] = useState(null);
  const [viewingLogDetail, setViewingLogDetail] = useState(null);
  
  // State for recipient pagination and search within expanded batches
  const [recipientPages, setRecipientPages] = useState({});
  const [recipientSearches, setRecipientSearches] = useState({});
  const RECIPIENTS_PER_PAGE = 10;

  const toggleBatchExpansion = (batchId) => {
    setExpandedBatches((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
        // Initialize recipient pagination and search for this batch if not already set
        if (!recipientPages[batchId]) {
          setRecipientPages(prev => ({
            ...prev,
            [batchId]: 1
          }));
        }
        if (!recipientSearches[batchId]) {
          setRecipientSearches(prev => ({
            ...prev,
            [batchId]: ""
          }));
        }
      }
      return newSet;
    });
  };

  const filteredBatches = emailBatches.filter((batch) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      batch.subject.toLowerCase().includes(searchLower) ||
      `${batch.sender?.firstName} ${batch.sender?.lastName}`
        .toLowerCase()
        .includes(searchLower) ||
      batch.logs.some((log) =>
        `${log.recipient?.firstName} ${log.recipient?.lastName}`
          .toLowerCase()
          .includes(searchLower)
      );

    const matchesStatus =
      statusFilter === "all" ||
      batch.logs.some((log) => log.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBatches.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBatches = filteredBatches.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  console.log(paginatedBatches)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Email History</h2>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search by subject, sender, or recipient..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-64"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Sent By</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBatches.map((batch) => {
              const sentCount = batch.logs.filter(
                (l) => l.status === "sent"
              ).length;
              const failedCount = batch.logs.filter(
                (l) => l.status === "failed"
              ).length;
              const isExpanded = expandedBatches.has(batch.batchId);

              return (
                <Fragment key={batch.batchId}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleBatchExpansion(batch.batchId)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {format(new Date(batch.createdAt), "PPp")}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {batch.subject}
                    </TableCell>
                    <TableCell>
                      {batch.sender
                        ? `${batch.sender.firstName} ${batch.sender.lastName}`.trim()
                        : "Unknown"}
                    </TableCell>
                    <TableCell>{batch.logs.length}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {sentCount > 0 && (
                          <Badge variant="success">{sentCount} Sent</Badge>
                        )}
                        {failedCount > 0 && (
                          <Badge variant="destructive">
                            {failedCount} Failed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingBatch(batch)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4 bg-muted/50">
                          <h4 className="font-semibold mb-2">Batch Details</h4>
                          
                          {/* Recipient summary stats */}
                          <div className="mb-3 flex items-center gap-3">
                            <div className="text-sm">
                              <span className="font-medium">Total Recipients:</span> {batch.logs.length}
                            </div>
                            {sentCount > 0 && (
                              <Badge variant="success" className="text-xs">{sentCount} Sent</Badge>
                            )}
                            {failedCount > 0 && (
                              <Badge variant="destructive" className="text-xs">{failedCount} Failed</Badge>
                            )}
                          </div>
                          
                          {/* Recipient search */}
                          <div className="mb-3">
                            <Input 
                              placeholder="Search recipients..." 
                              className="max-w-xs" 
                              value={recipientSearches[batch.batchId] || ""}
                              onChange={(e) => {
                                const searchValue = e.target.value;
                                setRecipientSearches(prev => ({
                                  ...prev,
                                  [batch.batchId]: searchValue
                                }));
                                // Reset to first page when searching
                                setRecipientPages(prev => ({
                                  ...prev,
                                  [batch.batchId]: 1
                                }));
                              }}
                            />
                          </div>
                          
                          <ScrollArea className="h-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Recipient</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Details</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(() => {
                                  // Get current page and search term for this batch
                                  const currentRecipientPage = recipientPages[batch.batchId] || 1;
                                  const searchTerm = (recipientSearches[batch.batchId] || "").toLowerCase();
                                  
                                  // Filter logs by search term if needed
                                  const filteredLogs = searchTerm ? batch.logs.filter(log => {
                                    if (!log.recipient) return false;
                                    const fullName = `${log.recipient.firstName} ${log.recipient.lastName}`.toLowerCase();
                                    return fullName.includes(searchTerm);
                                  }) : batch.logs;
                                  
                                  // Calculate pagination
                                  const startIndex = (currentRecipientPage - 1) * RECIPIENTS_PER_PAGE;
                                  const endIndex = startIndex + RECIPIENTS_PER_PAGE;
                                  
                                  // Get paginated logs
                                  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
                                  
                                  // Show message if no results
                                  if (paginatedLogs.length === 0 && searchTerm) {
                                    return (
                                      <TableRow>
                                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                          No recipients match your search
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }
                                  
                                  return paginatedLogs.map((log) => (
                                    <TableRow key={log.id}>
                                      <TableCell>
                                        {log.recipient
                                          ? `${log.recipient.firstName} ${log.recipient.lastName}`.trim()
                                          : "Unknown"}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={
                                            log.status === "sent"
                                              ? "success"
                                              : "destructive"
                                          }
                                        >
                                          {log.status.charAt(0).toUpperCase() +
                                            log.status.slice(1)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {log.error ? (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setViewingLogDetail(log)}
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        ) : "N/A"}
                                      </TableCell>
                                    </TableRow>
                                  ));
                                })()} 
                              </TableBody>
                            </Table>
                          </ScrollArea>
                          
                          {/* Recipient pagination */}
                          {(() => {
                            const searchTerm = recipientSearches[batch.batchId] || "";
                            const filteredLogs = searchTerm ? batch.logs.filter(log => {
                              if (!log.recipient) return false;
                              const fullName = `${log.recipient.firstName} ${log.recipient.lastName}`.toLowerCase();
                              return fullName.includes(searchTerm.toLowerCase());
                            }) : batch.logs;
                            
                            return filteredLogs.length > RECIPIENTS_PER_PAGE && (
                            <div className="flex items-center justify-between mt-3">
                              <div className="text-xs text-muted-foreground">
                                {(() => {
                                  const searchTerm = recipientSearches[batch.batchId] || "";
                                  const filteredLogs = searchTerm ? batch.logs.filter(log => {
                                    if (!log.recipient) return false;
                                    const fullName = `${log.recipient.firstName} ${log.recipient.lastName}`.toLowerCase();
                                    return fullName.includes(searchTerm.toLowerCase());
                                  }) : batch.logs;
                                  
                                  const currentPage = recipientPages[batch.batchId] || 1;
                                  const start = (currentPage - 1) * RECIPIENTS_PER_PAGE + 1;
                                  const end = Math.min(currentPage * RECIPIENTS_PER_PAGE, filteredLogs.length);
                                  
                                  return `Showing ${start}-${end} of ${filteredLogs.length} recipients${searchTerm ? " (filtered)" : ""}`;
                                })()}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setRecipientPages(prev => ({
                                    ...prev,
                                    [batch.batchId]: (prev[batch.batchId] || 1) - 1
                                  }))}
                                  disabled={(recipientPages[batch.batchId] || 1) === 1}
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setRecipientPages(prev => ({
                                    ...prev,
                                    [batch.batchId]: (prev[batch.batchId] || 1) + 1
                                  }))}
                                  disabled={(() => {
                                    const searchTerm = recipientSearches[batch.batchId] || "";
                                    const filteredLogs = searchTerm ? batch.logs.filter(log => {
                                      if (!log.recipient) return false;
                                      const fullName = `${log.recipient.firstName} ${log.recipient.lastName}`.toLowerCase();
                                      return fullName.includes(searchTerm.toLowerCase());
                                    }) : batch.logs;
                                    
                                    return (recipientPages[batch.batchId] || 1) >= Math.ceil(filteredLogs.length / RECIPIENTS_PER_PAGE);
                                  })()}
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )})()
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-
            {Math.min(
              startIndex + ITEMS_PER_PAGE,
              filteredBatches.length
            )}{" "}
            of {filteredBatches.length} batches
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Email View Dialog */}
      <Dialog open={!!viewingBatch} onOpenChange={() => setViewingBatch(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Email Content</DialogTitle>
          </DialogHeader>

          {viewingBatch && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Subject
                </p>
                <p className="font-medium">{viewingBatch.subject}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sender
                </p>
                <p>
                  {viewingBatch.sender
                    ? `${viewingBatch.sender.firstName} ${viewingBatch.sender.lastName}`.trim()
                    : "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Date Sent
                </p>
                <p>{format(new Date(viewingBatch.createdAt), "PPp")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Content
                </p>
                <ScrollArea className="h-[300px] mt-2 p-4 border rounded-md">
                  <div
                    className="email-content"
                    dangerouslySetInnerHTML={{ __html: viewingBatch.content }}
                  />
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewingBatch(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Detail View Dialog */}
      <Dialog open={!!viewingLogDetail} onOpenChange={() => setViewingLogDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
          </DialogHeader>
          {viewingLogDetail && (
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recipient</p>
                <p>{viewingLogDetail.recipient ? `${viewingLogDetail.recipient.firstName} ${viewingLogDetail.recipient.lastName}`.trim() : 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error</p>
                <ScrollArea className="h-[100px] mt-1 p-2 border rounded-md">
                    <p className="text-sm text-destructive">{viewingLogDetail.error}</p>
                </ScrollArea>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewingLogDetail(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
