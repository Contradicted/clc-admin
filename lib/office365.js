import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { ClientSecretCredential } from "@azure/identity";

const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID,
  process.env.AZURE_CLIENT_ID,
  process.env.AZURE_CLIENT_SECRET
);

const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ["https://graph.microsoft.com/.default"],
});

export const graphClient = Client.initWithMiddleware({
  authProvider: authProvider,
});

/**
 * Formats a student's name for their email address
 * @param {string} firstName First name
 * @param {string} lastName Last name
 * @returns {string} Formatted email prefix
 */
function formatEmailName(firstName, lastName) {
  // Split first name to handle middle names
  const names = firstName.trim().split(/\s+/);
  const primaryFirst = names[0];
  const middleInitials = names
    .slice(1)
    .map((name) => name.charAt(0))
    .join("");

  // Remove any special characters and spaces, convert to lowercase
  const formattedFirst = primaryFirst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  const formattedLast = lastName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  // Capitalize first letter and keep rest of the name
  const capitalizedFirst =
    formattedFirst.charAt(0).toUpperCase() + formattedFirst.slice(1);
  const capitalizedLast =
    formattedLast.charAt(0).toUpperCase() + formattedLast.slice(1);

  // Include middle initials if they exist
  return middleInitials
    ? `${capitalizedFirst}${middleInitials}.${capitalizedLast}`
    : `${capitalizedFirst}.${capitalizedLast}`;
}

async function assignLicense(userPrincipalName) {
  try {
    // First, get available licenses (skuIds) in the tenant
    const subscribedSkus = await graphClient.api('/subscribedSkus').get();
    
    // Find the Microsoft 365 A1 for students license
    const studentLicense = subscribedSkus.value.find(sku => 
      sku.skuPartNumber === 'STANDARDWOFFPACK_IW_STUDENT'
    );

    if (!studentLicense) {
      throw new Error('Student license not found in tenant');
    }

    // Prepare the license assignment
    const licenseUpdate = {
      addLicenses: [
        {
          skuId: studentLicense.skuId,
          // Enable all service plans
          disabledPlans: []
        }
      ],
      removeLicenses: [] // We're not removing any licenses
    };

    // Set the user's usage location first (required for license assignment)
    await graphClient
      .api(`/users/${userPrincipalName}`)
      .update({ usageLocation: 'GB' });

    // Assign the license to the user
    await graphClient
      .api(`/users/${userPrincipalName}/assignLicense`)
      .post(licenseUpdate);

    console.log(`Successfully assigned license to user: ${userPrincipalName}`);
  } catch (error) {
    console.error('Error assigning license:', error);
    throw error;
  }
}

/**
 * Checks if an email already exists in Office 365
 * @param {string} email Email address to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 */
async function checkEmailExists(email) {
  try {
    await graphClient.api(`/users/${email}`).get();
    return true;
  } catch (error) {
    // If error code is 404, user doesn't exist
    if (error.statusCode === 404) {
      return false;
    }
    // For any other error, throw it
    throw error;
  }
}

/**
 * Finds a team by its course name and commencement date
 * @param {string} courseName The name of the course to find the team for
 * @param {Date} [commencementDate] Optional commencement date to match specific cohort
 * @returns {Promise<Object|null>} The team object if found, null otherwise
 */
async function findTeamByCourseName(courseName, commencementDate) {
  try {
    // First get all teams
    const response = await graphClient
      .api("/groups")
      .filter("resourceProvisioningOptions/any(x:x eq 'Team')")
      .select("id,displayName")
      .get();

    if (!response.value || response.value.length === 0) {
      console.log("No teams found");
      return null;
    }

    // Normalize course name for comparison (remove common prefixes/suffixes and trim)
    const normalizeTeamName = (name) => {
      return name
        .replace(/^\([^)]+\)\s*/, "") // Remove prefixes like (GC)
        .replace(/\([^)]+\)$/, "") // Remove suffixes like (LON-JAN25)
        .trim();
    };

    const normalizedCourseName = normalizeTeamName(courseName);
    console.log(
      `Searching for teams matching normalized course name: ${normalizedCourseName}`
    );

    // Filter teams that include the course name
    let matchingTeams = response.value.filter((team) => {
      const normalizedTeamName = normalizeTeamName(team.displayName);
      const isMatch = normalizedTeamName.includes(normalizedCourseName);
      if (isMatch) {
        console.log(`Found matching team: ${team.displayName}`);
        console.log(`  Normalized team name: ${normalizedTeamName}`);
      }
      return isMatch;
    });

    console.log(`Found ${matchingTeams.length} teams matching course name`);

    if (matchingTeams.length === 0) {
      return null;
    }

    // If commencement date is provided, try to match the specific cohort
    if (commencementDate) {
      const date = new Date(commencementDate);
      const month = date
        .toLocaleString("default", { month: "short" })
        .toUpperCase()
        .slice(0, 3);
      const year = date.getFullYear().toString().slice(-2);
      const cohortSuffix = `${month}${year}`;

      console.log(`Debug - Input courseName: "${courseName}"`);

      // Extract campus code from the course name
      let campusCode = null;

      // First try to extract using the exact team name format pattern: (XXX-MMMYY)
      const fullFormatMatch = courseName.match(/\(([A-Z]{3})-[A-Z]{3}\d{2}\)/i);
      if (fullFormatMatch) {
        campusCode = fullFormatMatch[1].toUpperCase();
        console.log(
          `Debug - Extracted campus code ${campusCode} from full formatted team name`
        );
      }

      // If not found, try to find standalone campus code
      if (!campusCode) {
        const campusOnlyMatch = courseName.match(/\(([A-Z]{3})\)/i);
        if (campusOnlyMatch) {
          campusCode = campusOnlyMatch[1].toUpperCase();
          console.log(
            `Debug - Extracted campus code ${campusCode} from standalone campus code`
          );
        }
      }

      // If still not found, check for city names
      if (!campusCode) {
        const cityMap = {
          london: "LON",
          sheffield: "SHE",
          bristol: "BRI",
          birmingham: "BIR",
        };

        for (const [city, code] of Object.entries(cityMap)) {
          if (courseName.toLowerCase().includes(city)) {
            campusCode = code;
            console.log(
              `Debug - Extracted campus code ${campusCode} from city name match: ${city}`
            );
            break;
          }
        }
      }

      console.log(
        `Looking for team with cohort ${cohortSuffix}${campusCode ? ` at campus ${campusCode}` : " (no campus specified)"}`
      );

      // If we've identified a campus code, look for an exact match with campus and cohort
      if (campusCode) {
        const exactCampusMatch = matchingTeams.find((team) => {
          const campusCohortPattern = `(${campusCode}-${cohortSuffix})`;
          const isMatch = team.displayName.includes(campusCohortPattern);
          console.log(
            `Debug - Checking team "${team.displayName}" for pattern "${campusCohortPattern}": ${isMatch}`
          );

          if (isMatch) {
            console.log(
              `Found exact campus and cohort match: ${team.displayName}`
            );
          }

          return isMatch;
        });

        if (exactCampusMatch) {
          console.log(
            `Returning team with campus and cohort match: ${exactCampusMatch.id} ${exactCampusMatch.displayName}`
          );
          return exactCampusMatch;
        }

        console.log(
          `No match found for campus ${campusCode} and cohort ${cohortSuffix}`
        );
      }

      // If no campus-specific match found or no campus code identified, fall back to just cohort match
      console.log(`Falling back to cohort-only match for ${cohortSuffix}`);
      const cohortMatch = matchingTeams.find((team) => {
        const isMatch = team.displayName.includes(cohortSuffix);
        if (isMatch) {
          console.log(`Found cohort match (no campus): ${team.displayName}`);
        }
        return isMatch;
      });

      if (cohortMatch) {
        console.log(
          `Warning: Returning cohort-only match (no campus): ${cohortMatch.id} ${cohortMatch.displayName}`
        );
        return cohortMatch;
      }

      console.log(
        `No match found for cohort ${cohortSuffix}, available teams:`,
        matchingTeams.map((t) => t.displayName).join(", ")
      );
    }

    // If no commencement date or no match found, sort by date suffix and return most recent
    matchingTeams.sort((a, b) => {
      const aMatch = a.displayName.match(/([A-Z]{3})(\d{2})$/);
      const bMatch = b.displayName.match(/([A-Z]{3})(\d{2})$/);
      if (!aMatch || !bMatch) return 0;

      // Extract month and year from both teams
      const [, aMonth, aYear] = aMatch;
      const [, bMonth, bYear] = bMatch;

      // Compare years first
      if (aYear !== bYear) {
        return parseInt(bYear) - parseInt(aYear); // Higher year is more recent
      }

      // If years are the same, compare months
      const monthOrder = {
        JAN: 1,
        FEB: 2,
        MAR: 3,
        APR: 4,
        MAY: 5,
        JUN: 6,
        JUL: 7,
        AUG: 8,
        SEP: 9,
        OCT: 10,
        NOV: 11,
        DEC: 12,
      };

      return monthOrder[bMonth] - monthOrder[aMonth]; // Higher month is more recent
    });

    console.log(`Selected most recent team: ${matchingTeams[0].displayName}`);
    return matchingTeams[0];
  } catch (error) {
    console.error("Error fetching team:", error);
    return null;
  }
}

/**
 * Adds a student to a Teams team and sets their job title
 * @param {string} studentEmail The student's Office 365 email
 * @param {string} courseName The name of the course/team
 * @param {Date} commencementDate The commencement date of the student
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function addStudentToTeam(studentEmail, courseName, commencementDate) {
  try {
    if (!studentEmail || !courseName) {
      throw new Error('Student email, course name and user ID are required');
    }

    // Find team by course name
    const team = await findTeamByCourseName(courseName, commencementDate);

    if (!team) {
      console.error(`No team found for course: ${courseName}`);
      return false;
    }

    // Get user by email
    const user = await graphClient
      .api("/users")
      .filter(`mail eq '${studentEmail}'`)
      .get();

    if (!user || !user.value || user.value.length === 0) {
      console.log("User not found:", studentEmail);
      return false;
    }
    const userId = user.value[0].id;

    // Add member to team using Teams endpoint
    // await graphClient
    //   .api(`/teams/${team.id}/members`)
    //   .post({
    //     "@odata.type": "#microsoft.graph.aadUserConversationMember",
    //     roles: ["member"],
    //     "user@odata.bind": `https://graph.microsoft.com/v1.0/users(\${userID\})`
    //   });

    // Add member to team using Groups endpoint
    await graphClient.api(`/groups/${team.id}/members/$ref`).post({
      "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
    })

    // Set user's job title to "Student"
    try {
      await graphClient
        .api(`/users/${userId}`)
        .update({ jobTitle: "Student" });
      console.log(`✅ Set title "Student" for user: ${studentEmail}`);
    } catch (error) {
      console.error(`Error setting job title:`, error.message);
      // Continue with adding to team even if title update fails
    }

    console.log(`✅ Successfully added ${studentEmail} to team: ${team.displayName}`);
    return true;
  } catch (error) {
    console.error(`Error adding student to team:`, error.message);
    return false;
  }
}

/**
 * Gets the campus code for team name
 * @param {string} campus Full campus name
 * @param {string} [studyMode] Study mode of the course
 * @returns {string} Three letter campus code or H01 for hybrid learning
 */
function getCampusCode(campus, studyMode) {
<<<<<<< HEAD
  console.log(campus, studyMode);
=======
>>>>>>> e8f76607e2d1c589ee48b3575f53766fb10ed30e
  // Return H01 for hybrid learning courses
  if (studyMode && studyMode.toLowerCase() === "hybrid_learning") {
    return "H01";
  }

  const campusCodes = {
    London: "LON",
    Bristol: "BRI",
    Sheffield: "SHE",
    Birmingham: "BIR",
  };
  return campusCodes[campus] || "LON"; // Default to London if not found
}

/**
 * Generates the Teams team name based on course, campus, commencement date and study mode
 * @param {string} courseName The base course name
 * @param {Date} commencementDate The commencement date
 * @param {string} campus The campus name
 * @param {string} [studyMode] Study mode of the course
 * @returns {string} The full team name including cohort
 */
function generateTeamName(courseName, commencementDate, campus, studyMode) {
  const date = new Date(commencementDate);
  const month = date
    .toLocaleString("default", { month: "short" })
    .toUpperCase()
    .slice(0, 3);
  const year = date.getFullYear().toString().slice(-2);
  const campusCode = getCampusCode(campus, studyMode);
<<<<<<< HEAD
  console.log(campusCode);
=======
>>>>>>> e8f76607e2d1c589ee48b3575f53766fb10ed30e
  return `${courseName} (${campusCode}-${month}${year})`;
}

/**
 * Gets the department name from the course
 * @param {string} courseName The course name
 * @returns {string} The department name
 */
function getDepartmentFromCourse(courseName) {
  const courseNameLower = courseName.toLowerCase();

  if (courseNameLower.includes("business") ||
      courseNameLower.includes("management") ||
      courseNameLower.includes("accounting") ||
      courseNameLower.includes("finance")) {
        return "School of Business"
  }

  if (courseNameLower.includes("computing") ||
      courseNameLower.includes("software") ||
      courseNameLower.includes("it")) {
        return "School of Computing"
      }

  return "City of London College" // Default
}

/**
 * Creates a new student account in Office 365
 * @param {Object} student Student information
 * @param {string} student.firstName First name
 * @param {string} student.lastName Last name
 * @param {string} student.id Student ID
 * @param {string} student.personalEmail Personal email
 * @param {string} student.course Student's course name
 * @param {Date} student.commencementDate The course commencement date
 * @param {string} student.campus The campus name
 * @param {string} [student.studyMode] Study mode of the course
 * @returns {Promise<{email: string, password: string}>} New account credentials
 */
export async function createStudentAccount(student) {
  const emailDomain = process.env.OFFICE_365_DOMAIN;
  let emailPrefix = formatEmailName(student.firstName, student.lastName);
  let email = `${emailPrefix}@${emailDomain}`;
  
  try {
    // Check if email exists and generate alternative if needed
    let counter = 1;
    while (await checkEmailExists(email)) {
      emailPrefix = `${formatEmailName(student.firstName, student.lastName)}${counter}`;
      email = `${emailPrefix}@${emailDomain}`;
      counter++;
    }

    // Generate a temporary password
    const tempPassword = `Welcome${student.id}!`;

    // Trim whitespace from first and last names
    const trimmedFirstName = student.firstName.trim().replace(/\s+/g, " ");
    const trimmedLastName = student.lastName.trim().replace(/\s+/g, " ");

    const user = {
      accountEnabled: true,
      displayName: `${trimmedFirstName} ${trimmedLastName}`,
      mailNickname: email.split('@')[0],
      userPrincipalName: email,
      usageLocation: "GB",
      passwordProfile: {
        forceChangePasswordNextSignIn: true,
        password: tempPassword
      },
      givenName: trimmedFirstName,
      surname: trimmedLastName,
      otherMails: [student.personalEmail],
      department: getDepartmentFromCourse(student.course)
    };

    // Create the user account
    const createdUser = await graphClient.api("/users").post(user);

    // After successful user creation, assign the license
    await assignLicense(createdUser.userPrincipalName);

    // Add student to their course team if course is provided
    if (student.course) {
      const teamName = generateTeamName(
        student.course,
        student.commencementDate,
        student.campus,
        student.studyMode
      );
      await addStudentToTeam(email, teamName, student.commencementDate);
    }

    return {
      email,
      password: tempPassword
    };

  } catch (error) {
    console.error("Error creating Office 365 account:", error);
    throw error;
  }
}

/**
 * Deletes a student's Office 365 account
 * @param {string} email The student's Office 365 email address
 * @returns {Promise<void>}
 */
export async function deleteStudentAccount(email) {
  try {
    // First, get the user to verify they exist
    const user = await graphClient.api(`/users/${email}`).get();
    
    if (!user) {
      throw new Error(`No Office 365 account found for ${email}`);
    }

    // Delete the user account
    await graphClient.api(`/users/${email}`).delete();
    
    console.log(`Successfully deleted Office 365 account for ${email}`);
  } catch (error) {
    console.error("Error deleting Office 365 account:", error);
    throw new Error(`Failed to delete Office 365 account for ${email}: ${error.message}`);
  }
}
