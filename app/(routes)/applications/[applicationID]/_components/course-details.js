const CourseDetails = ({ courseTitle, studyMode }) => {
  return (
    <div className="border-b border-stroke space-y-4">
      <h4 className="text-xl font-semibold text-black dark:text-white">
        Course Details
      </h4>
      <div className="w-full space-y-4 pb-4">
        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[25%]">
            <p>Course Title</p>
          </div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {courseTitle}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-start w-full max-w-[25%]">Study Mode</div>
          <p className="flex flex-wrap font-medium text-black w-full">
            {studyMode}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
