import jwt from "jsonwebtoken";
import { GenericClient } from "google-wallet/lib/cjs/generic";
import sharp from 'sharp';

import { db } from "@/lib/db";
import { cloudinary } from './cloudinary';
import { createEnrolledStudent } from "./id";
import { sendWalletPassEmail } from "./mail";
import { formatCommencementDate, formatStudyMode } from "./utils"
import { generateApplePass } from "./apple-wallet";

const googleConfig = {
    type: "service_account",
    project_id: process.env.GOOGLE_WALLET_PROJECT_ID,
    private_key_id: process.env.GOOGLE_WALLET_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_WALLET_PRIVATE_KEY,
    client_email: process.env.GOOGLE_WALLET_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_WALLET_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/wallet-service%40neat-resolver-443210-j2.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
  };
  
  const issuerID = process.env.GOOGLE_WALLET_ISSUER_ID
  const classID = "generic53_class";
  const classPrefix = `${issuerID}.${classID}`;
  
  const generic = new GenericClient(googleConfig);
  
  /**
   * Process an image URL using Sharp
   * @param {string} imageUrl - URL of the image to process
   * @param {string} studentId - ID of the application
   * @returns {Promise<string>} - URL of the image
   */
  async function processProfileImage(imageUrl, studentId) {
    try {
      if (!imageUrl) {
        throw new Error("Profile picture is required to generate student ID");
      }
  
      // Fetch the image
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
  
      // Create a circular mask
      const roundedCorners = Buffer.from(
        '<svg><circle cx="125" cy="125" r="125" /></svg>'
      );
  
      // Process the image
      const processedImageBuffer = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(250, 250, {
          fit: 'cover',
          position: 'centre'
        })
        .png()
        .composite([{
          input: roundedCorners,
          blend: 'dest-in'
        }])
        .toBuffer();
  
      // Create a version specifically for Apple Wallet (with transparency)
      const appleWalletBuffer = await sharp(processedImageBuffer)
        .png()
        .toBuffer();
  
      // Upload the image to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
          folder: "google-wallet-photos",
          resource_type: "image",
          public_id: `student-${studentId}`,
          overwrite: true
        }, (error, result) => {
          if (error) {
            console.error("[UPLOAD_TO_CLOUDINARY_ERROR]", error);
            reject(error);
          } else {
            resolve(result);
          }
        });
        
        uploadStream.end(processedImageBuffer);
      });
  
      // Return the secure URL
      return {
        url: uploadResult.secure_url,
        buffer: appleWalletBuffer
      };
    } catch (error) {
      console.error("[PROCESS_PROFILE_IMAGE_ERROR]", error);
      throw error; // Re-throw the error instead of falling back to placeholder
    }
  }
  
  /**
   * Creates a Google Wallet pass class for student IDs
   */
  async function createPassClass() {  
    const passClass = {
      id: classPrefix,
      classTemplateInfo: {
        cardTemplateOverride: {
          cardRowTemplateInfos: [
            {
              oneItem: {
                item: {
                  firstValue: {
                    fields: [
                      {
                        fieldPath: "object.textModulesData[2]",
                      },
                    ],
                  },
                },
              },
            },
            {
              threeItems: {
                startItem: {
                  firstValue: {
                    fields: [
                      {
                        fieldPath: "object.textModulesData[3]",
                      },
                    ],
                  },
                },
                middleItem: {
                  firstValue: {
                    fields: [
                      {
                        fieldPath: "object.textModulesData[4]",
                      },
                    ],
                  },
                },
                endItem: {
                  firstValue: {
                    fields: [
                      {
                        fieldPath: "object.textModulesData[5]",
                      },
                    ],
                  },
                },
              },
            },
          ]
        },
        detailsTemplateOverride: {
          detailsItemInfos: [
            {
              item: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData[0]",
                    },
                  ],
                },
              },
            },
            {
              item: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData[1]",
                    },
                  ],
                },
              },
            },
            {
              item: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData[2]",
                    },
                  ],
                },
              },
            },
            {
              item: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData[4]",
                    },
                  ],
                },
              },
            },
            {
              item: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData[3]",
                    },
                  ],
                },
              },
            },
            {
              item: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData[5]",
                    },
                  ],
                },
              },
            },
          ]
        },
      },
      multipleDevicesAndHoldersAllowedStatus: "MULTIPLE_HOLDERS",
    imageModulesData: [
      {
        mainImage: {
          sourceUri: {
            uri: "https://res.cloudinary.com/dt7hzfiwq/image/upload/v1743500637/logo_copy_2x_hxmetf.png",
          },
          contentDescription: {
            defaultValue: {
              language: "en-US",
              value: "City of London College Logo",
            },
          },
        },
        id: "main_image",
      },
    ],
    linksModuleData: {
      uris: [
        {
          uri: "https://clc-london.ac.uk",
          description: "City of London College Website",
          id: "website",
        },
      ],
    },
    hexBackgroundColor: "#003366",
    };
  
    try {
      // Use classID (without issuer) for getClass
      let existingClass = await generic.getClass(issuerID, classID);

      if (existingClass && existingClass.id) {
        console.log("Using existing class:", existingClass.id);
        return existingClass;
      }
  
       // Create new class if none exists
    console.log("Creating new class with ID:", studentClassPrefix);
    const newClass = await generic.createClass(passClass);
    console.log("New class created:", newClass);
    return newClass;
  
    } catch (error) {
      // If it's not a 404 error, rethrow it
      console.error("[GET_CLASS_ERROR]", err);
      throw err;
    }
  }
  
  /**
   * Creates a Google Wallet pass object for a specific student
   */
  async function createPassObject(student) {  
    const objectSuffix = `student_id_${student.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const objectId = `${issuerID}.${objectSuffix}`;
  
    console.log("[CREATE_PASS_OBJECT] Creating pass for student:", {
      studentId: student.id,
      objectId,
      objectSuffix,
      profileImage: student.profileImage
    });
  
    const studentName = `${student.firstName}, ${student.lastName}`
    const formattedName = studentName.length > 20 
          ? studentName.replace(/, /, ',\n')
          : studentName;
  
    const passObject = {
      id: objectId,
      classId: classPrefix,
      logo: {
        sourceUri: {
          uri: "https://res.cloudinary.com/dt7hzfiwq/image/upload/v1743500637/logo_copy_2x_hxmetf.png",
        },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: "City of London College Logo",
          },
        },
      },
      cardTitle: {
        defaultValue: {
          language: "en",
          value: "CoLC - Student ID",
        },
      },
      subheader: {
        defaultValue: {
          language: "en-US",
          value: `ID: ${student.id}`,
        },
      },
      header: {
        defaultValue: {
          language: "en-US",
          value: formattedName,
        },
      },
      textModulesData: [
        {
          id: "id",
          header: "Student ID",
          body: student.studentId,
        },
        {
          id: "student",
          header: "Student Name",
          body: formattedName,
        },
        {
          id: "course",
          header: "Course",
          body: student.course,
        },
        {
          id: "commencement",
          header: "Commencement",
          body: formatCommencementDate(student.commencement),
        },
        {
          id: "campus",
          header: "Campus",
          body: student.campus,
        },
        {
          id: "study_mode",
          header: "Study Mode",
          body: formatStudyMode(student.studyMode),
        },
      ],
      barcode: {
        type: "QR_CODE",
        value: student.studentId.toString()
      },
      hexBackgroundColor: "#003366",
      status: "ACTIVE"
    };
  
    let genericObject = await generic.getObject(issuerID, objectSuffix);
    if (!genericObject) {
      genericObject = await generic.createObject(passObject);
    } else {
      genericObject = await generic.patchObject(passObject);
    }
  
    return genericObject;
  }
  
  /**
   * Generates a JWT for a Google Wallet pass object
   */
  async function generatePassJWT(genericClass, genericObject) {
    const claims = {
      iss: process.env.GOOGLE_WALLET_CLIENT_EMAIL,
      aud: "google",
      origins: [],
      typ: "savetowallet",
      payload: {
        genericClasses: [genericClass],
        genericObjects: [genericObject]
      }
    };
  
    const token = jwt.sign(claims, process.env.GOOGLE_WALLET_PRIVATE_KEY, {
      algorithm: "RS256"
    });
    
    return token;
  }
  
  /**
   * Generates a complete student ID in both Google and Apple Wallet
   */
  async function generateStudentID(applicationId, userId) {
    try {
      // Get application data
      const application = await db.application.findUnique({
        where: { id: applicationId },
        include: {
          course: {
            select: {
              name: true
            }
          },
          user: true,
        },
      });
  
      if (!application) {
        throw new Error("Application not found");
      }
  
      const existingEnrollment = await db.enrolledStudent.findUnique({
        where: { applicationID: applicationId }
      });
  
      // Process the profile image
      const { url: processedImageUrl, buffer: processedImageBuffer } = await processProfileImage(
        application.photoUrl,
        existingEnrollment.id
      );
  
      // Create enrolled student record
      // const enrolledStudent = await createEnrolledStudent(applicationId, application.campus);
  
      // Prepare student data for passes
      const studentData = {
        id: existingEnrollment.id,
        firstName: application.user.firstName,
        lastName: application.user.lastName,
        email: application.user.email,
        studentId: existingEnrollment.id,
        campus: existingEnrollment.campus,
        faculty: application.faculty ?? "Business",
        course: application.course.name,
        commencement: application.commencement,
        studyMode: application.studyMode,
      };
  
      // Create student's Google Wallet pass
      const genericClass = await createPassClass();
      const genericObject = await createPassObject(studentData);
      const googlePass = await generatePassJWT(genericClass, genericObject);
  
      // Create the save URL for Google Wallet
      const saveUrl = `https://pay.google.com/gp/v/save/${googlePass}`;
  
      // Generate Apple Wallet pass
      const applePassBuffer = await generateApplePass(studentData, processedImageBuffer);
  
      // Upload Apple pass to Cloudinary
      const applePassUpload = await cloudinary.uploader.upload(
        `data:application/vnd.apple.pkpass;base64,${applePassBuffer.toString('base64')}`,
        {
          folder: 'apple-wallet-passes',
          resource_type: 'raw',
          public_id: `apple-passes/${existingEnrollment.id}`,
          format: 'pkpass',
          overwrite: true
        }
      );
  
      // Update the enrolled student with ID creation timestamp and pass URL
      const updatedStudent = await db.enrolledStudent.update({
        where: { id: existingEnrollment.id },
        data: {
          idCreated: new Date(),
          idActive: true,
          idActiveAt: new Date(),
          applePassUrl: applePassUpload.secure_url
        }
      });
  
      // Create a system note
      await db.note.create({
        data: {
          content: "Student ID card has been generated successfully",
          type: "System",
          applicationID: applicationId,
          userID: userId
        }
      });
  
      // Send email with both wallet passes
      await sendWalletPassEmail(updatedStudent, {
        googlePassUrl: saveUrl,
        applePassUrl: applePassUpload.secure_url
      });
  
      return {
        success: true,
        saveUrl,
        applePassUrl: applePassUpload.secure_url
      };
  
    } catch (error) {
      console.error("[GENERATE_STUDENT_ID_ERROR]", error);
      throw error;
    }
  }
  
  export { generateStudentID, processProfileImage };