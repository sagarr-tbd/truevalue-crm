/**
 * useFilterPresets Hook
 * Manage filter presets with localStorage persistence
 */

import { useState, useEffect, useCallback } from "react";
import { FilterPreset, FilterGroup } from "@/components/AdvancedFilter";
import { toast } from "sonner";

const STORAGE_KEY_PREFIX = "filter_presets_";

export function useFilterPresets(moduleKey: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${moduleKey}`;
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPresets(parsed);
      }
    } catch (error) {
      console.error("Error loading filter presets:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Save presets to localStorage
  const saveToStorage = useCallback(
    (presetsToSave: FilterPreset[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(presetsToSave));
      } catch (error) {
        console.error("Error saving filter presets:", error);
        toast.error("Failed to save filter preset");
      }
    },
    [storageKey]
  );

  // Add new preset
  const addPreset = useCallback(
    (preset: Omit<FilterPreset, "id" | "createdAt">) => {
      const newPreset: FilterPreset = {
        ...preset,
        id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      const updated = [...presets, newPreset];
      setPresets(updated);
      saveToStorage(updated);
      toast.success(`Filter preset "${preset.name}" saved!`);

      return newPreset;
    },
    [presets, saveToStorage]
  );

  // Update preset
  const updatePreset = useCallback(
    (presetId: string, updates: Partial<Omit<FilterPreset, "id" | "createdAt">>) => {
      const updated = presets.map((p) =>
        p.id === presetId ? { ...p, ...updates } : p
      );
      setPresets(updated);
      saveToStorage(updated);
      toast.success("Filter preset updated!");
    },
    [presets, saveToStorage]
  );

  // Delete preset
  const deletePreset = useCallback(
    (presetId: string) => {
      const preset = presets.find((p) => p.id === presetId);
      const updated = presets.filter((p) => p.id !== presetId);
      setPresets(updated);
      saveToStorage(updated);
      
      if (preset) {
        toast.success(`Filter preset "${preset.name}" deleted`);
      }
    },
    [presets, saveToStorage]
  );

  // Get preset by ID
  const getPreset = useCallback(
    (presetId: string): FilterPreset | undefined => {
      return presets.find((p) => p.id === presetId);
    },
    [presets]
  );

  // Clear all presets
  const clearAllPresets = useCallback(() => {
    setPresets([]);
    localStorage.removeItem(storageKey);
    toast.success("All filter presets cleared");
  }, [storageKey]);

  // Set default preset
  const setDefaultPreset = useCallback(
    (presetId: string | null) => {
      const updated = presets.map((p) => ({
        ...p,
        isDefault: p.id === presetId,
      }));
      setPresets(updated);
      saveToStorage(updated);
    },
    [presets, saveToStorage]
  );

  // Get default preset
  const getDefaultPreset = useCallback((): FilterPreset | undefined => {
    return presets.find((p) => p.isDefault);
  }, [presets]);

  return {
    presets,
    isLoaded,
    addPreset,
    updatePreset,
    deletePreset,
    getPreset,
    clearAllPresets,
    setDefaultPreset,
    getDefaultPreset,
  };
}
