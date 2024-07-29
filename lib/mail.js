"use server";

import { Resend } from "resend";
import {
  ApprovedEmailTemplate,
  RejectedEmailTemplate,
  ReSubmittedEmailTemplate,
  WFCEmailTemplate,
} from "./emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);

export const updateStatusEmail = async (
  status,
  application,
  student,
  token
) => {
  const { courseTitle, studyMode } = application;
  const { firstName, lastName, id } = student;

  let emailTemplate;
  let subject;

  switch (status) {
    case "Approved":
      emailTemplate = (
        <ApprovedEmailTemplate
          firstName={firstName}
          lastName={lastName}
          courseTitle={courseTitle}
          studyMode={studyMode}
        />
      );
      subject = `${courseTitle} (${studyMode}) 2024/5 Offer, Student ID: ${id}`;
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
      subject = `${courseTitle} (${studyMode}), Student ID: ${id}`;
      break;
    case "Waiting_For_Change":
      emailTemplate = (
        <WFCEmailTemplate
          firstName={firstName}
          lastName={lastName}
          token={token}
        />
      );
      subject = `${courseTitle} (${studyMode}), Student ID: ${id}`;
      break;
    case "Re_Submitted":
      emailTemplate = (
        <ReSubmittedEmailTemplate
          firstName={firstName}
          lastName={lastName}
          courseTitle={courseTitle}
        />
      );
      subject = `${courseTitle} (${studyMode}), Student ID: ${id}`;
      break;
    default:
      throw new Error("Invalid status");
  }

  await sendEmail(emailTemplate, subject);
};

export const sendEmail = async (emailTemplate, subject) => {
  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "samee.aslam022@gmail.com",
    subject: subject,
    react: emailTemplate,
  });

  if (error) {
    throw new Error(error);
  }
};
