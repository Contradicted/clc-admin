import { useCallback } from "react";

export const useReorderQuestions = (fields, move) => {
  const reorderQuestions = useCallback(() => {
    const defaultQuestionValues = [
      "interviewer_confirm",
      "clarity_of_candidate",
      "interviewer_name",
    ];

    if (fields.length > 0) {
      const isInCorrectOrder = defaultQuestionValues.every((value, index) => {
        const fieldIndex = fields.findIndex((field) => field.value === value);
        return (
          fieldIndex === fields.length - defaultQuestionValues.length + index
        );
      });

      if (!isInCorrectOrder) {
        const defaultQuestions = defaultQuestionValues
          .map((value) => {
            const index = fields.findIndex((field) => field.value === value);
            return { index, value };
          })
          .filter((item) => item.index !== -1);

        defaultQuestions.sort((a, b) => {
          if (a.value === "interviewer_name") return 1;
          if (b.value === "interviewer_name") return -1;
          return b.index - a.index;
        });

        defaultQuestions.forEach(({ index }, i) => {
          move(index, fields.length - 1 - i);
        });
      }
    }
  }, [fields.length, move]);

  return reorderQuestions;
};
