"use server";

import twilio from "twilio";

export const sendSMS = async (message) => {
  const client = twilio(
    "AC30bf71651e472bf508fa5a4ee3b7b783",
    "9c8a7b79f2b3f6e9b1dc3d6c42174a82"
  );

  try {
    await client.messages.create({
      body: message,
      from: "+447897014815",
      to: "+447340228685",
    });

    return { success: "SMS Message sent successfully!" };
  } catch (error) {
    console.log(error);

    return { error: "Something went wrong" };
  }
};
