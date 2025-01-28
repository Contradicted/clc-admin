import { PKPass } from 'passkit-generator';
import path from 'path';
import fs from "fs";
import crypto from "crypto";

import { formatStudyMode } from "./utils"

// Generate a consistent authentication token for a student ID
export function generateAuthToken(studentId) {
    const rotationFactor = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // Daily rotation
    return crypto.createHmac("sha256", process.env.APPLE_PASS_SECRET)
      .update(`${studentId}-${rotationFactor}`)
      .digest("hex");
  }
  
  /**
   * Generates an Apple Wallet pass for a student
   * @param {Object} studentData - Student data object containing user and course information
   * @param {Buffer} photoBuffer - Buffer containing the student's photo
   * @returns {Promise<Buffer>} - Buffer containing the generated pkpass file
   */
  export async function generateApplePass(studentData, photoBuffer) {
    try {
      // Read PEM certificate files
          const wwdr = fs.readFileSync(process.env.APPLE_WWDR_PATH);
          const signerCert = fs.readFileSync(process.env.APPLE_CERT_PATH);
          const signerKey = fs.readFileSync(process.env.APPLE_CERT_KEY_PATH);
  
      // Split the name into parts (assuming space as delimiter)
          const studentName = `${studentData.firstName}, ${studentData.lastName}`
  
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
        webServiceURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/passes/${process.env.APPLE_PASS_TYPE_IDENTIFIER}/${studentData.id}`,
        authenticationToken: generateAuthToken(studentData.id)
      });
  
      // Set pass data
      pass.primaryFields.push(
        {
          key: 'name',
          label: 'STUDENT',
          value: studentName,
          textAlignment: "PKTextAlignmentNatural",
        },
      );
  
      pass.auxiliaryFields.push(
        {
          key: 'campus',
          label: 'CAMPUS',
          value: studentData.campus,
          textAlignment: "PKTextAlignmentLeft",
        },
        {
          key: 'studyMode',
          label: 'STUDY MODE',
          value: formatStudyMode(studentData.studyMode),
        },
        {
          key: 'programme',
          label: 'PROGRAMME',
          value: "Computer Science",
          textAlignment: "PKTextAlignmentRight",
        },
      )
  
      // Add a spacer
      pass.headerFields.push(
        {
          key: 'spacer',
          label: 'ID',
          value: studentData.id
        }
      );
  
      // Add student photo
      pass.addBuffer('thumbnail.png', photoBuffer);
  
      // Add barcode
      pass.setBarcodes({
        message: studentData.id,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
      });
  
      // Generate and return the pass buffer
      return pass.getAsBuffer();
    } catch (error) {
      console.error('Error generating Apple Wallet pass:', error);
      throw error;
    }
  }