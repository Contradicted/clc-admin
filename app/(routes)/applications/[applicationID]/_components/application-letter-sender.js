"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Label } from "@/components/ui/label.jsx";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import EmailTemplatesModal from "@/app/(routes)/emails/_components/email-templates-modal";

// Mock template data (ideally fetched or passed as props)
const letterTemplatesData = {
  root: {
    name: "Letter Templates",
    children: ["attendance", "acceptance", "enrollment", "financial"],
  },
  attendance: {
    name: "Attendance Letters",
    children: ["non-attendance-a", "non-attendance-b", "non-attendance-c"],
  },
  acceptance: {
    name: "Acceptance Letters",
    children: ["conditional-acceptance", "full-acceptance", "provisional-acceptance"],
  },
  enrollment: {
    name: "Enrollment Letters",
    children: ["enrollment-confirmation", "course-registration", "enrollment-deferral"],
  },
  financial: {
    name: "Financial Letters",
    children: ["payment-reminder", "scholarship-award", "financial-aid"],
  },
  "non-attendance-a": { name: "Non-Attendance - Letter A", content: "Dear Student,\n\nThis is regarding your non-attendance...\n\nSincerely,\nThe Administration" },
  "non-attendance-b": { name: "Non-Attendance - Letter B", content: "Dear Student,\n\nWe have noticed your continued absence...\n\nSincerely,\nThe Administration" },
  "non-attendance-c": { name: "Non-Attendance - Letter C", content: "Dear Student,\n\nFinal notice regarding your attendance...\n\nSincerely,\nThe Administration" },
  "conditional-acceptance": { name: "Conditional Acceptance", subject: "Conditional Offer of Admission", content: "Dear Applicant,\n\nCongratulations! You have been conditionally accepted...\n\nSincerely,\nAdmissions Team" },
  "full-acceptance": { name: "Full Acceptance", subject: "Offer of Admission", content: "Dear Applicant,\n\nWe are pleased to offer you full admission...\n\nSincerely,\nAdmissions Team" },
  "provisional-acceptance": { name: "Provisional Acceptance", subject: "Provisional Offer of Admission", content: "Dear Applicant,\n\nYou have been provisionally accepted, pending...\n\nSincerely,\nAdmissions Team" },
  "enrollment-confirmation": { name: "Enrollment Confirmation", subject: "Enrollment Confirmed", content: "Dear Student,\n\nYour enrollment is confirmed for the upcoming term...\n\nSincerely,\nRegistrar's Office" },
  "course-registration": { name: "Course Registration", subject: "Course Registration Details", content: "Dear Student,\n\nPlease find your course registration details below...\n\nSincerely,\nAcademic Advising" },
  "enrollment-deferral": { name: "Enrollment Deferral", subject: "Enrollment Deferral Approved", content: "Dear Student,\n\nYour request for enrollment deferral has been approved...\n\nSincerely,\nRegistrar's Office" },
  "payment-reminder": { name: "Payment Reminder", subject: "Important: Payment Reminder", content: "Dear Student,\n\nThis is a friendly reminder that your payment is due...\n\nSincerely,\nFinance Department" },
  "scholarship-award": { name: "Scholarship Award", subject: "Congratulations on Your Scholarship!", content: "Dear Student,\n\nWe are delighted to inform you that you have been awarded a scholarship...\n\nSincerely,\nScholarship Committee" },
  "financial-aid": { name: "Financial Aid", subject: "Financial Aid Package Information", content: "Dear Student,\n\nYour financial aid package is now available for review...\n\nSincerely,\nFinancial Aid Office" },
};

const ApplicationLetterSender = ({ applicationId }) => {
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedLetterTemplate, setSelectedLetterTemplate] = useState(null);
  const [letterSubject, setLetterSubject] = useState("");
  const [letterContent, setLetterContent] = useState("");

  const handleTemplateSelect = (template) => {
    setSelectedLetterTemplate(template);
    setLetterSubject(template.subject || `Regarding Your Application: ${applicationId}`);
    setLetterContent(template.content || "");
    setShowTemplatesModal(false);
  };

  const handleSendLetter = () => {
    if (!selectedLetterTemplate) {
      toast.error("Please select a template first.");
      return;
    }
    // In a real application, you would send the email here
    // using letterSubject, letterContent, and applicationId
    console.log("Sending letter:", {
      applicationId,
      templateId: selectedLetterTemplate.id,
      subject: letterSubject,
      content: letterContent,
    });
    toast.success(`Letter based on '${selectedLetterTemplate.name}' prepared for application ${applicationId}. (Simulated send)`);
    // Optionally reset after sending
    // setSelectedLetterTemplate(null);
    // setLetterSubject("");
    // setLetterContent("");
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Send Application Letter</h3>
        <Button 
          variant="outline"
          onClick={() => setShowTemplatesModal(true)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Browse Templates
        </Button>
      </div>

      {selectedLetterTemplate && (
        <div className="p-3 border rounded-md bg-muted/50">
          <p className="text-sm font-medium">Selected Template: {selectedLetterTemplate.name}</p>
        </div>
      )}

      {selectedLetterTemplate && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="appLetterSubject">Subject</Label>
            <Input
              id="appLetterSubject"
              placeholder="Letter subject"
              value={letterSubject}
              onChange={(e) => setLetterSubject(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="appLetterContent">Content</Label>
            <Textarea
              id="appLetterContent"
              placeholder="Letter content..."
              value={letterContent}
              onChange={(e) => setLetterContent(e.target.value)}
              className="min-h-[200px] max-h-[400px]"
            />
          </div>
          <Button onClick={handleSendLetter}>Send Letter</Button>
        </div>
      )}

      {showTemplatesModal && (
        <EmailTemplatesModal 
          open={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
          onSelectTemplate={handleTemplateSelect}
          letterTemplates={letterTemplatesData} // Pass the mock data
        />
      )}
    </div>
  );
};

export default ApplicationLetterSender;
