import { getApplicationByID } from "@/data/application";

import DefaultLayout from "@/components/default-layout";

import ApplicationHeader from "./_components/application-header";
import ApplicationButtons from "./_components/application-buttons";
import ApplicationTabs from "./_components/application-tabs";
import { redirect } from "next/navigation";
import { Minus, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddNoteButton from "./_components/add-note-button";
import { cn, formatDate, formatDateTime, formatTimeAgo } from "@/lib/utils";
import { getEnrolledStudentByUserID, getStudentByApplicationID } from "@/data/student";
import { getActiveCourses } from "@/data/course";

const ApplicationIDPage = async ({ params }) => {
  const application = await getApplicationByID(params.applicationID);
  const courses = await getActiveCourses();

  if (!application) {
    return redirect("/applications");
  }

  const student = await getStudentByApplicationID(application.id);
  const enrolledStudent = await getEnrolledStudentByUserID(student.id)

  return (
    <DefaultLayout>
      <div className="max-w-screen-xl mx-auto px-4">
        {" "}
        {/* Added padding */}
        <ApplicationHeader
          data={application}
          applicationID={application.id}
          studentID={student.id}
          enrolledStudent={enrolledStudent}
          emailTimestamp={application.emailSentAt}
          status={application.status}
        />
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          <div className="w-full xl:w-[calc(100%-380px)] h-fit rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
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
          {/* Notes section */}
          <div className="w-full xl:w-[350px] h-fit rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between p-4 border-b border-stroke">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-semibold text-black dark:text-white">
                  Notes
                </h4>
                <span className="size-6 flex items-center justify-center text-xs font-medium rounded-full bg-gray/80 text-gray-700">
                  {application.notes.length}
                </span>
              </div>
              <AddNoteButton application={application} />
            </div>

            <div className="divide-y divide-stroke">
              {application.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Note Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-gray/80 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {note.user.firstName[0] + note.user.lastName[0]}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {note.user.firstName + " " + note.user.lastName}
                        </span>
                        <span className="inline-flex w-fit items-center rounded-md bg-meta-1 text-white py-0.5 px-2 text-xs font-medium">
                          {note.user.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-xs text-gray-500">
                      <span>{formatDateTime(note.createdAt).date}</span>
                      <span className="text-gray-400">
                        {formatTimeAgo(note.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Note Content */}
                  <div className="pl-[42px]">
                    <p className="text-sm break-words whitespace-pre-wrap text-gray-600 leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                </div>
              ))}

              {application.notes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="bg-gray-50 rounded-full p-3 mb-3">
                    <SquarePen className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    No notes yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Add a note to keep track of important information
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ApplicationIDPage;
