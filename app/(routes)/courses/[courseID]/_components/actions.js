"use client";

import { Button } from "@/components/ui/button";
import DeleteModal from "./delete-modal";
import { Loader2, Trash } from "lucide-react";
import { useTransition } from "react";
import { courses } from "@/actions/courses";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

const Actions = ({ disabled, isActive, courseID }) => {
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const { toast } = useToast();

  const handleChange = () => {
    startTransition(() => {
      courses({ status: isActive ? "Inactive" : "Active" }, courseID)
        .then((data) => {
          if (data.success) {
            toast({
              variant: "success",
              title: data.success,
            });

            router.refresh();
          }

          if (data.error) {
            toast({
              variant: "destructive",
              title: data.error,
            });
          }
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: error,
          });
        })
        .finally(() => {
          router.refresh();
        });
    });
  };

  const handleDelete = () => {
    startTransition(() => {
      courses({ delete: true }, courseID)
        .then((data) => {
          if (data.success) {
            toast({
              variant: "success",
              title: data.success,
            });

            router.push("/courses");
            router.refresh();
          }

          if (data.error) {
            toast({
              variant: "destructive",
              title: data.error,
            });
          }
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: error,
          });
        });
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={disabled || isPending} onClick={handleChange}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          `Set ${isActive ? "Inactive" : "Active"}`
        )}
      </Button>
      <DeleteModal
        onConfirm={handleDelete}
        disabled={isPending}
        isPending={isPending}
      >
        <Button size="sm" variant="destructive">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash className="size-4" />
          )}
        </Button>
      </DeleteModal>
    </div>
  );
};

export default Actions;
