import { interviewQuestions } from "@/actions/interview";
import { interviewFileColumns } from "@/components/columns";
import FilesTable from "@/components/files-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_INTERVIEW_QUESTIONS } from "@/constants";
import { getInterviewFilesByInterviewID } from "@/data/application-interview";
import { db } from "@/lib/db";
import { LoaderCircle, Paperclip, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";

const matchTitle = (value) => {
  const matchedTitle = DEFAULT_INTERVIEW_QUESTIONS.filter(
    (q) => value === q.value
  );

  return matchedTitle[0]?.text;
};

const InterviewQuestions = ({
  open,
  onOpenChange,
  interviewID,
  questionData,
  fileData,
}) => {
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [data, setData] = useState(fileData);
  const [files, setFiles] = useState([]);

  const defaultQuestionIds = [18, 19, 20];

  const router = useRouter();
  const { toast } = useToast();

  const dropzone = {
    accept: {
      "application/*": [".pdf", ".doc", ".docx"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx", ".doc"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: false,
    maxFiles: 4,
    maxSize: 5 * 1024 * 1024, // Max 5MB per file
    validator: (file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        return {
          code: "file-invalid-type",
          message: "Invalid file type. Please try a different file",
        };
      }
      return null;
    },
  };

  const form = useForm({
    defaultValues: {
      questions:
        questionData?.length > 0
          ? questionData.map((q) => ({
              id: q.id,
              text: matchTitle(q.question) || q.question,
              value: q.question,
              answer: q.answer || "",
              isCustom: q.isCustom,
            }))
          : DEFAULT_INTERVIEW_QUESTIONS.filter((q) =>
              defaultQuestionIds.includes(q.id)
            ),
      files: null,
    },
  });

  const { fields, prepend, remove, move } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const hasMovedDefaults = useRef(false); // Track if default questions have been moved

  const handleQuestionSelect = (value) => {
    if (value && !fields.some((field) => field.value === value)) {
      const selectedQuestionObj = DEFAULT_INTERVIEW_QUESTIONS.find(
        (q) => q.value === value
      );
      if (selectedQuestionObj) {
        const isDefaultQuestion = defaultQuestionIds.includes(
          selectedQuestionObj.id
        );

        if (!isDefaultQuestion) {
          prepend({ ...selectedQuestionObj, answer: "", isCustom: false });
        }

        setSelectedQuestion(""); // Reset the select input
      }
    }
  };

  const handleAddCustomQuestion = () => {
    if (customQuestion.trim()) {
      prepend({
        question: customQuestion,
        text: customQuestion,
        value: customQuestion,
        answer: "",
        isCustom: true,
      });
      setCustomQuestion("");
    }
  };

  const handleDeleteFiles = (file) => {
    const updatedData = data.filter((df) => df.id !== file.fileID);
    setData(updatedData);

    setDeletedFiles((prev) => [...prev, file]);
  };

  useEffect(() => {
    const defaultQuestionValues = [
      "interviewer_confirm",
      "clarity_of_candidate",
      "interviewer_name",
    ];

    // Ensure default questions are present and move them if not already moved
    if (!hasMovedDefaults.current && questionData?.length > 0) {
      const defaultFieldsIndexes = fields
        .map((field, index) => {
          if (defaultQuestionValues.includes(field.value)) {
            return index;
          }
          return null;
        })
        .filter((index) => index !== null); // Filter out null values

      // Sort the indexes in reverse order to prevent issues when moving
      defaultFieldsIndexes.sort((a, b) => b - a);

      // Move each default question to the bottom
      defaultFieldsIndexes.forEach((fromIndex) => {
        move(fromIndex, fields.length - 1);
      });

      hasMovedDefaults.current = true; // Mark as moved
    }
  }, [questionData, fields, move]);

  useEffect(() => {
    if (!open) {
      setDeletedFiles([]);
    }
  }, [open]);

  const onSubmit = (values) => {
    const fileData = new FormData();

    if (values.files) {
      values.files.map((file, index) => {
        fileData.append(index, file);
      });
    }

    startTransition(() => {
      interviewQuestions(values.questions, fileData, deletedFiles, interviewID)
        .then(async (data) => {
          if (data?.success) {
            onOpenChange(false);
            toast({
              variant: "success",
              title: data.success,
            });

            if (data.uploadedFiles && data.uploadedFiles.length > 0) {
              setData((prev) => [...prev, ...data.uploadedFiles]);
            }

            form.setValue("files", null);

            router.refresh();
          }

          if (data?.error) {
            toast({
              variant: "destructive",
              title: data.error,
            });
          }
        })
        .catch((error) => {
          onOpenChange(false);
          toast({
            variant: "destructive",
            title: error.message,
          });
        })
        .finally(() => {
          onOpenChange(false);
          setDeletedFiles([]);
          router.refresh();
        });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <div
          className="fixed inset-0 bg-black/80 z-[999999]"
          aria-hidden="true"
        />
      )}
      <DialogContent className="max-w-[700px] max-h-[80vh] overflow-y-auto z-[9999999]">
        <DialogHeader>
          <DialogTitle>Interview Questions</DialogTitle>
          <div className="border-2 border-primary w-[25%] rounded-sm" />
          <DialogDescription />
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Enter a custom question"
                className="w-3/4"
              />
              <Button
                size="icon"
                onClick={handleAddCustomQuestion}
                type="button"
              >
                <Plus className="size-6" />
              </Button>
            </div>

            <FormField
              control={form.control}
              name="selectedQuestion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select a question</FormLabel>
                  <Select
                    onValueChange={handleQuestionSelect}
                    value={selectedQuestion}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a question" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[9999999]">
                      {DEFAULT_INTERVIEW_QUESTIONS.filter(
                        (question) =>
                          question.id !== 18 &&
                          question.id !== 19 &&
                          question.id !== 20 &&
                          question.id !== 21
                      ).map((question, index) => (
                        <SelectItem key={index} value={question.value}>
                          {question.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`questions.${index}.answer`}
                render={({ field: answerField }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{field.text}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...answerField}
                        placeholder="Enter answer here"
                      />
                    </FormControl>
                    {![
                      "interviewer_confirm",
                      "clarity_of_candidate",
                      "interviewer_name",
                    ].includes(field.value) && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => remove(index)}
                        size="sm"
                      >
                        Remove
                      </Button>
                    )}
                  </FormItem>
                )}
              />
            ))}

            <FormField
              control={form.control}
              name="files"
              render={({ field }) => (
                <FormItem>
                  <FileUploader
                    value={field.value}
                    onValueChange={field.onChange}
                    dropzoneOptions={dropzone}
                  >
                    <FileInput>
                      <Button type="button">Upload File</Button>
                    </FileInput>
                    {field.value && field.value.length > 0 && (
                      <FileUploaderContent>
                        {field.value.map((file, i) => (
                          <FileUploaderItem key={i} index={i}>
                            <Paperclip className="h-4 w-4 stroke-current" />
                            <span className="truncate max-w-125">
                              {file.name}
                            </span>
                          </FileUploaderItem>
                        ))}
                      </FileUploaderContent>
                    )}
                  </FileUploader>
                </FormItem>
              )}
            />

            {data && data.length > 0 && (
              <FilesTable
                data={data}
                columns={interviewFileColumns(handleDeleteFiles)}
              />
            )}

            <DialogFooter>
              <DialogClose>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onOpenChange}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <p>Save Interview</p>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewQuestions;
