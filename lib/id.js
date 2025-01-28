import { db } from './db';

const Campus = {
  LONDON: 'London',
  BRISTOL: 'Bristol',
  SHEFFIELD: 'Sheffield',
  BIRMINGHAM: 'Birmingham'
};

const CAMPUS_PREFIXES = {
  [Campus.LONDON]: '207',
  [Campus.BRISTOL]: '117',
  [Campus.SHEFFIELD]: '114',
  [Campus.BIRMINGHAM]: '121'
};

const MAX_RETRIES = 3;
const MAX_ID_NUMBER = 999999;

// Validation functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
}

function validateRequiredFields(data) {
  const required = ['firstName', 'lastName', 'dateOfBirth', 'email'];
  const missing = required.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  // Validate name lengths and characters
  if (data.firstName.length < 2 || data.firstName.length > 50) {
    throw new Error('First name must be between 2 and 50 characters');
  }
  if (data.lastName.length < 2 || data.lastName.length > 50) {
    throw new Error('Last name must be between 2 and 50 characters');
  }

  // Check for placeholder or inappropriate names
  const placeholderPattern = /test|dummy|example|undefined|null|[0-9]+/i;
  if (placeholderPattern.test(data.firstName) || placeholderPattern.test(data.lastName)) {
    throw new Error('Invalid name detected');
  }
}

async function validatePhotoUrl(url) {
  if (!url) return;

  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error('Invalid profile picture URL');
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType.startsWith('image/')) {
      throw new Error('Profile picture must be an image file');
    }
  } catch (error) {
    throw new Error('Unable to validate profile picture URL');
  }
}

async function generateStudentID(campus, retryCount = 0) {
  if (retryCount >= MAX_RETRIES) {
    throw new Error('Failed to generate unique student ID after multiple attempts');
  }

  // Get the campus prefix
  const prefix = CAMPUS_PREFIXES[campus];

  // Find the last student ID for this campus
  const lastStudent = await db.enrolledStudent.findFirst({
    where: {
      AND: [
        { campus: campus },
        { id: { startsWith: prefix } }
      ]
    },
    orderBy: {
      id: 'desc'
    }
  });

  let nextNumber;

  if (!lastStudent) {
    nextNumber = 100001;
  } else {
    // Extract the numeric portion and increment
    const lastNumber = parseInt(lastStudent.id.slice(3));
    nextNumber = lastNumber + 1;

    // Check if we've reached the maximum ID
    if (nextNumber > MAX_ID_NUMBER) {
      throw new Error(`Maximum student ID range exceeded for campus ${campus}`);
    }
  }

  // Generate the ID
  const studentId = `${prefix}${nextNumber.toString().padStart(6, '0')}`;

  // Double-check ID uniqueness
  const existingId = await db.enrolledStudent.findUnique({
    where: { id: studentId }
  });

  if (existingId) {
    // If ID already exists, retry with incremented counter
    return generateStudentID(campus, retryCount + 1);
  }

  return studentId;
}

async function createEnrolledStudent(applicationID, campus) {
  // Start a transaction for concurrent enrollment protection
  return await db.$transaction(async (tx) => {
    // Check if student is already enrolled with this application
    const existingEnrollment = await tx.enrolledStudent.findUnique({
      where: { applicationID: applicationID }
    });

    if (existingEnrollment) {
      throw new Error('Student is already enrolled with this application');
    }

    // Get and validate application status
    const application = await tx.application.findUnique({
      where: { id: applicationID },
      include: {
        user: true,
        course: true
      }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // if (application.status !== 'Approved') {
    //   throw new Error('Cannot create enrollment: Application is not in Approved status');
    // }

    // Validate required fields
    validateRequiredFields(application.user);
    validateEmail(application.user.email);

    // Check if student is already enrolled with another application
    const existingStudentWithEmail = await tx.enrolledStudent.findFirst({
      where: { email: application.user.email }
    });

    if (existingStudentWithEmail) {
      throw new Error('A student is already enrolled with this email address');
    }

    // Validate campus
    if (campus !== Campus.LONDON && campus !== Campus.BRISTOL && campus !== Campus.SHEFFIELD && campus !== Campus.BIRMINGHAM) {
      throw new Error('Invalid campus. Must be either London, Bristol, Sheffield or Birmingham');
    }

    // Validate course exists and is available at campus
    if (!application.course) {
      throw new Error('Application course not found');
    }

    // Get course instances for this course
    const courseInstance = await tx.courseInstance.findFirst({
      where: {
        course_id: application.course.id,
        status: true // Only active instances
      }
    });

    if (!courseInstance) {
      throw new Error('Selected course is not available at this campus');
    }

    // Validate profile picture if exists
    if (application.photoUrl) {
      await validatePhotoUrl(application.photoUrl);
    }

    // Generate the student ID
    const studentId = await generateStudentID(campus);

    // Create the enrolled student and return it
    return await tx.enrolledStudent.create({
      data: {
        id: studentId,
        firstName: application.user.firstName,
        lastName: application.user.lastName,
        dateOfBirth: application.user.dateOfBirth,
        email: application.user.email,
        campus: campus,
        ...(application.photoUrl && { profile_picture_url: application.photoUrl }),
        ...(application.photoName && { profile_picture_name: application.photoName }),
        application: {
          connect: {
            id: applicationID
          }
        },
        user: {
          connect: {
            id: application.user.id
          }
        }
      }
    });
  });
}

async function updateEnrolledStudentPhoto(applicationID, photoUrl, photoName) {
  // Find the enrolled student record
  const enrolledStudent = await db.enrolledStudent.findUnique({
    where: {
      applicationID: applicationID
    }
  });

  if (!enrolledStudent) {
    throw new Error('No enrolled student found for this application');
  }

  // Update the enrolled student's profile picture
  await db.enrolledStudent.update({
    where: {
      id: enrolledStudent.id
    },
    data: {
      profile_picture_url: photoUrl,
      profile_picture_name: photoName
    }
  });
}

export { Campus, generateStudentID, createEnrolledStudent, updateEnrolledStudentPhoto };
