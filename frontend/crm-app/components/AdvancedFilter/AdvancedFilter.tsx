"use client";

import { useState} from "react";
import { X, Plus, Save, Filter as FilterIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AdvancedFilterProps,
  FilterCondition,
  FilterGroup,
  FilterField,
  FilterOperator,
} from "./AdvancedFilter.types";
import {
  generateId,
  getOperatorLabel,
  getOperatorsForType,
} from "./filterUtils";

export default function AdvancedFilter({
  fields,
  onApply,
  onClear,
  initialGroup,
  presets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  className = "",
  isDrawer = false,
  isOpen = true,
  onClose,
  drawerPosition = "right",
}: AdvancedFilterProps) {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>(
    initialGroup || {
      id: generateId(),
      logic: "AND",
      conditions: [],
    }
  );

  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");

  // Add new condition
  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: generateId(),
      field: fields[0]?.key || "",
      operator: "equals",
      value: "",
    };

    setFilterGroup({
      ...filterGroup,
      conditions: [...filterGroup.conditions, newCondition],
    });
  };

  // Remove condition
  const removeCondition = (conditionId: string) => {
    setFilterGroup({
      ...filterGroup,
      conditions: filterGroup.conditions.filter((c) => c.id !== conditionId),
    });
  };

  // Update condition
  const updateCondition = (
    conditionId: string,
    updates: Partial<FilterCondition>
  ) => {
    setFilterGroup({
      ...filterGroup,
      conditions: filterGroup.conditions.map((c) =>
        c.id === conditionId ? { ...c, ...updates } : c
      ),
    });
  };

  // Toggle logic
  const toggleLogic = () => {
    setFilterGroup({
      ...filterGroup,
      logic: filterGroup.logic === "AND" ? "OR" : "AND",
    });
  };

  // Apply filters
  const handleApply = () => {
    onApply(filterGroup);
    if (isDrawer && onClose) {
      onClose();
    }
  };

  // Clear filters
  const handleClear = () => {
    setFilterGroup({
      id: generateId(),
      logic: "AND",
      conditions: [],
    });
    onClear();
  };

  // Save preset
  const handleSavePreset = () => {
    if (!presetName.trim() || !onSavePreset) return;

    onSavePreset({
      name: presetName,
      description: presetDescription,
      group: filterGroup,
    });

    setPresetName("");
    setPresetDescription("");
    setShowSavePreset(false);
  };

  // Load preset
  const handleLoadPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setFilterGroup(preset.group);
      if (onLoadPreset) {
        onLoadPreset(preset);
      }
    }
  };

  // Get field by key
  const getField = (key: string): FilterField | undefined => {
    return fields.find((f) => f.key === key);
  };

  // Get operators for field
  const getOperators = (fieldKey: string): FilterOperator[] => {
    const field = getField(fieldKey);
    if (!field) return ["equals"];

    return field.operators || getOperatorsForType(field.type);
  };

  const hasConditions = filterGroup.conditions.length > 0;

  // Drawer animations
  const drawerVariants = {
    hidden: {
      x: drawerPosition === "right" ? "100%" : "-100%",
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      x: drawerPosition === "right" ? "100%" : "-100%",
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  // If it's a drawer and not open, don't render
  if (isDrawer && !isOpen) return null;

  const filterContent = (
    <Card className={`${isDrawer ? 'rounded-none shadow-2xl h-full border-0' : ''} ${isDrawer ? 'p-4' : 'p-3'} ${className}`}>
      <div className={`${isDrawer ? 'space-y-4' : 'space-y-2'} h-full flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0 pb-3 border-b">
          <div className="flex items-center gap-2">
            <FilterIcon className={`${isDrawer ? 'h-5 w-5' : 'h-4 w-4'} text-primary`} />
            <h3 className={`${isDrawer ? 'text-base' : 'text-sm'} font-semibold text-gray-900`}>Advanced Filters</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Logic Toggle */}
            {hasConditions && filterGroup.conditions.length > 1 && (
              <button
                onClick={toggleLogic}
                className={`${isDrawer ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors`}
                title="Toggle match logic"
              >
                {filterGroup.logic === "AND" ? "All" : "Any"}
              </button>
            )}
            
            {hasConditions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className={`${isDrawer ? 'text-sm h-8 px-3' : 'text-xs h-7 px-2'} text-gray-500 hover:text-gray-700`}
              >
                Clear All
              </Button>
            )}

            {/* Close button for drawer */}
            {isDrawer && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Conditions - Scrollable area */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isDrawer ? 'space-y-3 pr-2' : 'space-y-2'}`}>
          <AnimatePresence mode="popLayout">
            {filterGroup.conditions.map((condition) => {
              const field = getField(condition.field);
              const operators = getOperators(condition.field);

              return (
                <motion.div
                  key={condition.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`${isDrawer ? 'p-3 space-y-2' : 'p-2 space-y-2'} bg-gray-50 rounded-lg border border-gray-200`}
                >
                  {/* Field and Operator Row */}
                  <div className="flex items-center gap-2">
                    {/* Field Select */}
                    <select
                      value={condition.field}
                      onChange={(e) =>
                        updateCondition(condition.id, {
                          field: e.target.value,
                          operator: "equals",
                          value: "",
                        })
                      }
                      className={`flex-1 min-w-0 ${isDrawer ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white`}
                    >
                      {fields.map((field) => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>

                    {/* Operator Select */}
                    <select
                      value={condition.operator}
                      onChange={(e) =>
                        updateCondition(condition.id, {
                          operator: e.target.value as FilterOperator,
                        })
                      }
                      className={`flex-1 min-w-0 ${isDrawer ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white`}
                    >
                      {operators.map((op) => (
                        <option key={op} value={op}>
                          {getOperatorLabel(op)}
                        </option>
                      ))}
                    </select>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeCondition(condition.id)}
                      className={`flex-shrink-0 ${isDrawer ? 'p-2' : 'p-1.5'} text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors`}
                      title="Remove condition"
                    >
                      <X className={`${isDrawer ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                    </button>
                  </div>

                  {/* Value Input Row */}
                  {condition.operator !== "isEmpty" &&
                    condition.operator !== "isNotEmpty" && (
                      <div className="flex items-center gap-2">
                        {field?.type === "select" || field?.type === "multiselect" ? (
                          <select
                            value={condition.value}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                value: e.target.value,
                              })
                            }
                            className={`flex-1 min-w-0 ${isDrawer ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white`}
                          >
                            <option value="">Select...</option>
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : field?.type === "date" || field?.type === "dateRange" ? (
                          <input
                            type="date"
                            value={condition.value}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                value: e.target.value,
                              })
                            }
                            className={`flex-1 min-w-0 ${isDrawer ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white`}
                          />
                        ) : field?.type === "number" ? (
                          <input
                            type="number"
                            value={condition.value}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                value: e.target.value,
                              })
                            }
                            placeholder={field?.placeholder || "Enter value..."}
                            className={`flex-1 min-w-0 ${isDrawer ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={condition.value}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                value: e.target.value,
                              })
                            }
                            placeholder={field?.placeholder || "Enter value..."}
                            className={`flex-1 min-w-0 ${isDrawer ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white`}
                          />
                        )}

                        {/* Second value for 'between' operator */}
                        {condition.operator === "between" && (
                          <input
                            type={field?.type === "number" ? "number" : "text"}
                            value={condition.value2 || ""}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                value2: e.target.value,
                              })
                            }
                            placeholder="To..."
                            className={`flex-1 min-w-0 ${isDrawer ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white`}
                          />
                        )}
                      </div>
                    )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add Condition Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={addCondition}
          className={`w-full ${isDrawer ? 'h-9 text-sm' : 'h-8 text-xs'} flex-shrink-0`}
        >
          <Plus className={`${isDrawer ? 'h-4 w-4 mr-2' : 'h-3.5 w-3.5 mr-1'}`} />
          Add Condition
        </Button>

        {/* Presets */}
        {presets.length > 0 && (
          <div className={`border-t ${isDrawer ? 'pt-3' : 'pt-2'} flex-shrink-0`}>
            <h4 className={`${isDrawer ? 'text-sm' : 'text-xs'} font-medium text-gray-700 ${isDrawer ? 'mb-2' : 'mb-1.5'}`}>
              Saved Filters
            </h4>
            <div className={`flex flex-wrap ${isDrawer ? 'gap-2' : 'gap-1.5'}`}>
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`flex items-center gap-1 ${isDrawer ? 'px-3 py-1.5' : 'px-2 py-1'} bg-gray-100 rounded-md`}
                >
                  <button
                    onClick={() => handleLoadPreset(preset.id)}
                    className={`${isDrawer ? 'text-sm' : 'text-xs'} text-gray-700 hover:text-primary`}
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                  {onDeletePreset && (
                    <button
                      onClick={() => onDeletePreset(preset.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Preset */}
        {hasConditions && onSavePreset && (
          <div className={`border-t ${isDrawer ? 'pt-3' : 'pt-2'} flex-shrink-0`}>
            {!showSavePreset ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSavePreset(true)}
                className={`w-full ${isDrawer ? 'h-9 text-sm' : 'h-8 text-xs'}`}
              >
                <Save className={`${isDrawer ? 'h-4 w-4 mr-2' : 'h-3.5 w-3.5 mr-1'}`} />
                Save Filter Preset
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={`${isDrawer ? 'space-y-2' : 'space-y-1.5'}`}
              >
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className={`w-full ${isDrawer ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary`}
                />
                <input
                  type="text"
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  placeholder="Description (optional)..."
                  className={`w-full ${isDrawer ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary`}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                    className={`flex-1 ${isDrawer ? 'h-9 text-sm' : 'h-7 text-xs'}`}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSavePreset(false);
                      setPresetName("");
                      setPresetDescription("");
                    }}
                    className={`flex-1 ${isDrawer ? 'h-9 text-sm' : 'h-7 text-xs'}`}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Actions - Fixed at bottom */}
        <div className={`flex gap-2 ${isDrawer ? 'pt-4' : 'pt-1'} flex-shrink-0 border-t mt-auto`}>
          <Button 
            onClick={handleApply} 
            className={`flex-1 ${isDrawer ? 'h-10 text-sm' : 'h-8 text-xs'}`} 
            disabled={!hasConditions}
          >
            Apply Filters
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            className={`flex-1 ${isDrawer ? 'h-10 text-sm' : 'h-8 text-xs'}`}
            disabled={!hasConditions}
          >
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );

  // Return drawer or inline version
  if (isDrawer) {
    return (
      <>
        {/* Backdrop */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-[100]"
            />
          )}
        </AnimatePresence>

        {/* Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`fixed top-0 ${
                drawerPosition === "right" ? "right-0" : "left-0"
              } h-full w-full max-w-full sm:max-w-md lg:max-w-lg bg-white z-[101] overflow-hidden shadow-2xl`}
            >
              {filterContent}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return filterContent;
}