"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";

export const RequiredFieldIndicator = ({ isRequired, isOnDemand }) => {
  if (!isRequired && !isOnDemand) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2">
            {isRequired && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
            {!isRequired && isOnDemand && (
              <Badge variant="secondary" className="text-xs">Optional for On Demand</Badge>
            )}
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isRequired ? (
            <p>This field is required to complete the course setup</p>
          ) : (
            <p>This field is optional for On Demand courses, but required for regular courses</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
