import { auth } from "@/auth";
import AccountSettingsForm from "@/components/account-settings-form";
import DefaultLayout from "@/components/default-layout";
import { getUserById } from "@/data/student";

export default async function SettingsPage() {
  const { user } = await auth();
  const userDetails = await getUserById(user.id);

  return (
    <DefaultLayout>
      <AccountSettingsForm user={userDetails} />
    </DefaultLayout>
  );
}
