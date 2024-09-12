import { db } from "@/lib/db";

import DefaultLayout from "@/components/default-layout";
import DataTable from "@/components/data-table";
import { courseColumns } from "@/components/columns";
import AddCourseModal from "./_components/add-course-modal";

export default async function CoursesPage() {
  const courses = await db.course.findMany();

  return (
    <DefaultLayout>
      <div className="w-full flex flex-col gap-4">
        <div className="w-full text-right">
          <AddCourseModal />
        </div>
        {courses && courses.length > 0 ? (
          <DataTable data={courses} columns={courseColumns} />
        ) : (
          "0 Courses found."
        )}
      </div>
    </DefaultLayout>
  );
}
