"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { staff } from "@/actions/staff";
import { useRouter } from "next/navigation";

const UserPhoto = ({ initialPhotoUrl, staffID, userPhoto }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [newPhoto, setNewPhoto] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, startTransition] = useTransition();

  const fileInputRef = useRef(null);

  const { toast } = useToast();
  const router = useRouter();

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File size too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setNewPhoto(file);
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();

      if (isDeleting) {
        formData.append("deletePhoto", "true");
      } else if (newPhoto) {
        formData.append("photo", newPhoto);
      } else {
        return;
      }

      startTransition(() => {
        staff(formData, staffID)
          .then((data) => {
            if (data?.success) {
              toast({
                title: "Profile photo updated successfully",
                variant: "success",
              });

              setNewPhoto(null);
              setIsDeleting(false);

              router.refresh();
            }

            if (data?.error) {
              toast({
                title: "Failed to update profile photo",
                variant: "destructive",
              });
            }
          })
          .catch((error) => {
            toast({
              variant: "destructive",
              title: error.message,
            });
          });
      });
    } catch (error) {
      toast({
        title: "Failed to update profile photo",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setNewPhoto(null);
    setIsDeleting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setNewPhoto(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    handleSave();
  };

  return (
    <div
      className="relative flex items-center justify-center size-40 rounded-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Image
        src={
          (newPhoto && URL.createObjectURL(newPhoto)) ||
          initialPhotoUrl ||
          userPhoto
        }
        alt="user-photo"
        width={180}
        height={180}
        className="h-full w-full bg-contain rounded-full"
      />
      {(isHovering || newPhoto || isDeleting) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
          {newPhoto || isDeleting ? (
            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                disabled={isUploading}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                <Check className="size-4 text-white" />
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isUploading}
                size="sm"
                className="bg-meta-7 hover:bg-red"
              >
                <X className="size-4 text-white" />
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2 items-center">
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Upload className="size-4 text-white" />
              </label>
              {initialPhotoUrl && (
                <Button
                  onClick={handleDelete}
                  size="sm"
                  className="bg-meta-7 hover:bg-red"
                >
                  <Trash2 className="size-4 text-white" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <input
        id="photo-upload"
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default UserPhoto;
