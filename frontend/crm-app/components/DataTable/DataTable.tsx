"use client";

import { motion } from "framer-motion";
import { ArrowUpDown, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DataTableProps, Column } from "./DataTable.types";
import { useTableColumns } from "@/hooks/useTableColumns";
import { useMemo } from "react";

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  onSort,
  sortColumn,
  sortDirection = "asc",
  renderActions,
  emptyIcon: EmptyIcon = Inbox,
  emptyMessage = "No data found",
  emptyDescription = "Get started by adding your first item",
  showSelection = false,
  getRowId = (row) => row.id,
  onRowClick,
  className = "",
  striped = false,
  hoverable = true,
  bordered = true,
  loading = false,
  tableId,
  externalColumnState,
}: DataTableProps<T>) {
  // Internal column management
  const internalState = useTableColumns({
    columns,
    tableId,
    enablePersistence: !!tableId && !externalColumnState,
  });

  // Use external state if provided, otherwise internal
  const activeColumnState = externalColumnState || internalState.columnState;

  // Calculate visible columns
  const visibleColumns = useMemo(() => {
    if (activeColumnState.length === 0) return [];
    
    return [...activeColumnState]
      .sort((a, b) => a.order - b.order)
      .map((state) => {
        const col = columns.find((c) => String(c.key) === state.key);
        if (!col) return null;
        return { ...col, visible: state.visible };
      })
      .filter((col): col is Column<T> & { visible: boolean } => col !== null && col.visible);
  }, [activeColumnState, columns]);

  const handleSort = (columnKey: keyof T | string) => {
    if (onSort) {
      onSort(columnKey);
    }
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  // Render cell
  const renderCell = (column: Column<T> & { visible: boolean }, row: T, rowIndex: number, colIndex: number) => {
    const value = row[column.key as keyof T];
    const content = column.render ? column.render(value, row, rowIndex) : value;

    return (
      <td
        key={colIndex}
        className={`px-4 py-4 text-${column.align || "left"} ${column.className || ""}`}
        style={{ width: column.width }}
      >
        <div className="truncate">{content}</div>
      </td>
    );
  };

  return (
    <Card className={`${bordered ? "border border-gray-200" : "border-transparent"} ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '100%' }}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {showSelection && onSelectAll && (
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {visibleColumns.map((column) => {
                const isSorted = sortColumn === column.key;
                return (
                  <th
                    key={String(column.key)}
                    className={`px-4 py-3 text-${column.align || "left"} text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                      isSorted ? "bg-gray-100" : ""
                    } ${column.sortable ? "cursor-pointer hover:bg-gray-100" : ""} ${column.className || ""}`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate">{column.label}</span>
                      {column.sortable && (
                        <ArrowUpDown className={`h-3 w-3 ${isSorted ? "text-primary" : ""}`} />
                      )}
                      {isSorted && (
                        <span className="text-primary text-[10px]">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {renderActions && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-l border-gray-200 w-20">
                  ACTIONS
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (showSelection ? 1 : 0) + (renderActions ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (showSelection ? 1 : 0) + (renderActions ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <EmptyIcon className="h-12 w-12 text-gray-300" />
                    <p className="text-gray-500 font-medium">{emptyMessage}</p>
                    <p className="text-sm text-gray-400">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = getRowId(row);
                const isSelected = selectedIds.includes(rowId);

                return (
                  <motion.tr
                    key={rowId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: rowIndex * 0.02 }}
                    className={`${hoverable ? "hover:bg-gray-50" : ""} ${onRowClick ? "cursor-pointer" : ""} ${striped && rowIndex % 2 === 1 ? "bg-gray-25" : ""}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {showSelection && onSelectRow && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow(rowId)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    {visibleColumns.map((column, colIndex) =>
                      renderCell(column, row, rowIndex, colIndex)
                    )}
                    {renderActions && (
                      <td className="px-4 py-4 border-l border-gray-100">
                        <div onClick={(e) => e.stopPropagation()}>{renderActions(row, rowIndex)}</div>
                      </td>
                    )}
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile scroll hint */}
      {data.length > 0 && !loading && (
        <div className="sm:hidden px-4 py-2 text-center text-xs text-gray-500 bg-gray-50 border-t">
          ← Scroll horizontally to view more →
        </div>
      )}
    </Card>
  );
}
