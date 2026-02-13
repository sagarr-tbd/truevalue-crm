"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { DollarSign, Building2, User, Calendar, Loader2 } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

export interface KanbanDeal {
  id: string;
  name: string;
  value: number;
  currency?: string;
  companyName?: string;
  contactName?: string;
  expectedCloseDate?: string;
  ownerId?: string;
  stageId: string;
  initials?: string;
  tags?: Array<{ id: string; name: string; color?: string }>;
}

export interface KanbanStage {
  id: string;
  name: string;
  probability: number;
  order: number;
  isWon: boolean;
  isLost: boolean;
  color?: string;
}

export interface KanbanColumn {
  stage: KanbanStage;
  deals: KanbanDeal[];
  totalValue: number;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onDealMove: (dealId: string, newStageId: string) => void;
  onDealClick?: (deal: KanbanDeal) => void;
  isLoading?: boolean;
  currency?: string;
}

// Legacy props interface for backward compatibility
interface LegacyKanbanBoardProps {
  deals: Array<{
    id?: number | string;
    dealName?: string;
    name?: string;
    accountName?: string;
    companyName?: string;
    amount?: number;
    value?: number;
    stage?: string;
    stageId?: string;
    closeDate?: string;
    expectedCloseDate?: string;
    owner?: string;
    ownerId?: string;
  }>;
  onDealMove: (dealId: number | string, newStage: string) => void;
  onDealClick?: (deal: KanbanDeal) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Default stages for backward compatibility (when columns not provided)
const DEFAULT_STAGES: KanbanStage[] = [
  { id: "prospecting", name: "Prospecting", probability: 10, order: 1, isWon: false, isLost: false, color: "#3B82F6" },
  { id: "qualification", name: "Qualification", probability: 30, order: 2, isWon: false, isLost: false, color: "#8B5CF6" },
  { id: "proposal", name: "Proposal", probability: 50, order: 3, isWon: false, isLost: false, color: "#F59E0B" },
  { id: "negotiation", name: "Negotiation", probability: 70, order: 4, isWon: false, isLost: false, color: "#EF4444" },
  { id: "closed_won", name: "Closed Won", probability: 100, order: 5, isWon: true, isLost: false, color: "#10B981" },
];

// Stage gradients based on probability
const getStageGradient = (stage: KanbanStage): string => {
  if (stage.isWon) {
    return "linear-gradient(to right, #10B981, #059669)";
  }
  if (stage.isLost) {
    return "linear-gradient(to right, #EF4444, #DC2626)";
  }
  
  const colors: Record<number, string> = {
    1: "linear-gradient(to right, hsl(var(--chart-1)), hsl(var(--chart-2)))",
    2: "linear-gradient(to right, hsl(var(--chart-2)), hsl(var(--chart-3)))",
    3: "linear-gradient(to right, hsl(var(--chart-3)), hsl(var(--chart-4)))",
    4: "linear-gradient(to right, hsl(var(--chart-4)), hsl(var(--chart-5)))",
    5: "linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)))",
  };
  
  return colors[stage.order] || colors[1];
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatCurrency(value: number, currency: string = "USD"): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

// =============================================================================
// DEAL CARD COMPONENT
// =============================================================================

function DealCard({ 
  deal, 
  isDragging,
  onClick,
  currency = "USD",
}: { 
  deal: KanbanDeal; 
  isDragging?: boolean;
  onClick?: () => void;
  currency?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging
    if (!isSortableDragging && onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`p-4 cursor-grab active:cursor-grabbing bg-background hover:shadow-lg transition-all border border-border ${
          isDragging || isSortableDragging ? "opacity-50 scale-105" : ""
        }`}
        onClick={handleClick}
      >
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-foreground line-clamp-2">
              {deal.name}
            </h4>
            {deal.companyName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{deal.companyName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-bold text-primary">
                {formatCurrency(deal.value, currency)}
              </span>
            </div>
            {deal.expectedCloseDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(deal.expectedCloseDate).toLocaleDateString("en-US", { 
                    month: "short", 
                    day: "numeric" 
                  })}
                </span>
              </div>
            )}
          </div>

          {deal.contactName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{deal.contactName}</span>
            </div>
          )}

          {deal.tags && deal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {deal.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 text-[10px] rounded-full"
                  style={{ 
                    backgroundColor: `${tag.color}20`, 
                    color: tag.color 
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {deal.tags.length > 2 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground">
                  +{deal.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// =============================================================================
// KANBAN COLUMN COMPONENT
// =============================================================================

function KanbanColumnComponent({ 
  column,
  onDealClick,
  currency,
}: { 
  column: KanbanColumn;
  onDealClick?: (deal: KanbanDeal) => void;
  currency?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.stage.id,
  });

  const gradient = getStageGradient(column.stage);

  return (
    <div className="flex flex-col h-full min-w-[280px]">
      {/* Column Header */}
      <div 
        className="p-4 rounded-t-lg text-white shadow-md"
        style={{ background: gradient }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{column.stage.name}</h3>
          <span className="px-2 py-1 rounded-full bg-white/20 text-sm font-semibold">
            {column.deals.length}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold opacity-90">
            {formatCurrency(column.totalValue, currency)}
          </p>
          {column.stage.probability < 100 && (
            <span className="text-xs opacity-75">
              {column.stage.probability}% prob
            </span>
          )}
        </div>
      </div>

      {/* Droppable Area */}
      <div 
        ref={setNodeRef} 
        className={`flex-1 p-2 rounded-b-lg min-h-[400px] space-y-2 overflow-y-auto transition-colors ${
          isOver ? "bg-primary/10 border-2 border-primary border-dashed" : "bg-muted/30"
        }`}
      >
        <SortableContext 
          items={column.deals.map((d) => d.id)} 
          strategy={verticalListSortingStrategy}
        >
          {column.deals.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
              Drop deals here
            </div>
          ) : (
            column.deals.map((deal) => (
              <DealCard 
                key={deal.id} 
                deal={deal}
                onClick={() => onDealClick?.(deal)}
                currency={currency}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN KANBAN BOARD COMPONENT
// =============================================================================

export function KanbanBoard(props: KanbanBoardProps | LegacyKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Detect if we're using the new or legacy props
  const isNewProps = 'columns' in props;
  
  // Build columns from props
  let columns: KanbanColumn[];
  let onDealMove: (dealId: string, newStageId: string) => void;
  let onDealClick: ((deal: KanbanDeal) => void) | undefined;
  let currency = "USD";
  let isLoading = false;

  if (isNewProps) {
    const newProps = props as KanbanBoardProps;
    columns = newProps.columns;
    onDealMove = newProps.onDealMove;
    onDealClick = newProps.onDealClick;
    currency = newProps.currency || "USD";
    isLoading = newProps.isLoading || false;
  } else {
    // Legacy mode - build columns from flat deals array
    const legacyProps = props as LegacyKanbanBoardProps;
    const deals = legacyProps.deals;
    
    // Convert legacy deals to KanbanDeal format
    const kanbanDeals: KanbanDeal[] = deals.map(d => ({
      id: String(d.id || ''),
      name: d.dealName || d.name || '',
      value: d.amount || d.value || 0,
      companyName: d.accountName || d.companyName,
      expectedCloseDate: d.closeDate || d.expectedCloseDate,
      ownerId: d.owner || d.ownerId,
      stageId: d.stage || d.stageId || '',
    }));

    // Group by stage name (legacy uses stage names, not IDs)
    columns = DEFAULT_STAGES.map(stage => {
      const stageDeals = kanbanDeals.filter(d => 
        d.stageId.toLowerCase() === stage.name.toLowerCase() ||
        d.stageId.toLowerCase().replace(/\s+/g, '_') === stage.id
      );
      return {
        stage,
        deals: stageDeals,
        totalValue: stageDeals.reduce((sum, d) => sum + d.value, 0),
      };
    });

    onDealMove = (dealId: string, newStageId: string) => {
      // Find the stage name from ID for legacy compatibility
      const stage = DEFAULT_STAGES.find(s => s.id === newStageId);
      const stageName = stage?.name || newStageId;
      legacyProps.onDealMove(dealId, stageName);
    };

    onDealClick = legacyProps.onDealClick;
  }

  // Get all deals for drag overlay
  const allDeals = columns.flatMap(col => col.deals);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const dealId = active.id as string;
    const newStageId = over.id as string;

    // Check if we dropped over a stage column
    const isStageColumn = columns.some(col => col.stage.id === newStageId);
    
    if (isStageColumn) {
      // Find the deal and update if stage changed
      const deal = allDeals.find((d) => d.id === dealId);
      if (deal && deal.stageId !== newStageId) {
        onDealMove(dealId, newStageId);
      }
    }

    setActiveId(null);
  };

  const activeDeal = activeId ? allDeals.find((d) => d.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumnComponent
            key={column.stage.id}
            column={column}
            onDealClick={onDealClick}
            currency={currency}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <Card className="p-4 bg-background border-2 border-primary shadow-2xl rotate-3 scale-105 w-[260px]">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground line-clamp-2">
                  {activeDeal.name}
                </h4>
                {activeDeal.companyName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{activeDeal.companyName}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-bold text-primary">
                  {formatCurrency(activeDeal.value, currency)}
                </span>
              </div>
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Export types for external use
export type { KanbanBoardProps, LegacyKanbanBoardProps };
