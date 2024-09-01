"use server";

import { Resend } from "resend";
import {
  ApprovedEmailTemplate,
  ApprovedInterviewEmailTemplate,
  ConditionalLetterOfAcceptanceEmailTemplate,
  InvitationInterviewTemplate,
  RejectedEmailTemplate,
  ReSubmittedEmailTemplate,
  WFCEmailTemplate,
} from "./emailTemplates";
import { fillPDFTemplate, formatDate, formatDateTime } from "./utils";

const resend = new Resend(process.env.RESEND_API_KEY);

export const updateStatusEmail = async (
  status,
  application,
  student,
  token,
  emailMsg,
  date
) => {
  const { courseTitle, studyMode } = application;
  const { firstName, lastName, id } = student;

  let emailTemplate;
  let subject;

  switch (status) {
    case "Approved":
      emailTemplate = (
        <ApprovedEmailTemplate
          applicationID={application.id}
          firstName={firstName}
          lastName={lastName}
          courseTitle={courseTitle}
          studyMode={studyMode}
          emailMsg={emailMsg}
        />
      );
      subject = `City of London College - Application Approved`;
      break;
    case "Approved_for_Interview":
      emailTemplate = (
        <ApprovedInterviewEmailTemplate
          applicationID={application.id}
          firstName={firstName}
          lastName={lastName}
          courseTitle={courseTitle}
          studyMode={studyMode}
          emailMsg={emailMsg}
        />
      );
      subject = `City of London College - Approved for Interview`;
      break;
    case "Invitation_For_Interview":
      emailTemplate = (
        <InvitationInterviewTemplate
          applicationID={application.id}
          firstName={firstName}
          lastName={lastName}
          courseTitle={courseTitle}
          date={date}
        />
      );
      subject = "City of London College - Invitation for Interview";
      break;
    case "Rejected":
      emailTemplate = (
        <RejectedEmailTemplate
          firstName={firstName}
          lastName={lastName}
          courseTitle={courseTitle}
          studyMode={studyMode}
        />
      );
      subject = `City of London College - Application Rejected`;
      break;
    case "Waiting_for_Change":
      emailTemplate = (
        <WFCEmailTemplate
          firstName={firstName}
          lastName={lastName}
          token={token}
        />
      );
      subject = `City of London College - Application requesting change`;
      break;
    case "Re_Submitted":
      emailTemplate = (
        <ReSubmittedEmailTemplate
          firstName={firstName}
          lastName={lastName}
          courseTitle={courseTitle}
        />
      );
      subject = `City of London College - Acknowledgment of resubmitted application`;
      break;
    default:
      throw new Error("Invalid status");
  }

  await sendEmail(emailTemplate, subject);
};

export const sendConditionalLetterOfAcceptanceEmail = async (
  application,
  student
) => {
  const { courseTitle, studyMode } = application;
  const { firstName, lastName, title } = student;

  const emailTemplate = (
    <ConditionalLetterOfAcceptanceEmailTemplate
      applicationID={application.id}
      firstName={firstName}
      lastName={lastName}
      courseTitle={courseTitle}
      studyMode={studyMode}
    />
  );

  const subject = "City of London College - Conditional Letter of Acceptance";
  const templateUrl =
    "https://utfs.io/f/893869ff-3f24-49d6-a6b8-ba75655bc280-sc0x0q.pdf";

  const replacements = {
    date: formatDateTime(new Date()).dateLong,
    address_line_1: student.addressLine1,
    city: student.city,
    postcode: student.postcode,
    country: application.countryOfBirth,
    title_firstName_lastName: `${title} ${firstName} ${lastName}`,
    studentID: student.id,
    studentName: `${firstName} ${lastName.toUpperCase()}`,
    courseTitle: courseTitle,
  };

  const filledPDFBuffer = await fillPDFTemplate(templateUrl, replacements);

  const letterAttachment = {
    filename: `${student.id}.pdf`,
    content: Buffer.from(filledPDFBuffer).toString("base64"),
  };

  await sendEmail(emailTemplate, subject, [letterAttachment]);
};

export const sendEmail = async (emailTemplate, subject, attachments) => {
  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "samee.aslam022@gmail.com",
    subject: subject,
    react: emailTemplate,
    attachments: attachments,
  });

  if (error) {
    console.error("Error sending email:", error);
    throw new Error(error.message);
  }
};
