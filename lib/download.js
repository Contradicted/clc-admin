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

export const downloadFiles = async (data) => {
  if (!data) return;

  let files = [];

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
    data.qualifications.length > 0 &&
    data.qualifications
      .filter((qual) => qual.fileName && qual.url)
      .map((qual) => ({ name: qual.fileName, url: qual.url }));

  files = [
    ...(personalFiles.length > 0 && [...personalFiles]),
    ...(qualificationFiles.length > 0 && [...qualificationFiles]),
  ];

  const workExperienceFiles =
    data.workExperience.length > 0
      ? data.workExperience
          .filter((we) => we.fileName && we.url)
          .map((we) => ({ name: we.fileName, url: we.url }))
      : [];

  if (workExperienceFiles.length > 0) {
    files = [...files, ...workExperienceFiles];
  }

  data.signatureUrl &&
    files.push({
      name: "Signature.png",
      url: data.signatureUrl,
    });

  const arrOfFiles = files.map((file) => download(file));

  await Promise.all(arrOfFiles).then(() => {
    zip
      .generateAsync({ type: "blob" })
      .then((blob) => {
        saveAs(blob, `${data.userID}-${data.id}.zip`);
      })
      .catch((error) => {
        console.error("Download failed:", error);
      });
  });
};
