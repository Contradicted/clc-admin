const AdditionalDetails = ({ application }) => {
  return (
    <div className="border-stroke space-y-4 mt-4">
      <h4 className="text-xl font-semibold text-black dark:text-white">
        Additional Information
      </h4>
      <div className="w-full space-y-4 pb-4">
        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[25%]">
            <p>Special needs requiring support or facilities</p>
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.specialNeeds}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[25%]">
            Reasons for choosing programme of study
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.reasonsForChoosingProgram}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[25%]">
            What are your future education plans?
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.futureEduPlans}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[25%]">
            What employment do you intend to seek on completion of your studies?
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.intentedEmployment}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[25%]">
            Brief statement about your interests and hobbies
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.hobbies}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[25%]">
            How did you hear about the college?
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.marketing}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdditionalDetails;
