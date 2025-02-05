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

    if (status) {
      if (status === existingApplicationInterview.status) {
        return;
      }

      await db.application.update({
        where: {
          id: existingApplication.id,
        },
        data: {
          status: status === "pass" ? "Interview_successful" : "Rejected",
        },
      });

      // TODO: Send email if interview is successful
      // await updateStatusEmail("Interview_successful", existingApplication, student, "", "");
    }

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

  return { success: "Successfully created interview" };
};

export const interviewQuestions = async (
  questions,
  files,
  deletedFiles,
  interviewID
) => {
  const interview = await getInterviewByInterviewID(interviewID);

  if (!interview) {
    return { error: "Interview does not exist!" };
  }

  // Delete Files
  if (deletedFiles.length > 0) {
    const filesToDelete = deletedFiles.map(async (file) => {
      try {
        await utapi.deleteFiles(file.fileKey);
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
  }

  const upsertOperations = questions.map((q) => {
    const existingQuestion = existingQuestions.find(
      (eq) => eq.question === q.value
    );

    // If the question exists and the answer hasn't changed, don't update
    if (existingQuestion && existingQuestion.answer === q.answer) {
      return; // No operation needed
    }

    return db.interviewQuestions.upsert({
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
    });
  });

  // Filter out any undefined operations (from questions that didn't change)
  const filteredOperations = upsertOperations.filter((op) => op !== undefined);

  // Execute all upsert operations in a transaction
  await db.$transaction(filteredOperations);

  return {
    success: "Successfully saved interview Q/A",
    uploadedFiles,
  };
};
