import { redirect } from "next/navigation";

import DefaultLayout from "@/components/default-layout";

import { getStaffByID } from "@/data/staff";

import userPhoto from "@/public/placeholder-user.png";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { RoleGate } from "@/components/role-gate";
import PersonalDetailsForm from "./_components/personal-details-form";
import EmploymentForm from "./_components/employment-form";
import PrimaryAddressForm from "./_components/primary-address-form";
import { EditingProvider } from "@/providers/editing-provider";
import VisaDetailsForm from "./_components/visa-details-form";
import UserPhoto from "./_components/user-photo";
import DeleteStaffButton from "./_components/delete-staff-button";

export default async function StaffIDPage({ params }) {
  const staff = await getStaffByID(params.staffID);

  if (!staff) {
    return redirect("/");
  }

  return (
    <DefaultLayout>
      <div className="max-w-screen-xl mx-auto">
        {/* Staff Details & Action */}
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-x-3">
            <div className="flex items-center justify-center size-40 rounded-full">
              <UserPhoto
                initialPhotoUrl={staff.photoUrl}
                staffID={staff.id}
                userPhoto={userPhoto}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                {staff.firstName} {staff.lastName}
              </h3>
              <span>{staff.role}</span>
            </div>
          </div>
          {/* <RoleGate allowedRoles={["Admin"]}>
            <DeleteStaffButton />
          </RoleGate> */}
        </div>

        <div className="mt-4 bg-white p-8">
          <div className="grid grid-cols-1 gap-5">
            <EditingProvider>
              <PersonalDetailsForm initialData={staff} staffID={staff.id} />
              <EmploymentForm
                initialData={staff.employment}
                staffID={staff.id}
              />
              <PrimaryAddressForm initialData={staff} staffID={staff.id} />
              <VisaDetailsForm initialData={staff} staffID={staff.id} />
            </EditingProvider>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
