import JSZip from "jszip";
import { saveAs } from "file-saver";

const zip = new JSZip();

const download = async (file) => {
  return await fetch(file.url)
    .then((response) => response.blob())
    .then((blob) => {
      zip.file(file.name, blob);
    });
};

export const getApplicationFiles = (data) => {
  if (!data) return [];

  try {
    const personalFiles = [
      ...(data.photoUrl
        ? [
            {
              name: `Profile Picture.${data.photoUrl.split(".").pop()}`,
              url: data.photoUrl,
            },
          ]
        : []),
      ...(data.identificationNoUrl
        ? [
            {
              name: `Identification.${data.identificationNoUrl.split(".").pop()}`,
              url: data.identificationNoUrl,
            },
          ]
        : []),
      ...(data.immigration_url
        ? [
            {
              name: `Immigration Document.${data.immigration_url.split(".").pop()}`,
              url: data.immigration_url,
            },
          ]
        : []),
    ];

    const qualificationFiles =
      data.qualifications
        ?.filter((qual) => qual.fileName && qual.url)
        .map((qual) => ({ name: qual.fileName, url: qual.url })) || [];

    const workExperienceFiles =
      data.workExperience
        ?.filter((we) => we.fileName && we.url)
        .map((we) => ({ name: we.fileName, url: we.url })) || [];

    const files = [
      ...personalFiles,
      ...qualificationFiles,
      ...workExperienceFiles,
      ...(data.signatureUrl
        ? [{ name: "Signature.png", url: data.signatureUrl }]
        : []),
    ];

    // Final filter to ensure no null URLs
    return files.filter((file) => file.url);
  } catch (error) {
    console.log("[GETTING_APPLICATION_FILES_ERROR]", error);
    return [];
  }
};

export const downloadFiles = async (data) => {
  if (!data) return;

  try {
    const zip = new JSZip();
    const applications = Array.isArray(data) ? data : [data];

    for (const application of applications) {
      const files = getApplicationFiles(application);
      const folder = Array.isArray(data)
        ? zip.folder(
            `${application.firstName.trim()} ${application.lastName.trim()}-${application.id.toString()}`
          )
        : zip;

      await Promise.all(
        files.map(async (file) => {
          // Use our proxy endpoint instead
          const response = await fetch(
            `/api/download?url=${encodeURIComponent(file.url)}`
          );
          const blob = await response.blob();
          folder.file(file.name, blob);
        })
      );
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const filename = Array.isArray(data)
      ? `applications_${new Date().toISOString().split("T")[0]}.zip`
      : `${data.userID}-${data.id}.zip`;

    saveAs(blob, filename);
  } catch (error) {
    console.log("[DOWNLOADING_FILES_ERROR]", error);
  }
};
