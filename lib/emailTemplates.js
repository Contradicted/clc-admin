import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatDate } from "./utils";

const domain = process.env.NEXT_PUBLIC_APP_URL;

const now = new Date();

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
        <Text style={text}>{emailMsg}</Text>
        <Text style={text}>
          Regards,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          DISCLAIMER: This e-mail is confidential and should not be used by
          anyone who is not the original intended recipient. If you have
          received this e-mail in error, please inform the sender and delete it
          from your mailbox or any other storage mechanism Please note that City
          of London College does not accept any responsibility for viruses that
          may be contained in this e-mail or its attachments, and it is your own
          responsibility to scan for such viruses. City of London College (CLC)
          Ltd T/A City of London College is registered in England and Wales
          under registration number 11818935. Our Registered Office is at Suite
          100a Airport House, Purley Way, Croydon CR0 0XZ, England.
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
        <Text style={paragraph}>Dear {firstName + " " + lastName},</Text>

        <Text style={paragraph}>
          Thank you for submitting your application for a place in {courseTitle}{" "}
          ({studyMode}). We appreciate the time and effort you invested in this
          process.
        </Text>
        <br />
        <Text style={paragraph}>
          After careful consideration of your application, we regret to inform
          you that we are unable to offer you admission at this time. The
          selection process was highly competitive, and we had to make difficult
          decisions among many qualified applicants.
        </Text>
        <br />
        <Text style={paragraph}>
          Please understand that this decision does not reflect on your
          abilities or potential. We encourage you to continue pursuing your
          educational and career goals.
        </Text>
        <br />
        <Text style={paragraph}>
          If you have any questions, please don't hesitate to contact our
          admissions office at +44 (0) 20 7247 2177.
        </Text>
        <br />
        <Text style={paragraph}>
          We wish you the very best in your future endeavors.
        </Text>
        <br />
        <Text style={paragraph}>
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

export const WFCEmailTemplate = ({
  firstName,
  lastName,
  courseTitle,
  studyMode,
  token,
}) => {
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
          <Text style={paragraph}>Dear {firstName + " " + lastName},</Text>

          <Text style={paragraph}>
            We've noticed that some parts of your application is incomplete. In
            order for your application to be reviewed, it is essential that all
            parts of the application is filled.
          </Text>

          <Button style={button} href={updateLink}>
            Update application
          </Button>
          <br />
          <Text style={paragraph}>
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
        <Text style={paragraph}>Dear {firstName + " " + lastName},</Text>
        <Text style={paragraph}>
          Thank you for re-submitting your application for the {courseTitle}.
          <br />
          <br />
          Your application will be reviewed and we will be in touch with you as
          soon as possible.
        </Text>
        <Text style={paragraph}>
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
