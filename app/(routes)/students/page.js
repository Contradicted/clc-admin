import ApplicationsTable from "@/components/data-table";
import { studentColumns } from "@/components/columns";
import DefaultLayout from "@/components/default-layout";
import { db } from "@/lib/db";

export default async function StudentsPage() {
  const students = await db.user.findMany({
    where: {
      role: "Student",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  
  return (
    <DefaultLayout>
      <ApplicationsTable
        data={students}
        columns={studentColumns}
        type="students"
      />
    </DefaultLayout>
  );
}
