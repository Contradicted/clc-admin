import { db } from "@/lib/db";

import DefaultLayout from "@/components/default-layout";
import { courseColumns } from "@/components/columns";
import AddCourseModal from "./_components/add-course-modal";
import ApplicationsTable from "@/components/data-table";

export default async function CoursesPage() {
  const courses = await db.course.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <DefaultLayout>
      <div className="w-full flex flex-col gap-4">
        <div className="w-full text-right">
          <AddCourseModal />
        </div>
        {courses && courses.length > 0 ? (
          <ApplicationsTable
            data={courses}
            columns={courseColumns}
            excludeFeatures={["datePicker", "toolbar"]}
          />
        ) : (
          "0 Courses found."
        )}
      </div>
    </DefaultLayout>
  );
}
