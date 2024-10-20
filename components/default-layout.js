"use client";

import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DefaultLayout({ children, className }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-hidden">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Header isOpen={isOpen} setIsOpen={setIsOpen} />

        <main>
          <div
            className={cn(
              "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10",
              className
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
