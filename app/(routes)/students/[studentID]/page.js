import Image from "next/image";

import userPhoto from "@/public/placeholder-user.png";

import DefaultLayout from "@/components/default-layout";
import StudentTabs from "./_components/student-tabs";

import { getStudentByID } from "@/data/student";
import StudentActions from "./_components/student-actions";
import { getCourses } from "@/data/course";

export default async function StudentPage({ params }) {
  const student = await getStudentByID(params.studentID);
  const courses = await getCourses();
  const hasApplication = student.applications?.length > 0;

  return (
    <DefaultLayout>
      <div className="max-w-screen-xl mx-auto">
        <div className="w-full rounded-sm border py-2 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {/* Student Photo */}
          <div className="flex items-center flex-col justify-center space-y-3 py-3">
            <div className="flex items-center justify-center size-45 rounded-sm">
              <Image
                src={
                  (hasApplication && student.applications[0].photoUrl) ||
                  userPhoto
                }
                alt="user-photo"
                width={180}
                height={180}
                className="bg-contain"
              />
            </div>
            <p className="font-medium text-black text-lg">
              {student.firstName} {student.lastName}
            </p>
          </div>
          <div className="flex justify-end px-4">
            <StudentActions studentID={student.id} />
          </div>
          <StudentTabs data={student} courses={courses} />
        </div>
      </div>
    </DefaultLayout>
  );
}
