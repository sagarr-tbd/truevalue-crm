"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Eye, EyeOff, GripVertical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Column, ColumnState } from "./DataTable.types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ColumnSettingsProps<T> {
  columns: Column<T>[];
  columnState: ColumnState[];
  onToggleVisibility: (key: string) => void;
  onReorder: (newOrder: string[]) => void;
  onReset: () => void;
}

interface SortableItemProps {
  id: string;
  column: Column<any>;
  state: ColumnState;
  onToggleVisibility: (key: string) => void;
}

function SortableItem({ id, column, state, onToggleVisibility }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
        type="button"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      
      <span className="flex-1 text-sm text-gray-700 truncate">{column.label}</span>
      
      <button
        onClick={() => onToggleVisibility(state.key)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        title={state.visible ? "Hide column" : "Show column"}
        type="button"
      >
        {state.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function ColumnSettings<T>({
  columns,
  columnState,
  onToggleVisibility,
  onReorder,
  onReset,
}: ColumnSettingsProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columnState.findIndex((col) => col.key === active.id);
      const newIndex = columnState.findIndex((col) => col.key === over.id);

      const newOrder = arrayMove(
        columnState.map((col) => col.key),
        oldIndex,
        newIndex
      );

      onReorder(newOrder);
    }
  };

  const orderedState = [...columnState].sort((a, b) => a.order - b.order);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        title="Manage Columns"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Settings Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-4 z-50"
            >
              <div className="px-4 pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Column Settings
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    title="Reset to defaults"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Reset
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Drag to reorder • Click eye to show/hide columns
                </p>
              </div>

              <div className="px-4 pt-3 max-h-96 overflow-y-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={orderedState.map((col) => col.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {orderedState.map((state) => {
                        const column = columns.find(
                          (col) => String(col.key) === state.key
                        );
                        if (!column) return null;

                        return (
                          <SortableItem
                            key={state.key}
                            id={state.key}
                            column={column}
                            state={state}
                            onToggleVisibility={onToggleVisibility}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
