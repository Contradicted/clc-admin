import ApplicationsTable from "@/components/applications-table";
import { columns } from "@/components/columns";
import DefaultLayout from "@/components/default-layout";
import { db } from "@/lib/db";

export default async function ApplicationsPage() {
  const applications = await db.application.findMany();

  return (
    <DefaultLayout>
      <ApplicationsTable data={applications} columns={columns} />
    </DefaultLayout>
  );
}
