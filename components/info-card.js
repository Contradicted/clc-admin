import { cn } from "@/lib/utils";

export const InfoCard = ({ icon: Icon, title, number }) => {
  return (
    <div
      className={cn(
        "bg-white border border-stroke p-4 flex shadow-sm rounded-tl-3xl rounded-br-3xl",
        title === "Submitted" && "bg-[#b6e5ff] border-[#0083d4]",
        title === "Approved" && "bg-[#90ffa2] border-[#00b835]",
        title === "Rejected" && "bg-[#ffc0c0] border-[#ff0000]",
        title === "Waiting for Change" && "bg-[#ffe785] border-[#e27500]"
      )}
    >
      <div className="flex items-center space-x-8">
        <div
          className={cn(
            "rounded-full size-15 flex items-center justify-center bg-meta-2",
            title === "Submitted" && "bg-[#00aaff]",
            title === "Approved" && "bg-[#00e63c]",
            title === "Rejected" && "bg-[#ff2323]",
            title === "Waiting for Change" && "bg-[#ff9d00]"
          )}
        >
          <Icon className={cn("size-6 text-primary", title && "text-white")} />
        </div>
        <div>
          <span className="font-medium text-2xl">{number}</span>
          <p className="text-sm">{title}</p>
        </div>
      </div>
    </div>
  );
};
