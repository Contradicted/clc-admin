import { getDisplayEthnicity, getDisplayReligion } from "@/lib/utils";

const AdditionalDetails = ({ application }) => {
  return (
    <div className="border-stroke space-y-4 mt-4">
      <h4 className="text-xl font-semibold text-black dark:text-white">
        Additional Information
      </h4>
      <div className="w-full space-y-4 pb-4">
        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[50%]">
            <p>Special needs requiring support or facilities</p>
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.specialNeeds}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[50%]">
            Reasons for choosing programme of study
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.reasonsForChoosingProgram}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[50%]">
            What are your future education plans?
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.futureEduPlans}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[50%]">
            What employment do you intend to seek on completion of your studies?
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.intentedEmployment}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[50%]">
            Brief statement about your interests and hobbies
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.hobbies}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[50%]">
            Ethnic Origin
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {getDisplayEthnicity(application.ethnicity)}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[50%]">Religion</div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {getDisplayReligion(application.religion)}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[50%]">
            How did you hear about the college?
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.marketing}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[50%]">
            Agreed to Terms and Conditions
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {application.terms ? "Yes" : "No"}
          </p>
        </div>

        {application.recruitment_agent && (
          <div className="flex gap-3">
            <div className="flex items-start w-full max-w-[50%]">
              Name of Recruitment Agent
            </div>
            <p className="flex flex-wrap font-medium text-black w-full">
              {application.recruitment_agent}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdditionalDetails;
