import { fileColumns } from "@/components/columns";
import { formatDate } from "@/lib/utils";

const WorkExperienceDetails = ({ application }) => {
  let fileData = [];

  if (application.workExperience.length > 0) {
    application.workExperience.map((we) => {
      if (we.fileName && we.url) {
        fileData.push({
          id: we.id,
          name: we.fileName,
          url: we.url,
        });
      }
    });
  }

  return (
    <div className="border-b border-stroke space-y-4 mt-4">
      <h4 className="text-xl font-semibold text-black dark:text-white">
        Work Experience
      </h4>

      <div className="flex gap-3 pb-4">
        <div className="flex items-start w-full max-w-[50%]">
          <p>Do you have any work experience?</p>
        </div>
        <p className="flex flex-wrap font-medium text-black w-full">
          {application.hasWorkExperience ? "Yes" : "No"}
        </p>
      </div>

      {application.hasWorkExperience &&
        application.workExperience.length > 0 &&
        application.workExperience.map((we, index) => (
          <div className="w-full space-y-4 pb-4 bg-zinc-50 pt-3" key={index}>
            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%] pl-3">
                <p>Job Title</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {we.title}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%] pl-3">
                <p>Name of Organisation</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {we.nameOfOrganisation}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%] pl-3">
                <p>Nature of Job</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {we.natureOfJob}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%] pl-3">
                <p>Job Start Date</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {formatDate(we.jobStartDate)}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%] pl-3">
                <p>Job End Date</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {formatDate(we.jobEndDate)}
              </p>
            </div>
          </div>
        ))}

      {fileData.length > 0 && (
        <FilesTable columns={fileColumns} data={fileData} className="mt-4" />
      )}
    </div>
  );
};

export default WorkExperienceDetails;
