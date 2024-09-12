import { formatStudyMode } from "@/lib/utils";

const CourseDetails = ({ courseTitle, studyMode }) => {
  return (
    <div className="border-b border-stroke space-y-4 mt-4">
      <div className="w-full space-y-4 pb-4">
        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[50%]">
            <p>Course Title</p>
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {courseTitle}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[50%]">Study Mode</div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {formatStudyMode(studyMode)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
