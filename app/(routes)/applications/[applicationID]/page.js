import { getApplicationByID } from "@/data/application";

import DefaultLayout from "@/components/default-layout";

import ApplicationHeader from "./_components/application-header";
import CourseDetails from "./_components/course-details";
import PersonalDetails from "./_components/personal-details";
import QualificationDetails from "./_components/qualification-details";
import WorkExperienceDetails from "./_components/work-experience-details";
import AdditionalDetails from "./_components/additional-details";
import ApplicationButtons from "./_components/application-buttons";
import ApplicationTabs from "./_components/application-tabs";

const ApplicationIDPage = async ({ params }) => {
  const application = await getApplicationByID(params.applicationID);

  return (
    <DefaultLayout>
      <div className="max-w-screen-xl mx-auto">
        <ApplicationHeader
          applicationID={application.id}
          studentID={application.userID}
        />
        <div className="flex flex-col md:flex-row gap-[48px]">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark lg:col-span-2 flex-1">
            <div className="grid grid-cols-6 border-b border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
              <div className="col-span-3 flex items-center">
                <ApplicationButtons studentID={application.userID} />
              </div>
            </div>
            <div className="px-4 py-4.5 md:px-6 2xl:px-7.5">
              <ApplicationTabs data={application} className="px-0" />
            </div>
          </div>

          <div class="w-full h-fit md:max-w-[25%] rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark flex-grow-0 flex-shrink-0">
            <div class="p-4">
              <h4 class="text-xl font-semibold text-black dark:text-white">
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
