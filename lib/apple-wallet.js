import { PKPass } from 'passkit-generator';
import path from 'path';
import fs from "fs";
import crypto from "crypto";

import { formatCommencementDate, formatStudyMode } from "./utils"

// Current pass version - increment updating the pass design
export const PASS_VERSION = 1;

// Generate a consistent authentication token for a student ID
export function generateAuthToken(studentId) {
  const secret = process.env.APPLE_PASS_SECRET;
  if (!secret) {
    throw new Error("APPLE_PASS_SECRET environment variable is not set");
  }
  return crypto.createHmac("sha256", secret).update(studentId).digest("hex");
}

/**
 * Generates an Apple Wallet pass for a student
 * @param {Object} studentData - Student data object containing user and course information
 * @param {Buffer} photoBuffer - Buffer containing the student's photo
 * @param {Boolean} isValid - Whether the pass should be valid (include barcode)
 * @returns {Promise<Buffer>} - Buffer containing the generated pkpass file
 */
export async function generateApplePass(studentData, photoBuffer, isValid = true) {
  try {
    // Read PEM certificate files
    const wwdr = fs.readFileSync(process.env.APPLE_WWDR_PATH);
    const signerCert = fs.readFileSync(process.env.APPLE_CERT_PATH);
    const signerKey = fs.readFileSync(process.env.APPLE_CERT_KEY_PATH);

    // Generate authentication token
    const authToken = generateAuthToken(studentData.id);

    const webServiceURL = process.env.APPLE_PASS_WEB_SERVICE_URL;

    if (!webServiceURL) {
      console.error(
        "[APPLE_PASS] Missing webServiceURL in environment variables"
      );
      throw new Error(
        "APPLE_PASS_WEB_SERVICE_URL environment variable is not set"
      );
    }

    if (!webServiceURL.startsWith("https://")) {
      console.error(
        "[APPLE_PASS] webServiceURL must use HTTPS:",
        webServiceURL
      );
      throw new Error("APPLE_PASS_WEB_SERVICE_URL must use HTTPS");
    }

    console.log("[APPLE_PASS] Using webServiceURL:", webServiceURL);

    // Fix for double v1 issue - completely restructure the URL
    let baseUrl = webServiceURL;

    // Remove any path components entirely
    // Extract just the domain and protocol
    const urlObj = new URL(baseUrl);
    baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    // Set the webServiceURL to just the base domain without any path components
    // Apple Wallet will append /v1/... paths automatically, so we need to point to /api
    const cleanWebServiceURL = `${baseUrl}/api`;

    console.log("[APPLE_PASS] Using clean webServiceURL:", cleanWebServiceURL);

    // Split the name into parts (assuming space as delimiter)
    const studentName = `${studentData.firstName}, ${studentData.lastName}`
    const formattedName =
        studentName.length > 20
          ? studentName.replace(/, /, ",\n")
          : studentName;

    // Format the commencement date (e.g., "January 2025" to "Jan 25")
    const commencementDate = studentData.commencement || "January 2025";
    const formattedCommencementDate =
      formatCommencementDate(commencementDate);

    // Create pass
    const pass = await PKPass.from({
      model: path.join(process.cwd(), 'assets', 'pass.pass'),
      certificates: {
        wwdr,
        signerCert,
        signerKey,
        signerKeyPassphrase: process.env.APPLE_CERT_PASSWORD
      }
    }, {
      serialNumber: studentData.id,
      webServiceURL: cleanWebServiceURL,
      authenticationToken: authToken,
      version: PASS_VERSION
    });

    // Add a header
    pass.headerFields.push(
      {
        key: 'spacer',
        label: 'ID',
        value: studentData.id
      }
    );

    // Set pass data
    pass.primaryFields.push(
      {
        key: 'name',
        label: 'STUDENT',
        value: formattedName,
        textAlignment: "PKTextAlignmentNatural",
      },
    );

    // Add secondary field
    pass.secondaryFields.push({
      key: "course",
      label: "COURSE",
      value: studentData.course,
      textAlignment: "PKTextAlignmentLeft",
    })

    // Create auxiliary fields array
    const auxiliaryFields = [
      {
        key: "commencement",
        label: "COMMENCEMENT",
        value: formattedCommencementDate,
        textAlignment: "PKTextAlignmentLeft",
      }
    ];
    
    // Only add campus field if it exists and is not for hybrid learning
    if (studentData.campus && studentData.studyMode?.toLowerCase() !== "hybrid_learning") {
      auxiliaryFields.push({
        key: "campus",
        label: "CAMPUS",
        value: studentData.campus,
        textAlignment: "PKTextAlignmentNatural",
      });
    }
    
    // Add study mode field
    auxiliaryFields.push({
      key: "studyMode",
      label: "STUDY MODE",
      value: formatStudyMode(studentData.studyMode),
      textAlignment: "PKTextAlignmentRight",
    });
    
    // Add all auxiliary fields to the pass
    pass.auxiliaryFields.push(...auxiliaryFields)

    // Add student photo
    if (photoBuffer) {
      pass.addBuffer('thumbnail.png', photoBuffer);

      // Add a 2x version for high-resolution displays
      pass.addBuffer("thumbnail@2x.png", photoBuffer);
    }

    // Add barcode
    if (isValid) {
    pass.setBarcodes({
      message: studentData.id,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
    });
  }

    // Generate and return the pass buffer
    return pass.getAsBuffer();
  } catch (error) {
    console.error('Error generating Apple Wallet pass:', error);
    throw error;
  }
}