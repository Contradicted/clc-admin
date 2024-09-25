import { fileColumns } from "@/components/columns";
import FilesTable from "@/components/files-table";
import { formatDate, formatImmigrationStatus } from "@/lib/utils";

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
      id: "9",
      title: "Nationality",
      value: application.nationality || "-",
    },
    {
      id: "10",
      title: "Address Line 1",
      value: application.addressLine1 || "-",
    },
    {
      id: "11",
      title: "Address Line 2",
      value: application.addressLine2 || "-",
    },
    {
      id: "12",
      title: "City",
      value: application.city || "-",
    },
    {
      id: "13",
      title: "Zip / Postal Code",
      value: application.postcode || "-",
    },
    {
      id: "14",
      title: "Email",
      value: application.email || "-",
    },
    {
      id: "15",
      title: "Mobile No.",
      value: application.mobileNo || "-",
    },
    {
      id: "16",
      title: "Tuition Fee",
      value: application.tuitionFees || "-",
    },
    {
      id: "17",
      title: "Is English Your First Language",
      value: application.isEnglishFirstLanguage ? "Yes" : "No" || "-",
    },
  ];

  if (application.entryDateToUk) {
    data.splice(data.indexOf("Entry Date to UK") + 1, 0, {
      id: "entry_date",
      title: "Entry Date to UK",
      value: formatDate(application.entryDateToUk) || "-",
    });
  }

  if (application.immigration_status) {
    // Always insert after "Nationality" or "Entry Date to UK" if it exists
    const insertIndex =
      data.findIndex(
        (item) =>
          item.title === "Entry Date to UK" || item.title === "Nationality"
      ) + 1;

    data.splice(insertIndex, 0, {
      id: "immigration-status",
      title: "Immigration Status",
      value: formatImmigrationStatus(application.immigration_status) || "-",
    });

    if (application.share_code) {
      data.splice(insertIndex + 1, 0, {
        id: "share_code",
        title: "Share Code",
        value: application.share_code || "-",
      });
    }
  }

  const fileData = [];

  if (application.photoUrl) {
    fileData.push({
      name: "Profile Picture",
      url: application.photoUrl,
    });
  }

  if (application.identificationNoUrl) {
    fileData.push({
      name: "Identification",
      url: application.identificationNoUrl,
    });
  }

  if (application.immigration_url) {
    fileData.push({
      name: "Immigration Document",
      url: application.immigration_url,
    });
  }

  if (application.signatureUrl) {
    fileData.push({
      name: "Signature",
      url: application.signatureUrl,
    });
  }

  return (
    <>
      <div className="border-b border-stroke space-y-4 my-5">
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
      {fileData.length > 0 && (
        <FilesTable data={fileData} columns={fileColumns} />
      )}
    </>
  );
};

export default PersonalDetails;
