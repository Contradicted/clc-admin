import Link from "next/link";

const VerifyApplicationButtons = () => {
  return (
    <div className="flex gap-x-3">
      <Link
        href="#"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-6 whitespace-nowrap w-full sm:w-auto"
      >
        Application Status
      </Link>
      <Link
        href="#"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-6 whitespace-nowrap w-full sm:w-auto"
      >
        Approve for Interview
      </Link>
      <Link
        href="#"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-6 whitespace-nowrap w-full sm:w-auto"
      >
        Recommendation
      </Link>
      <Link
        href="#"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-6 whitespace-nowrap w-full sm:w-auto"
      >
        Reject Application
      </Link>
      <Link
        href="#"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-6 whitespace-nowrap w-full sm:w-auto"
      >
        Pending Application
      </Link>
    </div>
  );
};

export default VerifyApplicationButtons;
