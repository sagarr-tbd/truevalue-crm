"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  GitBranch, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  GripVertical,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  usePipelines, 
  usePipeline,
  useCreatePipeline, 
  useUpdatePipeline, 
  useDeletePipeline,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
  useReorderStages,
} from "@/lib/queries/usePipelines";

// Form Schemas
const pipelineSchema = z.object({
  name: z.string().min(1, "Pipeline name is required"),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const stageSchema = z.object({
  name: z.string().min(1, "Stage name is required"),
  probability: z.number().min(0).max(100).optional(),
  color: z.string().optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
});

type PipelineFormData = z.infer<typeof pipelineSchema>;
type StageFormData = z.infer<typeof stageSchema>;

const STAGE_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
];

export default function PipelinesSettings() {
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<{ pipelineId: string; stageId?: string } | null>(null);

  // Queries
  const { data: pipelines, isLoading: isPipelinesLoading } = usePipelines();
  const { data: expandedPipelineData } = usePipeline(expandedPipeline || "");

  // Mutations
  const createPipeline = useCreatePipeline();
  const updatePipeline = useUpdatePipeline();
  const deletePipeline = useDeletePipeline();
  const createStage = useCreateStage();
  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();

  // Pipeline Form
  const pipelineForm = useForm<PipelineFormData>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: { name: "", description: "", isDefault: false },
  });

  // Stage Form
  const stageForm = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: { name: "", probability: 50, color: STAGE_COLORS[0], isWon: false, isLost: false },
  });

  // Handlers
  const handleCreatePipeline = pipelineForm.handleSubmit(async (data) => {
    try {
      await createPipeline.mutateAsync({
        name: data.name,
        description: data.description,
        isDefault: data.isDefault,
      });
      setShowCreateModal(false);
      pipelineForm.reset();
    } catch (error) {
      // Toast handled by mutation
    }
  });

  const handleEditPipeline = (pipelineId: string) => {
    const pipeline = pipelines?.find(p => p.id === pipelineId);
    if (pipeline) {
      setEditingPipelineId(pipelineId);
      pipelineForm.reset({
        name: pipeline.name,
        description: "", // description not available in list view
        isDefault: pipeline.isDefault,
      });
      setShowEditModal(true);
    }
  };

  const handleUpdatePipeline = pipelineForm.handleSubmit(async (data) => {
    if (!editingPipelineId) return;
    try {
      await updatePipeline.mutateAsync({
        id: editingPipelineId,
        data: {
          name: data.name,
          description: data.description,
          isDefault: data.isDefault,
        },
      });
      setShowEditModal(false);
      setEditingPipelineId(null);
      pipelineForm.reset();
    } catch (error) {
      // Toast handled by mutation
    }
  });

  const handleDeletePipeline = async () => {
    if (!editingPipelineId) return;
    try {
      await deletePipeline.mutateAsync(editingPipelineId);
      setShowDeleteModal(false);
      setEditingPipelineId(null);
    } catch (error) {
      // Toast handled by mutation
    }
  };

  const handleAddStage = (pipelineId: string) => {
    setEditingStage({ pipelineId });
    stageForm.reset({ name: "", probability: 50, color: STAGE_COLORS[0], isWon: false, isLost: false });
    setShowStageModal(true);
  };

  const handleEditStage = (pipelineId: string, stage: { id: string; name: string; probability: number; color?: string; isWon: boolean; isLost: boolean }) => {
    setEditingStage({ pipelineId, stageId: stage.id });
    stageForm.reset({
      name: stage.name,
      probability: stage.probability,
      color: stage.color || STAGE_COLORS[0],
      isWon: stage.isWon,
      isLost: stage.isLost,
    });
    setShowStageModal(true);
  };

  const handleSaveStage = stageForm.handleSubmit(async (data) => {
    if (!editingStage) return;
    try {
      if (editingStage.stageId) {
        // Update
        await updateStage.mutateAsync({
          pipelineId: editingStage.pipelineId,
          stageId: editingStage.stageId,
          data: {
            name: data.name,
            probability: data.probability,
            color: data.color,
            isWon: data.isWon,
            isLost: data.isLost,
          },
        });
      } else {
        // Create
        await createStage.mutateAsync({
          pipelineId: editingStage.pipelineId,
          data: {
            name: data.name,
            probability: data.probability,
            color: data.color,
            isWon: data.isWon,
            isLost: data.isLost,
          },
        });
      }
      setShowStageModal(false);
      setEditingStage(null);
      stageForm.reset();
    } catch (error) {
      // Toast handled by mutation
    }
  });

  const handleDeleteStage = async (pipelineId: string, stageId: string) => {
    try {
      await deleteStage.mutateAsync({ pipelineId, stageId });
    } catch (error) {
      // Toast handled by mutation
    }
  };

  if (isPipelinesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Sales Pipelines</h3>
              <p className="text-sm text-muted-foreground">
                Manage your sales pipelines and their stages
              </p>
            </div>
            <Button 
              onClick={() => {
                pipelineForm.reset({ name: "", description: "", isDefault: false });
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Pipeline
            </Button>
          </div>

          <div className="space-y-3">
            {pipelines?.map((pipeline) => (
              <div key={pipeline.id} className="border border-border rounded-lg overflow-hidden">
                {/* Pipeline Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedPipeline(expandedPipeline === pipeline.id ? null : pipeline.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple flex items-center justify-center">
                      <GitBranch className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{pipeline.name}</span>
                        {pipeline.isDefault && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pipeline.stageCount || 0} stages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPipeline(pipeline.id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPipelineId(pipeline.id);
                        setShowDeleteModal(true);
                      }}
                      disabled={pipeline.isDefault}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    {expandedPipeline === pipeline.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Pipeline Stages (Expanded) */}
                {expandedPipeline === pipeline.id && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-foreground">Stages</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddStage(pipeline.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Stage
                      </Button>
                    </div>
                    
                    {expandedPipelineData?.stages && expandedPipelineData.stages.length > 0 ? (
                      <div className="space-y-2">
                        {expandedPipelineData.stages.map((stage, index) => (
                          <div 
                            key={stage.id}
                            className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: stage.color || STAGE_COLORS[index % STAGE_COLORS.length] }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{stage.name}</span>
                                {stage.isWon && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                    Won
                                  </span>
                                )}
                                {stage.isLost && (
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                    Lost
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {stage.probability}% probability
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditStage(pipeline.id, stage)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteStage(pipeline.id, stage.id)}
                                disabled={stage.isWon || stage.isLost}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No stages yet. Add your first stage to get started.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {(!pipelines || pipelines.length === 0) && (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No pipelines yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first pipeline to start managing deals
                </p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Pipeline
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Pipeline Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Create Pipeline</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePipeline} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Pipeline Name
                </label>
                <input
                  type="text"
                  {...pipelineForm.register("name")}
                  placeholder="e.g., Sales Pipeline"
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    pipelineForm.formState.errors.name ? "border-destructive" : "border-border"
                  }`}
                />
                {pipelineForm.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {pipelineForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description (optional)
                </label>
                <textarea
                  {...pipelineForm.register("description")}
                  placeholder="Describe this pipeline..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...pipelineForm.register("isDefault")}
                  className="w-4 h-4 text-primary focus:ring-primary rounded"
                />
                <span className="text-sm text-foreground">Set as default pipeline</span>
              </label>
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPipeline.isPending}
                  className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                >
                  {createPipeline.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Pipeline
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pipeline Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Edit Pipeline</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPipelineId(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePipeline} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Pipeline Name
                </label>
                <input
                  type="text"
                  {...pipelineForm.register("name")}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    pipelineForm.formState.errors.name ? "border-destructive" : "border-border"
                  }`}
                />
                {pipelineForm.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {pipelineForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  {...pipelineForm.register("description")}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...pipelineForm.register("isDefault")}
                  className="w-4 h-4 text-primary focus:ring-primary rounded"
                />
                <span className="text-sm text-foreground">Set as default pipeline</span>
              </label>
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPipelineId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updatePipeline.isPending}
                  className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                >
                  {updatePipeline.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Pipeline Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Delete Pipeline</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEditingPipelineId(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this pipeline? All stages and associated deals will be affected.
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setEditingPipelineId(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeletePipeline}
                disabled={deletePipeline.isPending}
              >
                {deletePipeline.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Pipeline
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Modal (Create/Edit) */}
      {showStageModal && editingStage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">
                {editingStage.stageId ? "Edit Stage" : "Add Stage"}
              </h3>
              <button
                onClick={() => {
                  setShowStageModal(false);
                  setEditingStage(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Stage Name
                </label>
                <input
                  type="text"
                  {...stageForm.register("name")}
                  placeholder="e.g., Qualification"
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    stageForm.formState.errors.name ? "border-destructive" : "border-border"
                  }`}
                />
                {stageForm.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {stageForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Win Probability (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  {...stageForm.register("probability", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Stage Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {STAGE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => stageForm.setValue("color", color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        stageForm.watch("color") === color
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {stageForm.watch("color") === color && (
                        <Check className="h-4 w-4 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...stageForm.register("isWon")}
                    onChange={(e) => {
                      stageForm.setValue("isWon", e.target.checked);
                      if (e.target.checked) {
                        stageForm.setValue("isLost", false);
                        stageForm.setValue("probability", 100);
                      }
                    }}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <span className="text-sm text-foreground">Won Stage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...stageForm.register("isLost")}
                    onChange={(e) => {
                      stageForm.setValue("isLost", e.target.checked);
                      if (e.target.checked) {
                        stageForm.setValue("isWon", false);
                        stageForm.setValue("probability", 0);
                      }
                    }}
                    className="w-4 h-4 text-red-600 focus:ring-red-500 rounded"
                  />
                  <span className="text-sm text-foreground">Lost Stage</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowStageModal(false);
                    setEditingStage(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createStage.isPending || updateStage.isPending}
                  className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                >
                  {(createStage.isPending || updateStage.isPending) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingStage.stageId ? "Save Changes" : "Add Stage"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
