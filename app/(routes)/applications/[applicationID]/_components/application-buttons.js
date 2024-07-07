import Link from "next/link";

const ApplicationButtons = ({ studentID }) => {
  return (
    <div>
      <Link
        href={`/student/${studentID}`}
        className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-6"
      >
        View Student
      </Link>
    </div>
  );
};

export default ApplicationButtons;
