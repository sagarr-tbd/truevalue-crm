"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionMenuProps } from "./ActionMenu.types";

export default function ActionMenu({
  items,
  triggerIcon: TriggerIcon = MoreVertical,
  triggerLabel,
  align = "end",
  className = "",
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const buttonId = useId();

  // Get non-divider items for keyboard navigation
  const actionableItems = items.filter(item => !item.divider && !item.disabled);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Reset focus when menu closes
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < actionableItems.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : actionableItems.length - 1
        );
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < actionableItems.length) {
          const item = actionableItems[focusedIndex];
          item.onClick();
          setIsOpen(false);
        }
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  }, [isOpen, focusedIndex, actionableItems]);

  const alignmentClasses = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 transform -translate-x-1/2",
  };

  return (
    <div className={`relative ${className}`} ref={menuRef} onKeyDown={handleKeyDown}>
      <Button
        id={buttonId}
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="h-8 w-8 p-0"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={triggerLabel || "Actions menu"}
      >
        <TriggerIcon className="h-4 w-4" aria-hidden="true" />
        {triggerLabel && <span className="ml-2">{triggerLabel}</span>}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={menuId}
            role="menu"
            aria-labelledby={buttonId}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className={`absolute ${alignmentClasses[align]} mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50`}
          >
            {items.map((item, index) => {
              if (item.divider) {
                return <div key={index} className="border-t border-gray-100 my-1" role="separator" />;
              }

              const Icon = item.icon;
              const actionableIndex = actionableItems.indexOf(item);
              const isFocused = actionableIndex === focusedIndex;
              
              return (
                <button
                  key={index}
                  role="menuitem"
                  tabIndex={isFocused ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.disabled) {
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                  aria-disabled={item.disabled}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : item.variant === "danger"
                      ? "text-destructive hover:bg-destructive/10"
                      : "text-foreground hover:bg-muted"
                  } ${isFocused ? "bg-muted" : ""}`}
                >
                  {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
