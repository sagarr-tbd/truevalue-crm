"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

// Tag option can be either a string or an object with value/label
type TagOption = string | { value: string; label: string };

interface TagsSelectorProps {
  label: string;
  required?: boolean;
  options: TagOption[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  disabled?: boolean;
}

// Helper to normalize tag options
function normalizeTag(tag: TagOption): { value: string; label: string } {
  if (typeof tag === 'string') {
    return { value: tag, label: tag };
  }
  return tag;
}

export function TagsSelector({
  label,
  required,
  options,
  selectedTags,
  onToggleTag,
  onRemoveTag,
  disabled,
}: TagsSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options to always have value/label
  const normalizedOptions = useMemo(() => 
    options.map(normalizeTag),
    [options]
  );

  const filteredTags = normalizedOptions.filter((tag) =>
    tag.label.toLowerCase().includes(search.toLowerCase())
  );

  // Get label for a selected tag value
  const getTagLabel = (value: string): string => {
    const found = normalizedOptions.find(t => t.value === value);
    return found ? found.label : value;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative" ref={dropdownRef}>
        {/* Tags Input/Trigger */}
        <div
          onClick={() => !disabled && setDropdownOpen(!dropdownOpen)}
          className={`min-h-[44px] w-full px-3 py-2 rounded-lg border border-input bg-background hover:border-muted-foreground/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-ring ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.length === 0 ? (
              <span className="text-sm text-muted-foreground">Select tags...</span>
            ) : (
              selectedTags.map((tagValue) => (
                <span
                  key={tagValue}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-primary/10 text-primary"
                >
                  {getTagLabel(tagValue)}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!disabled) onRemoveTag(tagValue);
                    }}
                  />
                </span>
              ))
            )}
          </div>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
            >
              {/* Search */}
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Tags List */}
              <div className="max-h-[200px] overflow-y-auto p-1">
                {filteredTags.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                    No tags found
                  </div>
                ) : (
                  filteredTags.map((tag) => (
                    <div
                      key={tag.value}
                      onClick={() => onToggleTag(tag.value)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                    >
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                          selectedTags.includes(tag.value)
                            ? "bg-primary border-primary"
                            : "border-input"
                        }`}
                      >
                        {selectedTags.includes(tag.value) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm">{tag.label}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Selected Count */}
              {selectedTags.length > 0 && (
                <div className="px-3 py-2 border-t border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedTags.length} {selectedTags.length === 1 ? "tag" : "tags"}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
