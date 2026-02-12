/**
 * Filter Utilities
 * Helper functions for filtering data
 */

import { FilterCondition, FilterGroup, FilterOperator } from "./AdvancedFilter.types";

/**
 * Apply a single filter condition to a value
 */
export function applyFilterCondition(
  value: any,
  condition: FilterCondition
): boolean {
  const { operator, value: filterValue, value2 } = condition;

  // Handle empty checks
  if (operator === "isEmpty") {
    return value === null || value === undefined || value === "";
  }
  if (operator === "isNotEmpty") {
    return value !== null && value !== undefined && value !== "";
  }

  // Convert to string for text operations
  const strValue = String(value || "").toLowerCase();
  const strFilterValue = String(filterValue || "").toLowerCase();

  switch (operator) {
    case "equals":
      return value == filterValue;

    case "notEquals":
      return value != filterValue;

    case "contains":
      return strValue.includes(strFilterValue);

    case "notContains":
      return !strValue.includes(strFilterValue);

    case "startsWith":
      return strValue.startsWith(strFilterValue);

    case "endsWith":
      return strValue.endsWith(strFilterValue);

    case "greaterThan":
      return Number(value) > Number(filterValue);

    case "lessThan":
      return Number(value) < Number(filterValue);

    case "greaterThanOrEqual":
      return Number(value) >= Number(filterValue);

    case "lessThanOrEqual":
      return Number(value) <= Number(filterValue);

    case "between":
      return (
        Number(value) >= Number(filterValue) &&
        Number(value) <= Number(value2)
      );

    case "in":
      const inValues = Array.isArray(filterValue)
        ? filterValue
        : [filterValue];
      return inValues.includes(value);

    case "notIn":
      const notInValues = Array.isArray(filterValue)
        ? filterValue
        : [filterValue];
      return !notInValues.includes(value);

    default:
      return true;
  }
}

/**
 * Apply a filter group to a data item
 */
export function applyFilterGroup<T = any>(
  item: T,
  group: FilterGroup
): boolean {
  const { logic, conditions } = group;

  if (conditions.length === 0) return true;

  const results = conditions.map((condition) => {
    const value = (item as any)[condition.field];
    return applyFilterCondition(value, condition);
  });

  return logic === "AND" ? results.every((r) => r) : results.some((r) => r);
}

/**
 * Filter an array of data using a filter group
 */
export function filterData<T = any>(
  data: T[],
  group: FilterGroup | null
): T[] {
  if (!group || group.conditions.length === 0) {
    return data;
  }

  return data.filter((item) => applyFilterGroup(item, group));
}

/**
 * Get operator label
 */
export function getOperatorLabel(operator: FilterOperator): string {
  const labels: Record<FilterOperator, string> = {
    equals: "Equals",
    notEquals: "Not Equals",
    contains: "Contains",
    notContains: "Does Not Contain",
    startsWith: "Starts With",
    endsWith: "Ends With",
    greaterThan: "Greater Than",
    lessThan: "Less Than",
    greaterThanOrEqual: "Greater Than or Equal",
    lessThanOrEqual: "Less Than or Equal",
    between: "Between",
    in: "Is In",
    notIn: "Is Not In",
    isEmpty: "Is Empty",
    isNotEmpty: "Is Not Empty",
  };

  return labels[operator] || operator;
}

/**
 * Get available operators for a field type
 */
export function getOperatorsForType(type: string): FilterOperator[] {
  switch (type) {
    case "text":
      return [
        "equals",
        "notEquals",
        "contains",
        "notContains",
        "startsWith",
        "endsWith",
        "isEmpty",
        "isNotEmpty",
      ];

    case "number":
      return [
        "equals",
        "notEquals",
        "greaterThan",
        "lessThan",
        "greaterThanOrEqual",
        "lessThanOrEqual",
        "between",
        "isEmpty",
        "isNotEmpty",
      ];

    case "date":
    case "dateRange":
      return [
        "equals",
        "notEquals",
        "greaterThan",
        "lessThan",
        "greaterThanOrEqual",
        "lessThanOrEqual",
        "between",
        "isEmpty",
        "isNotEmpty",
      ];

    case "select":
      return ["equals", "notEquals", "in", "isEmpty", "isNotEmpty"];

    case "multiselect":
      return ["in", "notIn", "isEmpty", "isNotEmpty"];

    case "boolean":
      return ["equals"];

    default:
      return ["equals", "notEquals"];
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
