import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatDate, formatDateTime, formatStudyMode } from "./utils";
import React from "react";

const domain = process.env.ADMISSIONS_URL;

const now = new Date();

export const ConditionalLetterOfAcceptanceEmailTemplate = ({
  applicationID,
  firstName,
  lastName,
  courseTitle,
  studyMode,
  emailMsg,
}) => (
  <Html>
    <Head />
    <Preview>
      {formatDate(now).long} Dear {firstName + " " + lastName}, Application ID:{" "}
      {applicationID}{" "}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Hr />
        <Text style={text}>{formatDate(now).long}</Text>
        <Text style={text}>Dear {firstName + " " + lastName},</Text>
        <Section>
          <Text style={sectionText}>
            <strong>Application ID:</strong> {applicationID}
          </Text>
          <Text style={sectionText}>
            <strong>Student Name:</strong> {firstName + " " + lastName}
          </Text>
          <Text style={sectionText}>
            <strong>Course Applied for:</strong> {courseTitle}
          </Text>
        </Section>
        <Text style={text}>Please find attached the letter issued to you.</Text>
        <Text style={{ ...text, whiteSpace: "pre-wrap" }}>{emailMsg}</Text>
        <Text style={text}>
          Regards,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          NOTE: This e-mail message was sent from a notification-only address
          that cannot accept incoming e-mail. Please do not reply to this
          message.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const EnrolledEmailTemplate = ({
  applicationID,
  firstName,
  lastName,
  courseTitle,
  studyMode,
  emailMsg,
}) => (
  <Html>
    <Head />
    <Preview>
      {formatDate(now).long} Dear {firstName + " " + lastName}, Application ID:{" "}
      {applicationID}{" "}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Hr />
        <Text style={text}>{formatDate(now).long}</Text>
        <Text style={text}>Dear {firstName + " " + lastName},</Text>
        <Section>
          <Text style={sectionText}>
            <strong>Application ID:</strong> {applicationID}
          </Text>
          <Text style={sectionText}>
            <strong>Student Name:</strong> {firstName + " " + lastName}
          </Text>
          <Text style={sectionText}>
            <strong>Course Applied for:</strong> {courseTitle}
          </Text>
        </Section>
        <Text style={text}>
          Congratulations! We are pleased to offer you an enrollment letter.
          Please see follow-up email containing the letter.
        </Text>
        <Text style={{ ...text, whiteSpace: "pre-line" }}>{emailMsg}</Text>
        <Text style={text}>
          Yours Sincerely,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          NOTE: This e-mail message was sent from a notification-only address
          that cannot accept incoming e-mail. Please do not reply to this
          message.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const SentConditionalLetterEmailTemplate = ({
  applicationID,
  firstName,
  lastName,
  courseTitle,
  studyMode,
  emailMsg,
}) => (
  <Html>
    <Head />
    <Preview>
      {formatDate(now).long} Dear {firstName + " " + lastName}, Application ID:{" "}
      {applicationID}{" "}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Hr />
        <Text style={text}>{formatDate(now).long}</Text>
        <Text style={text}>Dear {firstName + " " + lastName},</Text>
        <Section>
          <Text style={sectionText}>
            <strong>Application ID:</strong> {applicationID}
          </Text>
          <Text style={sectionText}>
            <strong>Student Name:</strong> {firstName + " " + lastName}
          </Text>
          <Text style={sectionText}>
            <strong>Course Applied for:</strong> {courseTitle}
          </Text>
        </Section>
        <Text style={text}>
          Congratulations! We are pleased to offer you a conditional letter of
          acceptance. Please see follow-up email containing conditional letter
          of enrolment.
        </Text>
        <Text style={{ ...text, whiteSpace: "pre-line" }}>{emailMsg}</Text>
        <Text style={text}>
          Yours Sincerely,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          NOTE: This e-mail message was sent from a notification-only address
          that cannot accept incoming e-mail. Please do not reply to this
          message.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const ApprovedEmailTemplate = ({
  applicationID,
  firstName,
  lastName,
  courseTitle,
  studyMode,
  emailMsg,
}) => (
  <Html>
    <Head />
    <Preview>
      {formatDate(now).long} Dear {firstName + " " + lastName}, Application ID:{" "}
      {applicationID}{" "}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Hr />
        <Text style={text}>{formatDate(now).long}</Text>
        <Text style={text}>Dear {firstName + " " + lastName},</Text>
        <Section>
          <Text style={sectionText}>
            <strong>Application ID:</strong> {applicationID}
          </Text>
          <Text style={sectionText}>
            <strong>Student Name:</strong> {firstName + " " + lastName}
          </Text>
          <Text style={sectionText}>
            <strong>Course Applied for:</strong> {courseTitle}
          </Text>
        </Section>
        <Text style={text}>
          Congratulations! We are pleased to inform you that your application to
          City of London College has been approved. Please see follow-up email
          containing conditional letter of enrolment.
        </Text>
        <Text style={{ ...text, whiteSpace: "pre-line" }}>{emailMsg}</Text>
        <Text style={text}>
          Yours Sincerely,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          NOTE: This e-mail message was sent from a notification-only address
          that cannot accept incoming e-mail. Please do not reply to this
          message.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const ApprovedInterviewEmailTemplate = ({
  applicationID,
  firstName,
  lastName,
  courseTitle,
  studyMode,
  emailMsg,
}) => (
  <Html>
    <Head />
    <Preview>
      {formatDate(now).long} Dear {firstName + " " + lastName}, Application ID:{" "}
      {applicationID}{" "}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Hr />
        <Text style={text}>{formatDate(now).long}</Text>
        <Text style={text}>Dear {firstName + " " + lastName},</Text>
        <Section>
          <Text style={sectionText}>
            <strong>Application ID:</strong> {applicationID}
          </Text>
          <Text style={sectionText}>
            <strong>Student Name:</strong> {firstName + " " + lastName}
          </Text>
          <Text style={sectionText}>
            <strong>Course Applied for:</strong> {courseTitle}
          </Text>
        </Section>
        <Text style={text}>
          We are pleased to inform you that your application to City of London
          College has been reviewed, and we would like to invite you for an
          interview. You should recieve a follow-up email regarding the
          time/date and other important information related to your interview.
        </Text>
        <Text style={{ ...text, whiteSpace: "pre-line" }}>{emailMsg}</Text>
        <Text style={text}>
          Yours Sincerely,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          NOTE: This e-mail message was sent from a notification-only address
          that cannot accept incoming e-mail. Please do not reply to this
          message.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const InvitationInterviewTemplate = ({
  applicationID,
  firstName,
  lastName,
  courseTitle,
  date,
}) => (
  <Html>
    <Head />
    <Preview>
      {formatDate(now).long} Dear {firstName + " " + lastName}, Application ID:{" "}
      {applicationID}{" "}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Hr />
        <Text style={text}>{formatDate(now).long}</Text>
        <Text style={text}>Dear {firstName + " " + lastName},</Text>
        <Section>
          <Text style={sectionText}>
            <strong>Application ID:</strong> {applicationID}
          </Text>
          <Text style={sectionText}>
            <strong>Student Name:</strong> {firstName + " " + lastName}
          </Text>
          <Text style={sectionText}>
            <strong>Course Applied for:</strong> {courseTitle}
          </Text>
        </Section>
        <Text style={text}>
          Further to your application for the above course, we are now pleased
          to inform you that you are invited for an interview and an entrance
          test.
        </Text>
        <Text style={text}>
          The interview date is <strong>{formatDateTime(date).date}</strong> at{" "}
          <strong>{formatDateTime(date).time} (UK time)</strong> and will be
          conducted by member(s) of the admissions team. The lead interviewer
          will be the course leader. You may be required to undertake an
          entrance test either before or after the interview.
        </Text>
        <Text style={text}>
          It is important that you prepare well for the interview by
          familiarising yourself with the course contents and the Terms and
          Conditions of enrolment at the College, which can be found at{" "}
          <Link href="http://www.clc-london.ac.uk/contents/terms-and-conditions.html">
            http://www.clc-london.ac.uk/contents/terms-and-conditions.html.
          </Link>
        </Text>
        <Text style={text}>
          You will be required to bring the following original copies of the
          following documents on the day of the interview:
          <ul>
            <li style={text}>your valid passport and/or birth certificate</li>
            <li style={text}>all your qualifications to date</li>
            <li style={text}>evidence of your current address</li>
            <li style={text}>your CV</li>
          </ul>
        </Text>
        <Text style={text}>
          Upon arrival, please report to the reception desk on the ground floor
          of our campus at 3 Boyd St, London, E1 1FQ.
        </Text>
        <Text style={text}>
          We look forward to welcoming you. Meanwhile, you may send an email to
          the Registry Office at{" "}
          <Link href="mailto:applications@clc-london.ac.uk">
            applications@clc-london.ac.uk
          </Link>{" "}
          or call us on +44 20 7247 2177 should you require further information
          or for directions to the campus.
        </Text>
        <br />
        <Text style={text}>
          Yours Sincerely,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          NOTE: This e-mail message was sent from a notification-only address
          that cannot accept incoming e-mail. Please do not reply to this
          message.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const RejectedEmailTemplate = ({
  firstName,
  lastName,
  courseTitle,
  studyMode,
}) => (
  <Html>
    <Head />
    <Preview>Hi {firstName},</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Text style={text}>Dear {firstName + " " + lastName},</Text>

        <Text style={text}>
          Thank you for submitting your application for a place in {courseTitle}{" "}
          ({studyMode}). We appreciate the time and effort you invested in this
          process.
        </Text>
        <Text style={text}>
          After careful consideration of your application, we regret to inform
          you that we are unable to offer you admission at this time. The
          selection process was highly competitive, and we had to make difficult
          decisions among many qualified applicants.
        </Text>
        <Text style={text}>
          Please understand that this decision does not reflect on your
          abilities or potential. We encourage you to continue pursuing your
          educational and career goals.
        </Text>
        <Text style={text}>
          If you have any questions, please don&apos;t hesitate to contact our
          admissions office at +44 (0) 20 7247 2177.
        </Text>
        <Text style={text}>
          We wish you the very best in your future endeavors.
        </Text>
        <br />
        <Text style={text}>
          Regards,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          NOTE: This e-mail message was sent from a notification-only address
          that cannot accept incoming e-mail. Please do not reply to this
          message
        </Text>
      </Container>
    </Body>
  </Html>
);

export const WFCEmailTemplate = ({ firstName, lastName, token, emailMsg }) => {
  const updateLink = `${domain}/application?token=${token}`;

  return (
    <Html>
      <Head />
      <Preview>Hi {firstName},</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
            width="220"
            height="140"
            alt="clc-logo"
            style={logo}
          />
          <Text style={text}>Dear {firstName + " " + lastName},</Text>

          <Text style={text}>
            We&apos;ve noticed that some parts of your application is
            incomplete. In order for your application to be reviewed, it is
            essential that all parts of the application is filled.
          </Text>

          <Text style={text}>
            {emailMsg.split("\n").map((line, i, arr) => (
              <React.Fragment key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </Text>

          <Button style={button} href={updateLink}>
            Update application
          </Button>
          <br />
          <Text style={text}>
            Regards,
            <br />
            CLC Admissions Office
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            NOTE: This e-mail message was sent from a notification-only address
            that cannot accept incoming e-mail. Please do not reply to this
            message
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const WithdrawnEmailTemplate = ({
  firstName,
  lastName,
  emailMsg,
  courseTitle,
  awardingBody,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Hi {firstName},</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
            width="220"
            height="140"
            alt="clc-logo"
            style={logo}
          />
          <Text style={text}>Dear {firstName + " " + lastName},</Text>

          <Text style={text}>
            Unfortunately, your application for the {courseTitle} with{" "}
            {awardingBody} has been withdrawn. As a result, you have now been
            withdrawn from the course.
          </Text>

          <Text style={text}>Your record at the College is now closed.</Text>

          <Text style={text}>
            {emailMsg.split("\n").map((line, i, arr) => (
              <React.Fragment key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </Text>

          <Text style={text}>
            We wish you success with your future endeavours.
          </Text>

          <br />
          <Text style={text}>
            Regards,
            <br />
            CLC Admissions Office
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            NOTE: This e-mail message was sent from a notification-only address
            that cannot accept incoming e-mail. Please do not reply to this
            message
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const ReSubmittedEmailTemplate = ({
  firstName,
  lastName,
  courseTitle,
}) => (
  <Html>
    <Head />
    <Preview>{courseTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Text style={text}>Dear {firstName + " " + lastName},</Text>
        <Text style={text}>
          Thank you for re-submitting your application for the {courseTitle}.
          <br />
          <br />
          Your application will be reviewed and we will be in touch with you as
          soon as possible.
        </Text>
        <Text style={text}>
          Regards,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>3 Boyd Street, Aldgate East, London, E1 1FQ,</Text>
      </Container>
    </Body>
  </Html>
);

export const ReminderEmailTemplate = ({ firstName, lastName }) => (
  <Html>
    <Head />
    <Preview>
      Dear {firstName + " " + lastName}, Don&apos;t miss the deadline! Complete
      your application today
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Text style={text}>Dear {firstName + " " + lastName},</Text>
        <Text style={text}>
          We noticed that you have not yet submitted your application. Please
          complete your application as soon as possible.
        </Text>
        <Text style={text}>
          Yours Sincerely,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>3 Boyd Street, Aldgate East, London, E1 1FQ,</Text>
      </Container>
    </Body>
  </Html>
);

export const Office365EmailTemplate = ({ firstName, lastName, email, password }) => {
  return (
    <Html>
      <Head />
      <Preview>
        Your City of London College student email account is ready
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
            width="220"
            height="140"
            alt="clc-logo"
            style={logo}
          />
          <Hr />
          <Text style={text}>{formatDate(now).long}</Text>
          <Text style={text}>Dear {firstName + " " + lastName},</Text>
          <Text style={text}>
            Your City of London College student account has been created and is
            ready to use. Please find your account details below:
          </Text>

          <Section
            style={{
              padding: "20px",
              margin: "20px 0",
              backgroundColor: "#f9f9f9",
              borderRadius: "5px",
            }}
          >
            <Text style={sectionText}>
              <strong>Email Address:</strong> {email}
            </Text>
            <Text style={sectionText}>
              <strong>Temporary Password:</strong> {password}
            </Text>
          </Section>

          <Text style={text}>
            <strong>Important:</strong>
            <br />
            1. You must change your password when you first log in
            <br />
            2. This email account will be used for all official college
            communications
            <br />
            3. You can access your email at{" "}
            <Link href="https://outlook.office.com">here</Link>
          </Text>

          <Text style={text}>
            If you have any issues accessing your account, please contact our IT
            support.
          </Text>

          <Text style={text}>
            Regards,
            <br />
            CLC Admissions Office
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            3 Boyd Street, Aldgate East, London, E1 1FQ,
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const WalletPassEmailTemplate = ({
  firstName,
  lastName,
  saveUrl,
  enrolledStudent,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Your City of London College Digital Student ID is Ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
            width="220"
            height="140"
            alt="clc-logo"
            style={logo}
          />
          <Hr />
          <Text style={text}>{formatDate(now).long}</Text>
          <Text style={text}>Dear {firstName + " " + lastName},</Text>
          <Section>
            <Text style={sectionText}>
              Your digital student ID card for City of London College has been
              generated and is ready to be added to your digital wallet.
            </Text>
            <Text style={sectionText}>
              Click the button below to add your student ID to your digital
              wallet:
            </Text>
            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
              {/* Google Wallet Button */}
              <a
                href={saveUrl}
                style={{ display: "inline-block", marginRight: "10px" }}
              >
                <img
                  src="https://res.cloudinary.com/dt7hzfiwq/image/upload/v1741603309/tnnrceuk7kekzgwzkboi.png"
                  alt="Add to Google Wallet"
                  style={{ height: "48px", width: "auto" }}
                />
              </a>

              {/* Apple Wallet Button */}
              <a
                href={enrolledStudent.applePassUrl}
                style={{ display: "inline-block" }}
              >
                <img
                  src="https://res.cloudinary.com/dt7hzfiwq/image/upload/v1741600164/jdy5gclmgzhqgkwbaxhk.png"
                  alt="Add to Apple Wallet"
                  style={{ height: "48px", width: "auto" }}
                />
              </a>
            </div>
            <Text style={sectionText}>
              Your digital student ID can be used for:
            </Text>
            <ul style={listStyle}>
              <li>Accessing campus facilities</li>
              <li>Recording class attendance</li>
              <li>Student identification</li>
            </ul>
            <Text style={sectionText}>
              If you have any issues accessing your digital ID, please contact
              our IT support team.
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              This is an automated message, please do not reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Template for successful interview notification
export const InterviewSuccessfulEmailTemplate = ({
  applicationID,
  firstName,
  lastName,
  courseTitle,
  studyMode,
  emailMsg,
}) => (
  <Html>
    <Head />
    <Preview>Congratulations! You&apos;ve passed your interview</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />

        <Text style={paragraph}>
          Dear {firstName} {lastName},
        </Text>
        <Text style={paragraph}>
          <strong>Congratulations!</strong> We are pleased to inform you that
          you have successfully passed your interview for the {courseTitle} (
          {formatStudyMode(studyMode)}) program.
        </Text>

        <Text style={paragraph}>
          This is an important milestone in your application process. Our
          admissions team was impressed with your qualifications, experience,
          and the way you presented yourself during the interview.
        </Text>

        <Text style={paragraph}>
          If you have any questions or need further information, please
          don&apos;t hesitate to contact our admissions office.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          This is an automated message, please do not reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '"Arial",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const logo = {
  margin: "0 auto",
};

const text = {
  fontSize: "12px",
  lineHeight: "26px",
};

const sectionText = {
  fontSize: "12px",
  lineHeight: "26px",
  margin: "0px",
};

const btnContainer = {
  textAlign: "center",
};

const button = {
  backgroundColor: "#5F51E8",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center",
  display: "block",
  padding: "12px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const footer = {
  color: "black",
  fontWeight: "bold",
  fontSize: "10px",
  lineHeight: "16px",
};

const listStyle = {
  ...text,
  marginLeft: "20px",
  lineHeight: "24px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 0",
};
