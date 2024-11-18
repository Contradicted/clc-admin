import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const AmountInput = React.forwardRef(
  (
    {
      value,
      onChange,
      setTotalAmount,
      fields,
      placeholder,
      className,
      ...props
    },
    ref
  ) => {
    const handleChange = (e) => {
      const newValue = e.target.value;

      // Allow empty input
      if (newValue === "") {
        onChange("");
        return;
      }

      // Allow numbers with up to 2 decimal places
      const priceRegex = /^\d.?\d{0,2}$|^\d.$|^\d*.?\d{0,2}$/;

      if (priceRegex.test(newValue)) {
        onChange(newValue);
      }
    };

    // Convert value to string if it's a number
    const displayValue = value?.toString() || "";

    return (
      <div className="relative">
        {/* <Input
          type="text"
          inputMode="decimal" // Add this to show decimal keyboard on mobile
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder || "0.00"}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-6 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        /> */}
        <Input
          {...props}
          ref={ref}
          type="number" // Changed from "text" to "number"
          step="0.01" // Add this to allow decimals
          min="0"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder || "0.00"}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-6 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className
          )}
        />
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground peer-disabled:opacity-50">
          £
        </span>
        <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-sm text-muted-foreground peer-disabled:opacity-50">
          GBP
        </span>
      </div>
    );
  }
);

AmountInput.displayName = "AmountInput";

export default React.memo(AmountInput);
