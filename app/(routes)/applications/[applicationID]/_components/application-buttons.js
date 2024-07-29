import Link from "next/link";
import StatusButton from "./status-button";

const ApplicationButtons = ({ studentID, application }) => {
  return (
    <div className="flex gap-x-3">
      <Link
        href={`/student/${studentID}`}
        className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-6"
      >
        View Student
      </Link>
      <StatusButton application={application} />
    </div>
  );
};

export default ApplicationButtons;
