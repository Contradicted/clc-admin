import { formatDate } from "@/lib/utils";

const QualificationDetails = ({ application }) => {
  return (
    <div className="border-b border-stroke space-y-4 mt-4">
      <h4 className="text-xl font-semibold text-black dark:text-white">
        Qualification Details
      </h4>

      {application.qualifications.length > 0 &&
        application.qualifications.map((qualification, index) => (
          <div className="w-full space-y-4 pb-4 bg-zinc-50 pt-3" key={index}>
            <div className="flex gap-3" key={index}>
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p>Qualification Title</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {qualification.title}
              </p>
            </div>
            <div className="flex gap-3" key={index}>
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p>Examining Body</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {qualification.examiningBody}
              </p>
            </div>
            <div className="flex gap-3" key={index}>
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p>Date Awarded</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {formatDate(qualification.dateAwarded)}
              </p>
            </div>
          </div>
        ))}

      <div className="flex gap-3 pb-4">
        <div className="flex items-start w-full max-w-[25%]">
          <p>Do you have any pending qualifications?</p>
        </div>
        <p className="flex flex-wrap font-medium text-black w-full">
          {application.hasPendingResults ? "Yes" : "No"}
        </p>
      </div>

      {application.hasPendingResults &&
        application.pendingQualifications.length > 0 &&
        application.pendingQualifications.map((pq, index) => (
          <div className="w-full space-y-4 pb-4 bg-zinc-50 pt-3" key={index}>
            <div className="flex gap-3" key={index}>
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p>Qualification Title</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {pq.title}
              </p>
            </div>
            <div className="flex gap-3" key={index}>
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p>Examining/Awarding Body</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {pq.examiningBody}
              </p>
            </div>
            <div className="flex gap-3" key={index}>
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p>Subjects Passed</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {formatDate(pq.subjectsPassed)}
              </p>
            </div>
            <div className="flex gap-3" key={index}>
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p>Date of Results</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {formatDate(pq.dateOfResults)}
              </p>
            </div>
          </div>
        ))}
    </div>
  );
};

export default QualificationDetails;
