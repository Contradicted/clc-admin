"use client";

import StatusModal from "./status-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/utils";

const VerifyApplicationButtons = ({ applicationID, applicationStatus, enrolledStudent }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(enrolledStudent);
  const { toast } = useToast();

  const handleGenerateID = async () => {
    try {
      setIsGenerating(true);

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

      // console.log("Google Wallet Save Link:", data.saveUrl);

      setIsGenerated(prev => ({
        ...prev,
        idCreated: new Date().toISOString()
      }))

      toast({
        variant: "success",
        title: "ID Card Generated",
        description: "Student ID card has been generated successfully.",
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
      disabled={isGenerating || isGenerated?.idCreated}
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
          name="Withdrawn"
          title="Withdrawn"
          desc="Please write your reason(s) for withdrawing application"
          className="bg-[#818181] hover:bg-[#818181]/90"
        />
      </div>
      {applicationStatus === "Enrolled" && (
        <div className="flex items-center gap-x-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className="disabled:pointer-events-auto">
              {idButton}
            </TooltipTrigger>
            {isGenerated?.idCreated && (
              <TooltipContent>
                <p>ID generated:{" "}
                  <span className="italic">{formatDateTime(isGenerated?.idCreated).dateTime}</span>
                </p>
            </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
      )}
    </div>
  );
};

export default VerifyApplicationButtons;
