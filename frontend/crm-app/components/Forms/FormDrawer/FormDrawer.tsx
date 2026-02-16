"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import { TagsSelector } from "./TagsSelector";
import { ProfilePictureField } from "./ProfilePictureField";
import { useKeyboardShortcuts } from "@/hooks";
import type { FormDrawerProps, FormView } from "./types";

export function FormDrawer<T = any>({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "add",
  defaultView = "quick",
  config,
}: FormDrawerProps<T>) {
  const [currentView, setCurrentView] = useState<FormView>(defaultView);
  const [activeSection, setActiveSection] = useState(config.detailedSections[0]?.id || "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(config.schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: config.defaultValues,
  });

  // Auto-compute derived fields when their dependencies change
  useEffect(() => {
    if (!config.computedFields) return;

    const subscription = watch((values, { name }) => {
      if (!name || !config.computedFields) return;

      for (const [fieldName, computed] of Object.entries(config.computedFields)) {
        if (computed.dependsOn.includes(name)) {
          const result = computed.compute(values as Record<string, any>);
          setValue(fieldName, result, { shouldValidate: false });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [config.computedFields, watch, setValue]);

  // Collect field names shown in quick mode so we can register the rest hidden
  const quickFieldNames = useMemo(() => {
    if (!config.quickFormSections) return new Set<string>();
    return new Set(config.quickFormSections.flatMap(s => s.fields));
  }, [config.quickFormSections]);

  // All unique fields across all sections
  const allFields = useMemo(() => {
    const seen = new Set<string>();
    return config.detailedSections.flatMap(s => s.fields).filter(f => {
      if (seen.has(f.name)) return false;
      seen.add(f.name);
      return true;
    });
  }, [config.detailedSections]);

  // Fields not in quick mode that need hidden registration
  const hiddenQuickFields = useMemo(() => {
    return allFields.filter(f => !quickFieldNames.has(f.name) && f.type !== "tags" && f.type !== "profile");
  }, [allFields, quickFieldNames]);

  // Sanitize data: convert null values to undefined for form compatibility
  const sanitizeFormData = useCallback((data: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === null) {
        sanitized[key] = undefined;
      } else if (Array.isArray(value)) {
        sanitized[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeFormData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }, []);

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      setCurrentView(defaultView);
      setActiveSection(config.detailedSections[0]?.id || "");

      if (initialData) {
        // Sanitize data to convert null to undefined
        const sanitizedData = sanitizeFormData(initialData as Record<string, any>);
        reset(sanitizedData as any);
        
        // Support both 'tagIds' (form field) and 'tags' (legacy)
        // Ensure we always extract string IDs, even if tags are objects
        const rawTags = (initialData as any).tagIds || (initialData as any).tags || [];
        const normalizedTagIds = rawTags.map((tag: string | { id: string }) => 
          typeof tag === 'string' ? tag : tag.id
        );
        setSelectedTags(normalizedTagIds);
        setProfilePicture(null); // Profile picture as File object can't be restored
      } else {
        reset(config.defaultValues);
        setSelectedTags([]);
        setProfilePicture(null);
      }
    }
  }, [isOpen, initialData, defaultView, config, reset, sanitizeFormData]);

  // Handle body overflow
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [isOpen]);

  // Form keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "Escape",
        description: "Close form",
        action: () => {
          if (isOpen && !isSubmitting) {
            onClose();
          }
        },
        preventDefault: false,
      },
      {
        key: "s",
        meta: true,
        ctrl: true,
        description: "Save form",
        action: () => {
          if (isOpen && !isSubmitting) {
            handleSubmit(onSubmitForm)();
          }
        },
      },
    ],
    enabled: isOpen,
  });

  // Submit handler
  // Note: Toast notifications are handled by the mutation hooks, not here
  const onSubmitForm = useCallback(
    async (data: any) => {
      const formDataWithExtras = {
        ...data,
        tagIds: selectedTags, // Use tagIds to match form field name and backend expectation
        profilePicture: profilePicture ? await convertFileToBase64(profilePicture) : undefined,
      };
      await onSubmit(formDataWithExtras);
      reset();
      onClose();
    },
    [onSubmit, reset, onClose, selectedTags, profilePicture]
  );

  // Helper to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Tags handlers
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };


  // Get title
  const getTitle = () => {
    if (mode === "edit") return `Edit ${config.entity}`;
    return `Create New ${config.entity}`;
  };

  // Get subtitle
  const getSubtitle = () => {
    if (mode === "edit") return `Update ${config.entity.toLowerCase()} information`;
    return `Complete all ${config.entity.toLowerCase()} information`;
  };

  // Switch view
  const switchView = (view: FormView) => {
    setCurrentView(view);
  };

  // Render fields in a grid
  const renderFields = (fields: typeof config.detailedSections[0]['fields']) => {
    return fields.map((field) => {
      if (field.type === "tags") {
        return (
          <TagsSelector
            key={field.name}
            label={field.label}
            required={field.required}
            options={field.options as string[] || []}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onRemoveTag={removeTag}
            disabled={isSubmitting}
          />
        );
      }

      if (field.type === "profile") {
        return (
          <ProfilePictureField
            key={field.name}
            label={field.label}
            value={(initialData as any)?.[field.name] || null}
            onChange={setProfilePicture}
            disabled={isSubmitting}
          />
        );
      }

      return (
        <FormField
          key={field.name}
          field={field}
          register={register}
          errors={errors}
          watch={watch}
          isSubmitting={isSubmitting}
        />
      );
    });
  };

  if (!isOpen) return null;

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
            className="fixed inset-0 bg-black/50 z-[9999]"
            onClick={onClose}
          />

          {/* Right Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`
              fixed top-0 right-0 h-full z-[10000] bg-background shadow-2xl border-l border-border
              flex flex-col overflow-hidden
              ${currentView === "detailed" 
                ? "w-full sm:w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[1400px] max-w-[1600px]" 
                : "w-full sm:w-[600px] md:w-[650px] lg:w-[700px]"}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between p-4 sm:p-5 border-b border-border bg-muted/30 shrink-0 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                    {config.entityIcon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">{getTitle()}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">{getSubtitle()}</p>
                  </div>
                </div>

                {/* View Toggle */}
                <div className={`flex items-center gap-1 mt-3 sm:mt-4 p-1 bg-muted rounded-lg w-full sm:w-fit ${currentView === "detailed" ? "hidden sm:flex" : "flex"}`}>
                  <button
                    type="button"
                    onClick={() => switchView("quick")}
                    className={`
                      flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200
                      ${currentView === "quick"
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    Quick Form
                  </button>
                  <button
                    type="button"
                    onClick={() => switchView("detailed")}
                    className={`
                      flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200
                      ${currentView === "detailed"
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    Detail Form
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden flex">
                {currentView === "quick" ? (
                  /* Quick Form View */
                  <motion.div
                    key="quick-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 overflow-y-auto p-4 sm:p-5"
                  >
                    <div className="space-y-5 max-w-2xl mx-auto">
                      {config.quickFormSections ? (
                        /* Render with sections (new style) */
                        <>
                          {config.quickFormSections.map((section, idx) => (
                            <div 
                              key={idx} 
                              className={`space-y-3 sm:space-y-4 ${idx > 0 ? 'pt-3 sm:pt-4 border-t border-border' : ''}`}
                            >
                              <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                                {section.icon}
                                {section.label}
                              </h3>
                              <div className={`grid gap-3 sm:gap-4 ${section.fields.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                {renderFields(
                                  config.detailedSections
                                    .flatMap(s => s.fields)
                                    .filter(f => section.fields.includes(f.name))
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        /* Fallback: Render without sections (legacy) */
                        <div className="space-y-3 sm:space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {renderFields(
                              config.detailedSections
                                .flatMap(s => s.fields)
                                .filter(f => config.quickFormFields?.includes(f.name))
                            )}
                          </div>
                        </div>
                      )}
                      {/* Hidden fields: register non-quick fields so they're included in form data */}
                      {hiddenQuickFields.length > 0 && (
                        <div className="hidden" aria-hidden="true">
                          {renderFields(hiddenQuickFields)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* Detailed Form View */
                  <motion.div
                    key="detailed-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex overflow-hidden flex-col lg:flex-row"
                  >
                    {/* Mobile Tabs - Show on mobile, hide on desktop */}
                    <div className="lg:hidden border-b border-border bg-muted/30 px-4 overflow-x-auto">
                      <div className="flex gap-1 min-w-max">
                        {config.detailedSections.map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveSection(section.id)}
                            className={`
                              relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap
                              ${activeSection === section.id
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                              }
                            `}
                          >
                            <span className="text-base">{section.icon}</span>
                            <span className="hidden sm:inline">{section.label}</span>
                            {activeSection === section.id && (
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sidebar - Hide on mobile, show on desktop */}
                    <div className="hidden lg:block w-56 bg-muted/30 border-r border-border p-4 flex-shrink-0">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sections</h3>
                      <nav className="space-y-1">
                        {config.detailedSections.map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveSection(section.id)}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                              ${activeSection === section.id
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }
                            `}
                          >
                            <span className={activeSection === section.id ? "text-primary-foreground" : ""}>{section.icon}</span>
                            <span className="flex-1 text-left">{section.label}</span>
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
                      {config.detailedSections.map((section) => {
                        const isActive = activeSection === section.id;
                        
                        return (
                          <div
                            key={section.id}
                            className={isActive ? "space-y-6" : "hidden"}
                            aria-hidden={!isActive}
                          >
                            <div className="flex items-center gap-2">
                              {section.icon}
                              <h3 className="text-lg font-semibold text-foreground">{section.label}</h3>
                            </div>

                            {section.layout ? (
                              /* Render with custom layout */
                              <>
                                {section.layout.map((group, idx) => (
                                  <div key={idx} className={`grid ${group.gridClass}`}>
                                    {group.fields.map((fieldRef, fieldIdx) => {
                                      if (fieldRef.isPlaceholder) {
                                        return <div key={fieldIdx} className="hidden lg:block" />;
                                      }
                                      
                                      const field = section.fields.find(f => f.name === fieldRef.name);
                                      if (!field) return null;

                                      const wrapperClass = fieldRef.colSpan || "";
                                      const renderedField = renderFields([field])[0];

                                      return wrapperClass ? (
                                        <div key={fieldIdx} className={wrapperClass}>
                                          {renderedField}
                                        </div>
                                      ) : (
                                        <div key={fieldIdx}>{renderedField}</div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </>
                            ) : (
                              /* Render without custom layout */
                              <div className="space-y-4">
                                {renderFields(section.fields)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="flex-shrink-0 border-t border-border bg-muted/30 p-3 sm:p-4">
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <div className="flex items-center justify-end gap-2 sm:gap-3">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={onClose} 
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-none"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="gap-2 min-w-[120px] flex-1 sm:flex-none"
                      size="sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          <span className="hidden sm:inline">Saving...</span>
                          <span className="sm:hidden">Save</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">{mode === "edit" ? `Update ${config.entity}` : `Create ${config.entity}`}</span>
                          <span className="sm:hidden">{mode === "edit" ? "Update" : "Create"}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
