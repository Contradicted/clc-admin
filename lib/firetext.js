const FIRETEXT_API_URL = "https://www.firetext.co.uk/api/sendsms";

export class FireTextService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("FireText API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Send an SMS message to a single recipient
   * @param {string} to - The recipient's phone number
   * @param {string} message - The message content
   * @returns {Promise<Object>} The API response
   */
  async sendSMS(to, message) {
    const url = FIRETEXT_API_URL;
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      to: to,
      from: process.env.FIRETEXT_SENDER_ID,
      message: message,
    });

    const fullUrl = `${url}?${params.toString()}`;
    console.log("Sending SMS to FireText:", {
      url: fullUrl,
      to,
      message,
      apiKeyLength: this.apiKey.length, // Log length of key for security
    });

    try {
      const response = await fetch(fullUrl);
      const data = await response.text();

      console.log("FireText API Response:", {
        status: response.status,
        data,
      });

      // FireText returns a colon-separated response
      // e.g. "0:1 SMS successfully queued"
      const [code] = data.split(":");
      const success = code === "0";

      return {
        success,
        response: data,
      };
    } catch (error) {
      console.error("FireText API Error:", error);
      return {
        success: false,
        response: error.message,
      };
    }
  }
}
