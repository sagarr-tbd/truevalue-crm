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
import { DollarSign, Building2, User, Calendar } from "lucide-react";

interface Deal {
  id?: number;
  dealName?: string;
  accountName?: string;
  amount?: number;
  stage?: string;
  closeDate?: string;
  owner?: string;
  [key: string]: any;
}

interface KanbanColumnProps {
  stage: string;
  deals: Deal[];
  gradient: string;
  count: number;
  value: number;
}

interface KanbanBoardProps {
  deals: Deal[];
  onDealMove: (dealId: number, newStage: string) => void;
  onDealClick?: (deal: Deal) => void;
}

const STAGES = [
  { 
    id: "Prospecting", 
    label: "Prospecting", 
    gradient: "linear-gradient(to right, hsl(var(--chart-1)), hsl(var(--chart-2)))"
  },
  { 
    id: "Qualified", 
    label: "Qualified", 
    gradient: "linear-gradient(to right, hsl(var(--chart-2)), hsl(var(--chart-3)))"
  },
  { 
    id: "Proposal", 
    label: "Proposal", 
    gradient: "linear-gradient(to right, hsl(var(--chart-3)), hsl(var(--chart-4)))"
  },
  { 
    id: "Negotiation", 
    label: "Negotiation", 
    gradient: "linear-gradient(to right, hsl(var(--chart-4)), hsl(var(--chart-5)))"
  },
  { 
    id: "Closed Won", 
    label: "Closed Won", 
    gradient: "linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)))"
  },
];

function DealCard({ deal, isDragging }: { deal: Deal; isDragging?: boolean }) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: `${deal.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`p-4 cursor-grab active:cursor-grabbing bg-background hover:shadow-lg transition-all border border-border ${
          isDragging || isSortableDragging ? "opacity-50" : ""
        }`}
      >
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-foreground line-clamp-2">
              {deal.dealName}
            </h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{deal.accountName}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-bold text-primary">
                {deal.amount ? formatCurrency(deal.amount) : "$0"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{deal.closeDate ? new Date(deal.closeDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}</span>
            </div>
          </div>

          {deal.owner && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{deal.owner}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function KanbanColumn({ stage, stageId, deals, gradient, count, value }: KanbanColumnProps & { stageId: string }) {
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const { setNodeRef } = useDroppable({
    id: stageId,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div 
        className="p-4 rounded-t-lg text-white shadow-md"
        style={{ background: gradient }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{stage}</h3>
          <span className="px-2 py-1 rounded-full bg-white/20 text-sm font-semibold">
            {count}
          </span>
        </div>
        <p className="text-sm font-semibold opacity-90">
          {formatCurrency(value)}
        </p>
      </div>

      {/* Droppable Area */}
      <div ref={setNodeRef} className="flex-1 p-2 bg-muted/30 rounded-b-lg min-h-[400px] space-y-2 overflow-y-auto">
        <SortableContext items={deals.map((d) => `${d.id}`)} strategy={verticalListSortingStrategy}>
          {deals.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
              Drop deals here
            </div>
          ) : (
            deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ deals, onDealMove, onDealClick }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group deals by stage
  const dealsByStage = STAGES.reduce((acc, stage) => {
    const stageDeals = deals.filter((deal) => deal.stage === stage.id);
    acc[stage.id] = {
      deals: stageDeals,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0),
    };
    return acc;
  }, {} as Record<string, { deals: Deal[]; count: number; value: number }>);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const dealId = parseInt(active.id as string);
    const newStage = over.id as string;

    // Check if we dropped over a stage column
    const isStageColumn = STAGES.some(s => s.id === newStage);
    
    if (isStageColumn) {
      // Find the deal and update if stage changed
      const deal = deals.find((d) => d.id === dealId);
      if (deal && deal.stage !== newStage) {
        onDealMove(dealId, newStage);
      }
    }

    setActiveId(null);
  };

  const activeDeal = activeId ? deals.find((d) => `${d.id}` === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const stageData = dealsByStage[stage.id];
          return (
            <KanbanColumn
              key={stage.id}
              stageId={stage.id}
              stage={stage.label}
              deals={stageData.deals}
              gradient={stage.gradient}
              count={stageData.count}
              value={stageData.value}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <Card className="p-4 bg-background border-2 border-primary shadow-2xl rotate-3 scale-105">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground line-clamp-2">
                  {activeDeal.dealName}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{activeDeal.accountName}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-bold text-primary">
                  {activeDeal.amount ? `$${activeDeal.amount.toLocaleString()}` : "$0"}
                </span>
              </div>
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
