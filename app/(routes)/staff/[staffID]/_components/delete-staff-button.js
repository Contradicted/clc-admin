"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash } from "lucide-react";
import { useTransition } from "react";
import { staff } from "@/actions/staff";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

const DeleteStaffButton = () => {
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();
  const router = useRouter();

  // const handleDelete = () => {
  //   startTransition(() => {
  //     staff({ delete: true }, staffID)
  //       .then((data) => {
  //         if (data.success) {
  //           toast({
  //             variant: "success",
  //             title: data.success,
  //           });

  //           router.push("/staff");
  //           router.refresh();
  //         }

  //         if (data.error) {
  //           toast({
  //             variant: "destructive",
  //             title: data.error,
  //           });
  //         }
  //       })
  //       .catch((error) => {
  //         toast({
  //           variant: "destructive",
  //           title: error,
  //         });
  //       });
  //   });
  // };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="flex gap-x-2 bg-red hover:bg-meta-7">
          <Trash className="size-4" />
          Delete Staff
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            course and all of its content.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => {}}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteStaffButton;
