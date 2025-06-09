"use server";

import { getApplicationByID } from "@/data/application";
import {
  getInterviewByApplicationID,
  getInterviewByInterviewID,
} from "@/data/application-interview";
import { getStudentByApplicationID, getUserById } from "@/data/student";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateStatusEmail } from "@/lib/mail";
import { utapi } from "@/lib/uploadthing";
import { formatDateTime } from "@/lib/utils";
import { InterviewSchema } from "@/schemas";
import { logActivity, logChanges } from "./activity-log";
import { revalidatePath } from "next/cache";

export const interview = async (values, applicationID) => {
  const existingApplication = await getApplicationByID(applicationID);
  const user = await currentUser();
  const existingUser = await getUserById(user.id);
  const isAdmin = existingUser.role === "Admin";
  const student = await getStudentByApplicationID(applicationID);

  if (!existingApplication) {
    return { error: "Application does not exist!" };
  }

  if (!student) {
    return { error: "Student does not exist!" };
  }

  if (
    ![
      "Approved_for_Interview",
      "Invited_for_Interview",
      "Interview_successful",
      "Rejected",
      "Finished",
      "Unfinished",
      "Void",
      "Approved",
    ].includes(existingApplication.status)
  ) {
    return { error: "Application must be approved for interview!" };
  }

  const validatedField = InterviewSchema.safeParse(values);

  if (!validatedField.success) {
    return { error: "Invalid fields!" };
  }

  if (!existingUser) {
    return { error: "User doesn't exist!" };
  }

  if (!isAdmin) {
    return { error: "Insufficient Privileges!" };
  }

  const { date } = validatedField.data;
  const { status, student_test, test_status, notes } = values;

  const existingApplicationInterview =
    await getInterviewByApplicationID(applicationID);

  if (existingApplicationInterview) {
    await db.applicationInterview.update({
      where: {
        id: existingApplicationInterview.id,
      },
      data: {
        ...validatedField.data,
        status,
        student_test: student_test === "true",
        test_status,
        notes,
      },
    });

    // Log changes
    await logChanges(
      existingUser.id,
      applicationID,
      existingApplicationInterview,
      {
        ...validatedField.data,
        status,
        student_test: student_test === "true",
        test_status,
        notes,
      },
      "UPDATE_INTERVIEW"
    );

    if (status) {
      if (status === existingApplicationInterview.status) {
        return;
      }

      // Update application status based on interview result
      const newAppStatus =
        status === "pass" ? "Interview_successful" : "Rejected";

      await db.application.update({
        where: {
          id: existingApplication.id,
        },
        data: {
          status: newAppStatus,
        },
      });

      // Format status values to be more user-friendly
      const formatStatus = (s) => {
        if (!s) return "None";
        return s.charAt(0).toUpperCase() + s.slice(1); // Capitalize first letter
      };

      // Log status change separately
      await logActivity(existingUser.id, applicationID, "UPDATE_INTERVIEW", {
        field: "interview.status",
        prevValue: formatStatus(existingApplicationInterview.status),
        newValue: formatStatus(status),
      });

      // Send email notification based on interview result
      try {
        // Send different emails based on pass/fail status
        await updateStatusEmail(
          status === "pass" ? "Interview_successful" : "Rejected",
          existingApplication,
          student,
          "", // token not needed
          "" // Use interview notes as additional message if available
        );
      } catch (error) {
        console.error("[INTERVIEW_EMAIL_ERROR]", error);
      }
    }

    // Email notifications for interview status changes are now handled above

    // Log date change if it's different
    if (
      date &&
      date.toString() !== existingApplicationInterview.date?.toString()
    ) {
      await logActivity(existingUser.id, applicationID, "UPDATE_INTERVIEW", {
        field: "interview.date",
        prevValue: existingApplicationInterview.date,
        newValue: date,
      });
    }

    revalidatePath(`/applications/${applicationID}`);

    return { success: "Successfully updated interview" };
  }

  await db.applicationInterview.create({
    data: {
      date,
      applicationID,
    },
  });

  await updateStatusEmail(
    "Invitation_For_Interview",
    existingApplication,
    student,
    "",
    "",
    date
  );

  await db.note.create({
    data: {
      content: `Interview scheduled for ${formatDateTime(date).dateTime}`,
      applicationID,
      type: "Admin",
      userID: existingUser.id,
    },
  });

  await logActivity(existingUser.id, applicationID, "INTERVIEW_SCHEDULED", {
    field: "interview",
    prevValue: null,
    newValue: null,
  });

  revalidatePath(`/applications/${applicationID}`);

  return { success: "Successfully created interview" };
};

export const interviewQuestions = async (
  questions,
  files,
  deletedFiles,
  interviewID
) => {
  const interview = await getInterviewByInterviewID(interviewID);
  const user = await currentUser();

  if (!interview) {
    return { error: "Interview does not exist!" };
  }

  // Get the application ID for logging activity
  const applicationID = interview.applicationID;

  // Delete Files
  if (deletedFiles.length > 0) {
    const filesToDelete = deletedFiles.map(async (file) => {
      try {
        await utapi.deleteFiles(file.fileKey);

        // Log the file deletion with DELETE_FILE action type
        await logActivity(user.id, applicationID, "DELETE_FILE", {
          field: `interview.file`,
          prevValue: file.name || file.url,
          newValue: null,
        });

        return file.fileID;
      } catch (error) {
        console.error(`Failed to delete file ${file.fileID}:`, error);
      }
    });

    const deletedFileIDs = (await Promise.all(filesToDelete)).filter(
      (id) => id !== null
    );

    if (filesToDelete.length > 0) {
      await db.interviewFiles.deleteMany({
        where: {
          id: {
            in: deletedFileIDs,
          },
        },
      });
    }
  }

  const uploadedFiles = [];

  // Fetch existing questions
  const existingQuestions = await db.interviewQuestions.findMany({
    where: { interviewID },
  });

  const questionsToDelete = existingQuestions.filter(
    (eq) => !questions.some((q) => q.value === eq.question)
  );

  // Delete questions
  if (questionsToDelete.length > 0) {
    // Log each question deletion
    for (const question of questionsToDelete) {
      // Format the question name for display (convert from snake_case to Title Case)
      const formattedQuestionName = question.question
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Truncate long question names (limit to 50 characters)
      const truncatedQuestionName =
        formattedQuestionName.length > 50
          ? `${formattedQuestionName.substring(0, 50)}...`
          : formattedQuestionName;

      await logActivity(user.id, applicationID, "UPDATE_INTERVIEW", {
        field: `interview.question.${question.question}`,
        prevValue: {
          question: truncatedQuestionName,
          answer: question.answer || "No answer",
        },
        newValue: null,
      });
    }

    await db.interviewQuestions.deleteMany({
      where: {
        id: {
          in: questionsToDelete.map((q) => q.id),
        },
      },
    });
  }

  // Upload Files
  for (const [key, value] of files.entries()) {
    const response = await utapi.uploadFiles(value);
    const file = await db.interviewFiles.create({
      data: {
        url: response.data.url,
        name: response.data.name,
        interviewID: interview.id,
      },
    });
    uploadedFiles.push(file);

    // Log the file upload with ADD_FILE action type
    await logActivity(user.id, applicationID, "ADD_FILE", {
      field: `interview.file`,
      prevValue: null,
      newValue: response.data.name || response.data.url,
    });
  }

  const upsertOperations = [];
  const logOperations = [];

  for (const q of questions) {
    const existingQuestion = existingQuestions.find(
      (eq) => eq.question === q.value
    );

    // If the question exists and the answer hasn't changed, don't update
    if (existingQuestion && existingQuestion.answer === q.answer) {
      continue; // No operation needed
    }

    // Add database operation
    upsertOperations.push(
      db.interviewQuestions.upsert({
        where: {
          interviewID_question: {
            interviewID: interviewID,
            question: q.value,
          },
        },
        update: {
          answer: q.answer,
          updatedAt: new Date(),
        },
        create: {
          interviewID,
          question: q.value,
          answer: q.answer,
          isCustom: q.isCustom || false,
        },
      })
    );

    // Format the question name for display (convert from snake_case to Title Case)
    const formattedQuestionName = q.value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Truncate long question names (limit to 50 characters)
    const truncatedQuestionName =
      formattedQuestionName.length > 50
        ? `${formattedQuestionName.substring(0, 50)}...`
        : formattedQuestionName;

    // Add logging operation
    if (existingQuestion) {
      // This is an update
      logOperations.push(
        logActivity(user.id, applicationID, "UPDATE_INTERVIEW", {
          field: `interview.question.${q.value}`,
          prevValue: {
            question: truncatedQuestionName,
            answer: existingQuestion.answer || "No answer",
          },
          newValue: {
            question: truncatedQuestionName,
            answer: q.answer || "No answer",
          },
        })
      );
    } else {
      // This is a new question
      logOperations.push(
        logActivity(user.id, applicationID, "UPDATE_INTERVIEW", {
          field: `interview.question.${q.value}`,
          prevValue: null,
          newValue: {
            question: truncatedQuestionName,
            answer: q.answer || "No answer",
          },
        })
      );
    }
  }

  // Execute all upsert operations in a transaction
  await db.$transaction(upsertOperations);

  // Execute all logging operations (not in transaction as they're not critical)
  await Promise.all(logOperations);
  await Promise.all(logOperations);

  // Revalidate the path to refresh the UI
  revalidatePath(`/applications/${applicationID}`);

  return {
    success: "Successfully saved interview Q/A",
    uploadedFiles,
  };
};
