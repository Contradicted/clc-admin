"use client";

import StatusModal from "./status-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/utils";

const VerifyApplicationButtons = ({ applicationID, applicationStatus, enrolledStudent }) => {
  const [enrolledStudentState, setEnrolledStudentState] = useState(enrolledStudent);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateID = async () => {
    try {
      setIsGenerating(true);

      // Generate ID Card
      const response = await fetch("/api/wallet/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId: applicationID }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate ID card");
      }

      // Create system note
      const noteResponse = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "Student ID card has been generated successfully.",
          type: "System",
          applicationID: applicationID,
        }),
      });

      if (!noteResponse.ok) {
        console.error("Failed to create note for ID generation");
      }

      console.log("Google Wallet Save Link:", data.saveUrl);

      // Update local state to reflect ID creation
      setEnrolledStudentState(prev => ({
        ...prev,
        idCreated: new Date().toISOString()
      }));

      toast({
        variant: "success",
        title: "ID Card Generated",
        description: "Student ID card has been generated successfully. Check console for save link.",
      });
    } catch (error) {
      console.error("[GENERATE_ID_ERROR]", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Something went wrong while generating the ID card.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const idButton = (
    <Button
      onClick={handleGenerateID}
      disabled={isGenerating || enrolledStudentState?.idCreated}
      className="bg-primary hover:bg-primary/90"
    >
      {isGenerating ? (
        <LoaderCircle className="animate-spin mr-2" />
      ) : null}
      {isGenerating ? "Generating..." : "Generate ID Card"}
    </Button>
  );

  return (
    <div className="w-full flex items-center justify-between gap-x-3">
      <div className="flex items-center gap-x-3">
        {applicationStatus === "Interview_successful" ? (
          <>
            <StatusModal
              applicationID={applicationID}
              status="Sent_conditional_letter"
              name="Send Conditional Letter"
              title="Send Conditional Letter"
              desc="Please enter a message for the conditional letter"
              className="bg-meta-3 hover:bg-meta-3/90"
            />
          </>
        ) : ["Sent_conditional_letter", "Enrolled"].includes(applicationStatus) ? (
          <>
            <StatusModal
              applicationID={applicationID}
              status="Enrolled"
              name="Send Enrollment Letter"
              title="Send Enrollment Letter"
              desc="Please enter a message for the enrollment letter"
              className="bg-meta-3 hover:bg-meta-3/90"
              isDisabled={!!enrolledStudent}
            />
          </>
        ) : (
          <StatusModal
            applicationID={applicationID}
            status="Invited_for_Interview"
            name="Invite for Interview"
            title="Invite for Interview"
            desc="Please enter a message"
            className="bg-meta-3 hover:bg-meta-3/90"
          />
        )}
        <StatusModal
          applicationID={applicationID}
          status="Rejected"
          name="Reject Application"
          title="Reject Application"
          desc="Please write your reason(s) to reject this application"
          className="bg-meta-1 hover:bg-meta-1/90"
        />
        <StatusModal
          applicationID={applicationID}
          status="Waiting_for_Change"
          name="Request Change"
          title="Request Change"
          desc="Please write changes that need to be made"
          className="bg-meta-8 hover:bg-meta-8/90"
        />
        <StatusModal
          applicationID={applicationID}
          status="Withdrawn"
          name="Withdraw"
          title="Withdraw"
          desc="Please write your reason(s) for withdrawing application"
          className="bg-[#818181] hover:bg-[#818181]/90"
        />
      </div>
      {/* ID Card Button */}
      {applicationStatus === "Enrolled" && (
        <div className="flex items-center gap-x-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className="disabled:pointer-events-auto">
              {idButton}
            </TooltipTrigger>
            <TooltipContent>
              {enrolledStudentState?.idCreated ? (
                <p>ID generated:{" "}
                  <span className="italic">{formatDateTime(enrolledStudentState.idCreated).dateTime}</span>
                </p>
              ) : applicationStatus === "Enrollment_Letter_Sent" ? (
                <p>Generate a new student ID card</p>
              ) : (
                <p>ID card can only be generated after enrollment letter is sent</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      )}
    </div>
  );
};

export default VerifyApplicationButtons;
