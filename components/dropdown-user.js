"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useClickAway } from "react-use";

import { LogoutButton } from "@/components/logout-button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Loader2 } from "lucide-react";

const DropdownUser = () => {
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { user, status } = useCurrentUser();
  const ref = useRef(null);

  useEffect(() => {
    if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

  useClickAway(ref, () => {
    setDropdownOpen(false);
  });

  return (
    <div className="relative" ref={ref}>
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Link
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-4"
          href="#"
        >
          <span className="hidden text-right lg:block">
            <span className="block text-sm font-medium text-black dark:text-white">
              {user?.firstName + " " + user?.lastName}
            </span>
            <span className="block text-xs">{user?.role}</span>
          </span>

          <span className="h-12 w-12">
            <Image
              width={112}
              height={112}
              src={"/placeholder-user.png"}
              style={{
                width: "auto",
                height: "auto",
              }}
              className="rounded-full"
              alt="User"
            />
          </span>

          <svg
            className="hidden fill-current sm:block"
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z"
              fill=""
            />
          </svg>
        </Link>
      )}
      {dropdownOpen && (
        <div
          className={`absolute right-0 mt-4 flex w-62.5 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark`}
        >
          <LogoutButton />
        </div>
      )}
    </div>
  );
};

export default DropdownUser;
