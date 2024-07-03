import DefaultLayout from "@/components/default-layout";
import { getApplicationByID } from "@/data/application";

const ApplicationIDPage = async ({ params }) => {
  const application = await getApplicationByID(params.applicationID);

  return (
    <DefaultLayout>
      <div className="max-w-screen-xl mx-auto">
        <div className="flex gap-10 items-center mb-4">
          <div className="flex flex-col">
            <span className="text-slate-600 text-xs">Application ID</span>
            <span className="text-black text-sm font-medium">
              {application.id}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-600 text-xs">Student ID</span>
            <span className="text-black text-sm font-medium">
              {application.userID}
            </span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-[48px]">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark lg:col-span-2 flex-1">
            <div className="grid grid-cols-6 border-b border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
              <div className="col-span-3 flex items-center">
                {/* TODO: Add Buttons */}
              </div>
            </div>
            <div className="px-4 py-4.5 md:px-6 2xl:px-7.5 space-y-4">
              <h4 className="text-xl font-semibold text-black dark:text-white">
                Course Details
              </h4>

              <div className="flex w-full">
                <div className="bg-red w-full"></div>
                <div className="bg-orange-500 w-full"></div>
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="grid grid-cols-6 border-b border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
              <div className="col-span-3 flex items-center">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  Notes
                </h4>
              </div>
            </div>
            {/* <div className="grid grid-cols-6 border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
            hello
          </div> */}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ApplicationIDPage;
