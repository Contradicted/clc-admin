"use client";

import { Download, CheckSquare, Square } from "lucide-react";

import { Button } from "@/components/ui/button";

import { exportAllApplicationToCSV } from "@/lib/export";
import { useState } from "react";
import { applicationHeaders } from "@/constants";
import { Checkbox } from "@/components/ui/checkbox";

const ExportCard = ({ data }) => {
  const [selectedFields, setSelectedFields] = useState([]);

  const handleFieldToggle = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSelectAll = () => {
    setSelectedFields((prev) =>
      prev.length === applicationHeaders.length
        ? []
        : applicationHeaders.map((f) => f.id)
    );
  };

  const handleExport = () => {
    // Format data to remove any whitespace in values
    const formattedData = data.map((row) => {
      const formattedRow = { ...row };

      Object.keys(formattedRow).forEach((key) => {
        if (typeof formattedRow[key] === "string") {
          formattedRow[key] = formattedRow[key].trim();
        }
      });

      return formattedRow;
    });

    exportAllApplicationToCSV(formattedData, selectedFields);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden w-full col-[1_/_span_1]">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <h2 className="text-2xl font-bold">Export Applications</h2>
        <p className="text-blue-100 mt-2">
          Select fields and download your CSV
        </p>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button
            onClick={handleSelectAll}
            variant="outline"
            className="flex items-center gap-2"
          >
            {selectedFields.length === applicationHeaders.length ? (
              <>
                <CheckSquare className="w-4 h-4" /> Deselect All
              </>
            ) : (
              <>
                <Square className="w-4 h-4" /> Select All
              </>
            )}
          </Button>
          <Button
            onClick={handleExport}
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Select Fields to Export
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {applicationHeaders.map((header) => (
              <div key={header.id} className="flex items-center space-x-3">
                <Checkbox
                  id={header.id}
                  checked={selectedFields.includes(header.id)}
                  onCheckedChange={() => handleFieldToggle(header.id)}
                  className="border-gray-300"
                />
                <label
                  htmlFor={header.id}
                  className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
                >
                  {header.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportCard;
