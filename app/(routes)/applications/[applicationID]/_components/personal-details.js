import { formatDate } from "@/lib/utils";

const PersonalDetails = ({ application }) => {
  const data = [
    {
      id: "1",
      title: "Title",
      value: application.title || "-",
    },
    {
      id: "2",
      title: "First Name",
      value: application.firstName || "-",
    },
    {
      id: "3",
      title: "Last Name",
      value: application.lastName || "-",
    },
    {
      id: "4",
      title: "Gender",
      value: application.gender || "-",
    },
    {
      id: "5",
      title: "Date of Birth",
      value: formatDate(application.dateOfBirth) || "-",
    },
    {
      id: "6",
      title: "Place of Birth",
      value: application.placeOfBirth || "-",
    },
    {
      id: "7",
      title: "Country of Birth",
      value: application.countryOfBirth || "-",
    },
    {
      id: "8",
      title: "Passport / National ID Card No.",
      value: application.identificationNo || "-",
    },
    {
      id: "8",
      title: "Nationality",
      value: application.nationality || "-",
    },
    {
      id: "9",
      title: "Address Line 1",
      value: application.addressLine1 || "-",
    },
    {
      id: "10",
      title: "Address Line 2",
      value: application.addressLine2 || "-",
    },
    {
      id: "11",
      title: "City",
      value: application.city || "-",
    },
    {
      id: "12",
      title: "Zip / Postal Code",
      value: application.postcode || "-",
    },
    {
      id: "13",
      title: "Email",
      value: application.email || "-",
    },
    {
      id: "14",
      title: "Mobile No.",
      value: application.mobileNo || "-",
    },
    {
      id: "15",
      title: "Tuition Fee",
      value: application.tuitionFees || "-",
    },
    {
      id: "16",
      title: "Is English Your First Language",
      value: application.isEnglishFirstLanguage ? "Yes" : "No" || "-",
    },
  ];

  return (
    <div className="border-b border-stroke space-y-4 mt-4">
      <div className="w-full space-y-4 pb-4">
        {data.map((pd) => (
          <div className="flex gap-3" key={pd.id}>
            <div className="flex items-start w-full max-w-[50%]">
              <p>{pd.title}</p>
            </div>
            <p className="flex flex-wrap font-medium text-black w-full">
              {pd.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalDetails;
