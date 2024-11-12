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
import { formatDate, formatDateTime } from "./utils";

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
            {emailMsg.split("\n").map((line, i) => (
              <>
                {line}
                <br />
              </>
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
