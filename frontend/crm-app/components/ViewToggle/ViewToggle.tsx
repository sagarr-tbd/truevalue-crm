"use client";

import { List, LayoutGrid, Columns3 } from "lucide-react";
import { ViewToggleProps } from "./ViewToggle.types";

export default function ViewToggle({
  viewMode,
  onViewModeChange,
  className = "",
  showLabels = false,
  showKanban = false,
}: ViewToggleProps & { showKanban?: boolean }) {
  return (
    <div className={`inline-flex items-center bg-muted rounded-lg p-1 gap-1 ${className}`}>
      <button
        onClick={() => onViewModeChange("list")}
        title="List View"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all relative ${
          viewMode === "list"
            ? "bg-background text-brand-teal shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <List className={`h-4 w-4 ${viewMode === "list" ? "stroke-[2.5]" : ""}`} />
        {showLabels && <span>List</span>}
        {viewMode === "list" && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-brand-teal" />
        )}
      </button>
      <button
        onClick={() => onViewModeChange("grid")}
        title="Grid View"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all relative ${
          viewMode === "grid"
            ? "bg-background text-brand-teal shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGrid className={`h-4 w-4 ${viewMode === "grid" ? "stroke-[2.5]" : ""}`} />
        {showLabels && <span>Grid</span>}
        {viewMode === "grid" && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-brand-teal" />
        )}
      </button>
      {showKanban && (
        <button
          onClick={() => onViewModeChange("kanban")}
          title="Kanban View"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all relative ${
            viewMode === "kanban"
              ? "bg-background text-brand-teal shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Columns3 className={`h-4 w-4 ${viewMode === "kanban" ? "stroke-[2.5]" : ""}`} />
          {showLabels && <span>Kanban</span>}
          {viewMode === "kanban" && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-brand-teal" />
          )}
        </button>
      )}
    </div>
  );
}
