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
import { getActiveCourses } from "@/data/course";

const ApplicationIDPage = async ({ params }) => {
  const application = await getApplicationByID(params.applicationID);
  const courses = await getActiveCourses();

  if (!application) {
    return redirect("/applications");
  }

  const student = await getStudentByApplicationID(application.id);

  return (
    <DefaultLayout>
      <div className="max-w-screen-xl mx-auto">
        <ApplicationHeader
          data={application}
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
              <ApplicationTabs
                data={application}
                courses={courses}
                className="px-0"
              />
            </div>
          </div>

          <div className="h-fit rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark lg:w-[350px] flex-shrink-0">
            <div className="flex items-center justify-between p-4 border-b border-stroke">
              <h4 className="text-lg font-semibold text-black dark:text-white">
                Notes
              </h4>
              <AddNoteButton application={application} />
            </div>

            <div className="divide-y divide-stroke">
              {application.notes.map((note) => (
                <div key={note.id} className="p-4 flex gap-3">
                  {/* Date and type column */}
                  <div className="flex flex-col items-center text-xs space-y-1">
                    <span className="font-medium whitespace-nowrap">
                      {formatDateTime(note.createdAt).date}
                    </span>
                    <span className="italic whitespace-nowrap">
                      {formatDateTime(note.createdAt).time}
                    </span>
                    <Button
                      size="sm"
                      className="mt-1 rounded-full bg-meta-1 px-2 py-0.5 text-xs hover:bg-meta-1 hover:cursor-default"
                    >
                      {note.type}
                    </Button>
                  </div>

                  {/* Note content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm break-words whitespace-pre-wrap mb-2">
                      {note.content}
                    </p>
                    <div className="flex items-center text-xs font-medium">
                      <Minus className="size-3 stroke-1 mr-1" />
                      <span className="truncate">
                        {note.user.firstName + " " + note.user.lastName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ApplicationIDPage;
