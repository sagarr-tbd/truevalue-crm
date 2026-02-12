"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getModifierKey } from "@/hooks/useKeyboardShortcuts";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: Shortcut[] = [
  // Global shortcuts
  {
    keys: [getModifierKey(), "K"],
    description: "Focus search bar",
    category: "Global",
  },
  {
    keys: [getModifierKey(), "/"],
    description: "Show keyboard shortcuts",
    category: "Global",
  },
  {
    keys: ["Esc"],
    description: "Close modal or drawer",
    category: "Global",
  },
  
  // Page shortcuts
  {
    keys: [getModifierKey(), "N"],
    description: "Create new item",
    category: "Pages",
  },
  
  // Form shortcuts
  {
    keys: [getModifierKey(), "S"],
    description: "Save form",
    category: "Forms",
  },
  {
    keys: [getModifierKey(), "Enter"],
    description: "Submit form",
    category: "Forms",
  },
  {
    keys: ["Esc"],
    description: "Cancel/Close form",
    category: "Forms",
  },
  
  // Table shortcuts
  {
    keys: ["↑", "↓"],
    description: "Navigate table rows",
    category: "Tables",
  },
  {
    keys: ["Enter"],
    description: "Open selected row",
    category: "Tables",
  },
];

export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const categories = Array.from(
    new Set(shortcuts.map((s) => s.category))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[9999] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl"
            >
              <Card className="border border-border shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Keyboard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        Keyboard Shortcuts
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Speed up your workflow with shortcuts
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-6">
                    {categories.map((category) => (
                      <div key={category}>
                        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {shortcuts
                            .filter((s) => s.category === category)
                            .map((shortcut, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <span className="text-sm text-muted-foreground">
                                  {shortcut.description}
                                </span>
                                <div className="flex items-center gap-1">
                                  {shortcut.keys.map((key, keyIndex) => (
                                    <div
                                      key={keyIndex}
                                      className="flex items-center gap-1"
                                    >
                                      <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded shadow-sm min-w-[28px] text-center">
                                        {key}
                                      </kbd>
                                      {keyIndex < shortcut.keys.length - 1 && (
                                        <span className="text-xs text-muted-foreground">
                                          +
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/30">
                  <p className="text-xs text-center text-muted-foreground">
                    Press{" "}
                    <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-background border border-border rounded">
                      {getModifierKey()}
                    </kbd>
                    {" + "}
                    <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-background border border-border rounded">
                      /
                    </kbd>{" "}
                    to toggle this dialog
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
