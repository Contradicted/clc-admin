import Link from "next/link";
import StatusButton from "./status-button";
import InterviewModal from "./interview-modal";
import DocumentUploadModal from "./document-upload-modal";

const ApplicationButtons = ({ student, application }) => {
  return (
    <div className="flex gap-x-3">
      <Link
        href={`/students/${student.id}`}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-6 whitespace-nowrap w-full sm:w-auto"
      >
        View Student
      </Link>
      <Link
        href={`/applications/${application.id}/verify`}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-6 whitespace-nowrap w-full sm:w-auto"
      >
        Verify Application
      </Link>

      <InterviewModal studentData={student} applicationData={application} />
      <DocumentUploadModal applicationId={application.id} />
      {/* <StatusButton application={application} /> */}
    </div>
  );
};

export default ApplicationButtons;
