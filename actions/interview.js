"use server";

import { getApplicationByID } from "@/data/application";
import {
  getInterviewByApplicationID,
  getInterviewByInterviewID,
} from "@/data/application-interview";
import { db } from "@/lib/db";
import { utapi } from "@/lib/uploadthing";
import { InterviewSchema } from "@/schemas";
import { isEmpty } from "lodash";

export const interview = async (values, applicationID) => {
  const existingApplication = await getApplicationByID(applicationID);

  if (!existingApplication) {
    return { error: "Application does not exist!" };
  }

  const validatedField = InterviewSchema.safeParse(values);

  if (!validatedField.success) {
    return { error: "Invalid fields!" };
  }

  const { date } = validatedField.data;

  const existingApplicationInterview =
    await getInterviewByApplicationID(applicationID);

  if (existingApplicationInterview) {
    await db.applicationInterview.update({
      where: {
        id: existingApplicationInterview.id,
      },
      data: {
        ...validatedField.data,
      },
    });

    return { success: "Successfully updated interview" };
  }

  await db.applicationInterview.create({
    data: {
      date,
      applicationID,
    },
  });

  return { success: "Successfully created interview" };
};

export const interviewQuestions = async (questions, files, interviewID) => {
  const interview = await getInterviewByInterviewID(interviewID);

  if (!interview) {
    return { error: "Interview does not exist!" };
  }

  const uploadedFiles = [];

  for (const [key, value] of files.entries()) {
    uploadedFiles.push({
      name: value.name,
      file: value,
    });
  }

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
  if (uploadedFiles && uploadedFiles.length > 0) {
    let fileURL = "";
    let fileName = "";

    uploadedFiles.map(async (f) => {
      const response = await utapi.uploadFiles(f.file);

      await db.interviewFiles.create({
        data: {
          url: response.data.url,
          name: response.data.name,
          interviewID: interview.id,
        },
      });
    });
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

  return { success: "Successfully saved interview Q/A" };
};
