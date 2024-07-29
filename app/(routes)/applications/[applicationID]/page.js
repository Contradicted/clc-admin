import { getApplicationByID } from "@/data/application";

import DefaultLayout from "@/components/default-layout";

import ApplicationHeader from "./_components/application-header";
import ApplicationButtons from "./_components/application-buttons";
import ApplicationTabs from "./_components/application-tabs";
import { redirect } from "next/navigation";

const ApplicationIDPage = async ({ params }) => {
  const application = await getApplicationByID(params.applicationID);

  if (!application) {
    return redirect("/applications");
  }

  return (
    <DefaultLayout>
      <div className="max-w-screen-xl mx-auto">
        <ApplicationHeader
          applicationID={application.id}
          studentID={application.userID}
          emailTimestamp={application.emailSentAt}
          status={application.status}
        />
        <div className="flex flex-col md:flex-row md:flex-grow gap-x-4">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark flex-1">
            <div className="grid grid-cols-6 border-b border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
              <div className="col-span-3 flex items-center">
                <ApplicationButtons
                  studentID={application.userID}
                  application={application}
                />
              </div>
            </div>
            <div className="px-4 py-4.5 md:px-6 2xl:px-7.5">
              <ApplicationTabs data={application} className="px-0" />
            </div>
          </div>

          <div className="w-1/4 h-fit rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark flex-grow-0 flex-shrink-0">
            <div className="p-4">
              <h4 className="text-xl font-semibold text-black dark:text-white 2xl:text-orange-500">
                Notes
              </h4>
              <p>Here are some notes...</p>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ApplicationIDPage;
