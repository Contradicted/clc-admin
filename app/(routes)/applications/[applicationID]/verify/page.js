import DefaultLayout from "@/components/default-layout";

export default function VerifyApplication({ params }) {
  return (
    <DefaultLayout>Verify Application {params.applicationID}</DefaultLayout>
  );
}
