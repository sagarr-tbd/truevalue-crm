"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const buttonId = useId();

  const actionableItems = items.filter(item => !item.divider && !item.disabled);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 192;
    const estimatedMenuHeight = (actionableItems.length + items.filter(i => i.divider).length) * 36 + 8;

    let left = align === "start" ? rect.left : rect.right - menuWidth;
    if (align === "center") left = rect.left + rect.width / 2 - menuWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;
    const top = openAbove ? rect.top - estimatedMenuHeight - 4 : rect.bottom + 4;

    setMenuPos({ top, left });
  }, [align, actionableItems.length, items]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        menuRef.current && !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => setIsOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) setFocusedIndex(-1);
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

  const dropdownContent = isOpen && menuPos && typeof document !== "undefined" ? createPortal(
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-labelledby={buttonId}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.1 }}
        className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]"
        style={{ top: menuPos.top, left: menuPos.left }}
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
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <div className={`relative ${className}`} ref={triggerRef} onKeyDown={handleKeyDown}>
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

      {dropdownContent}
    </div>
  );
}
