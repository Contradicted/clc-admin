import { columns } from "@/components/columns";
import ApplicationsTable from "@/components/data-table";
import DefaultLayout from "@/components/default-layout";
import { getCourses } from "@/data/course";
import { db } from "@/lib/db";

export default async function SheffieldAppPage() {
  const applications = await db.application.findMany({
    where: {
      campus: "Sheffield",
    }, 
    orderBy: {
      createdAt: "desc",
    },
  });
  const courses = await getCourses();
  return (
    <DefaultLayout>
      <ApplicationsTable
        data={applications}
        columns={columns}
        courses={courses}
      />
    </DefaultLayout>
  );
}
