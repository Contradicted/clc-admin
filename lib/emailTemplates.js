import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Text,
} from "@react-email/components";

const domain = process.env.NEXT_PUBLIC_APP_URL;

export const ApprovedEmailTemplate = ({
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
          We are pleased to make you an <strong>unconditional</strong> offer of
          a place on the {courseTitle} ({studyMode}) for entry in September of
          the academic year 2024/5.
          <br />
          <br />
          To accept or decline this offer, please go to our admissions portal.
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
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const logo = {
  margin: "0 auto",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
};
const button = {
  fontSize: "14px",
  backgroundColor: "#28a745",
  color: "#fff",
  lineHeight: 1.5,
  borderRadius: "0.5em",
  padding: "12px 24px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
};
