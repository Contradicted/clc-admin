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
import {
  fillPDFTemplate,
  formatDate,
  formatDateTime,
  formatStudyMode,
} from "./utils";
import { render } from "@react-email/components";
import { sendEmail } from "./nodemailer";

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

  const options = {
    to: application.email,
    subject,
    html: render(emailTemplate),
  };

  const { error } = await sendEmail(options);

  if (error) {
    console.error("[UPDATING_STATUS_EMAIL_ERROR]", error);
  }
};

export const sendConditionalLetterOfAcceptanceEmail = async (
  application,
  student
) => {
  const { courseTitle, studyMode } = application;
  const { firstName, lastName, title } = student;

  const courseDetails = application.course;
  const studyModeDetails = courseDetails.course_study_mode.filter(
    (mode) => mode.study_mode === studyMode
  );

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
    "https://utfs.io/f/s1GlZLuSvJgyxSxq9w81kfK5P3lJ9HtT0qFRrE6Ud2esLuIX";

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
    courseTitle2: courseTitle,
    duration: `${studyModeDetails[0].duration} Month(s)`,
    level: courseDetails.level,
    awardingBody: courseDetails.awarding_body,
    startDate: formatDateTime(courseDetails.startDate).dateLong,
    lastJoinDate: formatDateTime(courseDetails.last_join_date).dateLong,
    endDate: formatDateTime(courseDetails.endDate).dateLong,
    resultsDate: formatDateTime(courseDetails.resultsDate).dateLong,
    studyMode: formatStudyMode(studyMode),
    tuitionFee: Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(studyModeDetails[0].tuition_fees),
  };

  const filledPDFBuffer = await fillPDFTemplate(templateUrl, replacements);

  const letterAttachment = {
    filename: `${student.id}.pdf`,
    content: Buffer.from(filledPDFBuffer),
    encoding: "base64",
  };

  const options = {
    to: application.email,
    subject,
    html: render(emailTemplate),
    attachments: [letterAttachment],
  };

  const { error } = await sendEmail(options);

  if (error) {
    console.error("[SENDING_CONDITIONAL_LETTER_EMAIL_ERROR]", error);
  }
};

// export const sendEmail = async (emailTemplate, subject, attachments) => {
//   const { error } = await resend.emails.send({
//     from: "onboarding@resend.dev",
//     to: "samee.aslam022@gmail.com",
//     subject: subject,
//     react: emailTemplate,
//     attachments: attachments,
//   });

//   if (error) {
//     console.error("Error sending email:", error);
//     throw new Error(error.message);
//   }
// };
