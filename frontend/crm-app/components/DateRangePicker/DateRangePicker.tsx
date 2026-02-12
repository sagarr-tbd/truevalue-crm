"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface DateRange {
  start: string;
  end: string;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

export default function DateRangePicker({
  value,
  onChange,
  label = "Date Range",
  placeholder = "Select date range",
  className = "",
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(value?.start || "");
  const [endDate, setEndDate] = useState(value?.end || "");

  const handleApply = () => {
    if (startDate && endDate) {
      onChange({ start: startDate, end: endDate });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    onChange(null);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!value?.start || !value?.end) return placeholder;
    
    const start = new Date(value.start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const end = new Date(value.end).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    
    return `${start} - ${end}`;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-gray-700">{formatDateRange()}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <Card className="absolute right-0 mt-2 p-4 w-80 z-20 shadow-lg">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">{label}</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={minDate}
                    max={endDate || maxDate}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || minDate}
                    max={maxDate}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Quick Options */}
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  Quick Select
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      setStartDate(today.toISOString().split("T")[0]);
                      setEndDate(today.toISOString().split("T")[0]);
                    }}
                    className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const lastWeek = new Date(today);
                      lastWeek.setDate(today.getDate() - 7);
                      setStartDate(lastWeek.toISOString().split("T")[0]);
                      setEndDate(today.toISOString().split("T")[0]);
                    }}
                    className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const lastMonth = new Date(today);
                      lastMonth.setDate(today.getDate() - 30);
                      setStartDate(lastMonth.toISOString().split("T")[0]);
                      setEndDate(today.toISOString().split("T")[0]);
                    }}
                    className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const firstDayOfMonth = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                      );
                      setStartDate(firstDayOfMonth.toISOString().split("T")[0]);
                      setEndDate(today.toISOString().split("T")[0]);
                    }}
                    className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    This Month
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!startDate || !endDate}
                  className="flex-1"
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
