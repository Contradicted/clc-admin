import Link from "next/link";

import DefaultLayout from "@/components/default-layout";
import VerifyApplicationButtons from "./_components/verify-application-buttons";

import { getStudentByApplicationID } from "@/data/student";
import { getApplicationByID } from "@/data/application";
import { getDisplayStatus } from "@/lib/utils";

export default async function VerifyApplication({ params }) {
  const student = await getStudentByApplicationID(params.applicationID);
  const application = await getApplicationByID(params.applicationID);

  return (
    <DefaultLayout>
      <div className="max-w-screen-xl mx-auto">
        <div className="flex gap-10 items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-slate-600 text-xs">Student Name</span>
            <span className="text-black text-sm font-medium">
              {student.firstName + " " + student.lastName}
            </span>
          </div>
          <Link
            href={`/applications/${student.applications[0].id}`}
            className="transition-all hover:opacity-80"
          >
            Back to application
          </Link>
        </div>
        <div className="flex flex-col md:flex-row md:flex-grow gap-x-4">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark flex-1">
            <div className="grid grid-cols-6 border-b border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
              <div className="col-span-3 flex items-center">
                <VerifyApplicationButtons
                  applicationID={params.applicationID}
                  applicationStatus={application.status}
                />
              </div>
            </div>
            <div className="px-4 py-4.5 md:px-6 2xl:px-7.5">
              <div className="border-b border-stroke space-y-4 mt-4">
                <div className="w-full space-y-4 pb-4">
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[50%]">
                      <p>Student ID</p>
                    </div>
                    <p className="flex flex-wrap font-medium text-black w-full">
                      {student.id}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[50%]">
                      <p>Application ID</p>
                    </div>
                    <p className="flex flex-wrap font-medium text-black w-full">
                      {student.applications[0].id}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[50%]">
                      <p>Course Name</p>
                    </div>
                    <p className="flex flex-wrap font-medium text-black w-full">
                      {student.applications[0].courseTitle}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[50%]">
                      <p>Application Status</p>
                    </div>
                    <p className="flex flex-wrap font-medium text-black w-full">
                      {getDisplayStatus(student.applications[0].status)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
