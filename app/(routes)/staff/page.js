import { auth } from "@/auth";
import { staffColumns } from "@/components/columns";
import ApplicationsTable from "@/components/data-table";
import DefaultLayout from "@/components/default-layout";
import { RoleGate } from "@/components/role-gate";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function StaffPage() {
  const session = await auth();
  const user = session?.user;

  // if (user?.role === "Staff") {
  //   return redirect(`/staff/${user.id}`);
  // }

  const staff = await db.user.findMany({
    where: {
      role: "Staff",
    },
  });

  return (
    <DefaultLayout>
      <RoleGate allowedRoles={["Admin"]} redirectTo={`/staff/${user.id}`}>
        <ApplicationsTable data={staff} columns={staffColumns} type="staff" />
      </RoleGate>
    </DefaultLayout>
  );
}
