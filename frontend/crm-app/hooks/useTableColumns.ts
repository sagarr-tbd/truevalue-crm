"use client";

import { useState, useEffect, useMemo } from "react";
import { Column, ColumnState } from "@/components/DataTable/DataTable.types";

interface UseTableColumnsProps<T> {
  columns: Column<T>[];
  tableId?: string;
  enablePersistence?: boolean;
}

export function useTableColumns<T>({
  columns,
  tableId,
  enablePersistence = true,
}: UseTableColumnsProps<T>) {
  const [columnState, setColumnState] = useState<ColumnState[]>([]);

  // Initialize column state
  useEffect(() => {
    const initializeColumnState = () => {
      if (enablePersistence && tableId && typeof window !== 'undefined') {
        const savedState = localStorage.getItem(`table-columns-${tableId}`);
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            setColumnState(parsed);
            return;
          } catch (e) {
            console.error("Failed to parse saved column state:", e);
          }
        }
      }

      const initialState: ColumnState[] = columns.map((col, index) => ({
        key: String(col.key),
        visible: col.visible !== false,
        order: index,
      }));

      setColumnState(initialState);
    };

    initializeColumnState();
  }, [columns, tableId, enablePersistence]);

  // Save to localStorage
  useEffect(() => {
    if (enablePersistence && tableId && columnState.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem(`table-columns-${tableId}`, JSON.stringify(columnState));
    }
  }, [columnState, tableId, enablePersistence]);

  // Toggle column visibility
  const toggleColumnVisibility = (key: string) => {
    setColumnState((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col))
    );
  };

  // Reorder columns
  const reorderColumns = (newOrder: string[]) => {
    setColumnState((prev) => {
      const reordered = newOrder.map((key, index) => {
        const col = prev.find((c) => c.key === key);
        return col ? { ...col, order: index } : null;
      }).filter((col): col is ColumnState => col !== null);
      
      return reordered;
    });
  };

  // Reset columns
  const resetColumns = () => {
    const initialState: ColumnState[] = columns.map((col, index) => ({
      key: String(col.key),
      visible: col.visible !== false,
      order: index,
    }));

    setColumnState(initialState);

    if (enablePersistence && tableId && typeof window !== 'undefined') {
      localStorage.removeItem(`table-columns-${tableId}`);
    }
  };

  // Get ordered columns
  const orderedColumns = useMemo(() => {
    if (columnState.length === 0) return [];

    const mapped = [...columnState]
      .sort((a, b) => a.order - b.order)
      .map((state) => {
        const col = columns.find((c) => String(c.key) === state.key);
        if (!col) return null;
        
        return {
          ...col,
          visible: state.visible,
        };
      })
      .filter((col) => col !== null);
    
    return mapped as Array<Column<T> & { visible: boolean }>;
  }, [columnState, columns]);

  // Get visible columns
  const visibleColumns = () => {
    return orderedColumns.filter((col) => col.visible);
  };

  return {
    columnState,
    orderedColumns,
    visibleColumns,
    toggleColumnVisibility,
    reorderColumns,
    resetColumns,
  };
}
