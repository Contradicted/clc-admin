import { getApplicationByID } from "@/data/application";

import DefaultLayout from "@/components/default-layout";

import ApplicationHeader from "./_components/application-header";
import ApplicationButtons from "./_components/application-buttons";
import ApplicationTabs from "./_components/application-tabs";
import { redirect } from "next/navigation";
import { Minus, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddNoteButton from "./_components/add-note-button";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { getStudentByApplicationID } from "@/data/student";

const ApplicationIDPage = async ({ params }) => {
  const application = await getApplicationByID(params.applicationID);
  const student = await getStudentByApplicationID(application.id);

  if (!application) {
    return redirect("/applications");
  }

  return (
    <DefaultLayout>
      <div className="max-w-screen-xl mx-auto">
        <ApplicationHeader
          applicationID={application.id}
          studentID={student.id}
          emailTimestamp={application.emailSentAt}
          status={application.status}
        />
        <div className="flex flex-col gap-x-4 space-y-5 lg:flex-row lg:flex-grow lg:space-y-0">
          <div className="h-fit max-h-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark flex-1">
            <div className="grid grid-cols-6 border-b border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
              <div className="col-span-3 flex items-center">
                <ApplicationButtons
                  student={student}
                  application={application}
                />
              </div>
            </div>
            <div className="px-4 py-4.5 md:px-6 2xl:px-7.5">
              <ApplicationTabs data={application} className="px-0" />
            </div>
          </div>

          <div className="w-full h-fit rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark flex-grow-0 flex-shrink-0 lg:w-1/4">
            <div className="flex items-center py-4 px-5 justify-between">
              <h4 className="text-xl font-semibold text-black dark:text-white">
                Notes
              </h4>
              <AddNoteButton application={application} />
            </div>
            {application.notes.map((note, index) => (
              <div
                className={cn("w-full flex gap-x-4 px-5 mb-5")}
                key={note.id}
              >
                <div className="flex flex-col items-center text-sm">
                  <span className="font-medium">
                    {formatDateTime(note.createdAt).date}
                  </span>
                  <span className="italic text-xs">
                    {formatDateTime(note.createdAt).time}
                  </span>
                  <Button
                    size="sm"
                    className="mt-2 rounded-full bg-meta-1 px-3 py-1 text-xs hover:bg-meta-1 hover:cursor-default"
                  >
                    {note.type}
                  </Button>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <p className="text-sm break-words whitespace-pre-wrap mb-2">
                    {note.content}
                  </p>
                  <div className="flex items-center font-medium text-sm">
                    <Minus className="size-4 stroke-1 mr-2" />
                    {note.user.firstName + " " + note.user.lastName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ApplicationIDPage;
