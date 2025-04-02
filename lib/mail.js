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
  WithdrawnEmailTemplate,
  WalletPassEmailTemplate,
  SentConditionalLetterEmailTemplate,
  EnrolledEmailTemplate,
  Office365EmailTemplate
} from "./emailTemplates";
import { sendEmail } from "./nodemailer";
import {
  fillPDFTemplate,
  formatDate,
  formatDateTime,
  formatStudyMode,
} from "./utils";
import { render } from "@react-email/components";
import { getInstituteByCourseTitle } from "@/data/course";

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
    case "Sent_conditional_letter":
      emailTemplate = (
        <SentConditionalLetterEmailTemplate
          applicationID={application.id}
          firstName={firstName}
          lastName={lastName}
          courseTitle={courseTitle}
          studyMode={studyMode}
          emailMsg={emailMsg}
        />
      );
      subject = `City of London College - Issuance of Conditional Offer`
      break;
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
    case "Enrolled":
        emailTemplate = (
          <EnrolledEmailTemplate
            applicationID={application.id}
            firstName={firstName}
            lastName={lastName}
            courseTitle={courseTitle}
            studyMode={studyMode}
            emailMsg={emailMsg}
          />
        );
        subject = `City of London College - Issuance of Enrollment Letter`
        break;
    case "Invited_for_Interview": /* Approved for Interview */
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
          emailMsg={emailMsg}
        />
      );
      subject = `City of London College - Application requesting change`;
      break;
    case "Withdrawn": 
      const course = await getInstituteByCourseTitle(courseTitle)
      emailTemplate = (
        <WithdrawnEmailTemplate
          firstName={firstName}
          lastName={lastName}
          courseTitle={courseTitle}
          emailMsg={emailMsg}
          awardingBody={course.awarding_body}
        />
      )
      subject = `City of London College - Application Withdrawn`;
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
  const { courseTitle, studyMode, commencement } = application;
  const { firstName, lastName, title } = student;

  const courseDetails = application.course;
  const studyModeDetails = courseDetails.course_study_mode.filter(
    (mode) => mode.study_mode === studyMode
  );
  const courseDates = courseDetails.course_instances.filter(
    (instance) => instance.instance_name === commencement
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
    startDate: formatDateTime(courseDates[0].start_date).dateLong,
    lastJoinDate: formatDateTime(courseDates[0].last_join_date).dateLong,
    endDate: formatDateTime(courseDates[0].end_date).dateLong,
    resultsDate: formatDateTime(courseDates[0].results_date).dateLong,
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

export const sendOffice365Email = async (credentials, application) => {
  const { office365Email, office365Password } = credentials;

  const emailTemplate = render(
    <Office365EmailTemplate firstName={application.firstName} lastName={application.lastName} email={office365Email} password={office365Password} />
  )

  try {
    const options = {
      to: application.email,
      subject: "City of London College - Your Student email is ready",
      html: emailTemplate
    }

    await sendEmail(options)

    console.log("[STUDENT_ACCOUNT_EMAIL_SENT]", { applicant: application.firstName + application.lastName });
  } catch (error) {
    console.error("[STUDENT_ACCOUNT_EMAIL_ERROR]", error);
    throw error;
  }
}

export const sendWalletPassEmail = async (user, pass) => {

  const template = WalletPassEmailTemplate({
    firstName: user.firstName,
    lastName: user.lastName,
    saveUrl: pass.googlePassUrl,
    enrolledStudent: { applePassUrl: pass.applePassUrl }
  })

  try {

    const options = {
      to: application.email,
      subject: "Your City of London College Digital Student ID is Ready",
      html: render(template)
    }

    await sendEmail(
      options
    );
    console.log("[WALLET_PASS_EMAIL_SENT]", { studentId: user.id });
  } catch (error) {
    console.error("[WALLET_PASS_EMAIL_ERROR]", error);
    throw error;
  }
};
