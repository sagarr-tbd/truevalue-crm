"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DynamicForm } from "@/components/DynamicForm";
import { Loader2, X, User, Building2, MapPin, Award, FileText, Edit3 } from "lucide-react";
import type { LeadV2, CreateLeadV2Input } from "@/lib/api/leadsV2";
import { toast } from "sonner";
import { useFormSchema } from "@/lib/queries/useFormsV2";

export interface LeadV2FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeadV2Input) => Promise<void>;
  initialData?: LeadV2 | null;
  mode?: "add" | "edit";
}

export function LeadV2FormDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "add",
}: LeadV2FormDrawerProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  
  const { data: formSchema } = useFormSchema("lead", "create");
  
  // Memoize sections to prevent re-render issues (must be declared before use)
  const formSections = useMemo(() => {
    return formSchema?.schema?.sections || [];
  }, [formSchema?.schema?.sections]);
  
  const defaultValues = useMemo(() => {
    if (initialData?.entity_data) {
      return {
        dynamicFields: initialData.entity_data
      };
    }
    return {
      dynamicFields: {}
    };
  }, [initialData]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    setError,
  } = useForm({
    defaultValues,
    mode: "all",
  });
  
  // Set first section as active when form loads
  useEffect(() => {
    if (isOpen && formSections.length > 0 && !activeSection) {
      setActiveSection(formSections[0].id);
    }
  }, [isOpen, formSections, activeSection]);

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
      // Reset to first section dynamically
      if (formSections.length > 0) {
        setActiveSection(formSections[0].id);
      }
    }
  }, [defaultValues, isOpen, reset, formSections]);

  const handleFormSubmit = async (formData: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const flattenedData = formData.dynamicFields || formData;
      
      const cleanedData: Record<string, any> = {};
      Object.keys(flattenedData).forEach((key) => {
        const value = flattenedData[key];
        if (value !== "" || value === false || value === 0) {
          cleanedData[key] = value;
        }
      });
      
      const v2Data: CreateLeadV2Input = {
        status: initialData?.status || 'new',
        entity_data: cleanedData,
      };

      await onSubmit(v2Data);
      reset();
      onClose();
    } catch (error: any) {
      if (error?.response?.data?.error?.details?.entity_data) {
        const backendErrors = error.response.data.error.details.entity_data;
        
        Object.keys(backendErrors).forEach((fieldName) => {
          const errorMessage = backendErrors[fieldName];
          setError(`dynamicFields.${fieldName}` as any, {
            type: "manual",
            message: typeof errorMessage === 'string' ? errorMessage : String(errorMessage),
          });
        });
        
        const errorCount = Object.keys(backendErrors).length;
        toast.error(
          `Validation failed: ${errorCount} field${errorCount > 1 ? 's' : ''} need attention`
        );
      } else {
        const errorMessage = error?.response?.data?.error?.message || 
                            error?.message || 
                            "Failed to save lead";
        toast.error(errorMessage);
        console.error("Form submission error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSectionIcon = (sectionId: string) => {
    // Map common section IDs to icons dynamically
    const iconMap: Record<string, any> = {
      contact_info: User,
      contact: User,
      basic_info: User,
      company_info: Building2,
      company: Building2,
      address: MapPin,
      address_info: MapPin,
      qualification: Award,
      lead_qualification: Award,
      additional: FileText,
      notes: FileText,
      description: FileText,
    };
    
    return iconMap[sectionId] || User; // Default to User icon
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

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full z-[10000] bg-white shadow-2xl border-l border-border flex flex-col overflow-hidden w-full sm:w-[800px] md:w-[900px] lg:w-[1000px]"
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {mode === "add" ? "Create New Lead" : "Edit Lead"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mode === "add"
                        ? "Fill in the lead information below"
                        : "Update the lead information"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {mode === "add" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/sales-v2/leads/layout')}
                        className="hidden sm:flex"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Layout
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Sections (Desktop) */}
                <div className="hidden lg:block w-56 bg-muted/30 border-r border-border p-4 flex-shrink-0">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Sections
                  </h3>
                  <nav className="space-y-1">
                    {formSections.map((section: any) => {
                      const Icon = getSectionIcon(section.id);
                      const isActive = activeSection === section.id;
                      
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => setActiveSection(section.id)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                            ${isActive
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }
                          `}
                        >
                          <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary-foreground" : ""}`} />
                          <span className="flex-1 text-left">{section.title}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Right Content - Form Fields */}
                <div className="flex-1 overflow-y-auto bg-white">
                  <div className="p-4 sm:p-5 lg:p-6">
                    <DynamicForm
                      entityType="lead"
                      formType="create"
                      register={register}
                      errors={errors}
                      watch={watch}
                      setValue={setValue}
                      isSubmitting={isSubmitting}
                      showEditLayout={false}
                      activeSection={activeSection}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t bg-muted/30 p-3 sm:p-4">
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
                    className="flex-1 sm:flex-none min-w-[120px]"
                    size="sm"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "add" ? "Create Lead" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
