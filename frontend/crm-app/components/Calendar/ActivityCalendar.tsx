"use client";

import { useMemo, useCallback, useState } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  type: "task" | "call" | "meeting";
  status?: string;
  priority?: string;
  allDay?: boolean;
}

interface ActivityCalendarProps {
  tasks?: any[];
  calls?: any[];
  meetings?: any[];
  onEventClick?: (event: CalendarEvent) => void;
  onEventCreate?: (start: Date, end: Date, view: string) => void;
}

export function ActivityCalendar({
  tasks = [],
  calls = [],
  meetings = [],
  onEventClick,
  onEventCreate,
}: ActivityCalendarProps) {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  // Convert activities to calendar events
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Add tasks
    tasks.forEach((task) => {
      if (task.dueDate) {
        calendarEvents.push({
          id: task.id,
          title: task.title || "Untitled Task",
          start: new Date(task.dueDate),
          end: new Date(task.dueDate),
          type: "task",
          status: task.status,
          priority: task.priority,
          allDay: true,
        });
      }
    });

    // Add calls
    calls.forEach((call) => {
      if (call.date) {
        const dateTimeStr = `${call.date} ${call.time || "09:00 AM"}`;
        const start = new Date(dateTimeStr);
        const end = new Date(start);
        end.setHours(end.getHours() + 1); // Default 1 hour duration

        calendarEvents.push({
          id: call.id,
          title: call.subject || "Untitled Call",
          start,
          end,
          type: "call",
          status: call.status,
        });
      }
    });

    // Add meetings
    meetings.forEach((meeting) => {
      if (meeting.date) {
        const dateTimeStr = `${meeting.date} ${meeting.time || "09:00 AM"}`;
        const start = new Date(dateTimeStr);
        const end = new Date(start);
        
        // Parse duration if available (e.g., "60 min")
        if (meeting.duration) {
          const durationMatch = meeting.duration.match(/(\d+)/);
          if (durationMatch) {
            end.setMinutes(end.getMinutes() + parseInt(durationMatch[1]));
          }
        } else {
          end.setHours(end.getHours() + 1); // Default 1 hour
        }

        calendarEvents.push({
          id: meeting.id,
          title: meeting.title || "Untitled Meeting",
          start,
          end,
          type: "meeting",
          status: meeting.status,
        });
      }
    });

    return calendarEvents;
  }, [tasks, calls, meetings]);

  // Event style based on type
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    let backgroundColor = "hsl(var(--primary))";
    let borderColor = "hsl(var(--primary))";

    switch (event.type) {
      case "task":
        backgroundColor = "hsl(var(--chart-1))";
        borderColor = "hsl(var(--chart-1))";
        break;
      case "call":
        backgroundColor = "hsl(var(--chart-3))";
        borderColor = "hsl(var(--chart-3))";
        break;
      case "meeting":
        backgroundColor = "hsl(var(--chart-2))";
        borderColor = "hsl(var(--chart-2))";
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: "1px",
        borderStyle: "solid",
        borderRadius: "4px",
        color: "white",
        fontSize: "0.875rem",
        padding: "2px 4px",
      },
    };
  }, []);

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      if (onEventClick) {
        onEventClick(event);
      }
    },
    [onEventClick]
  );

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      if (onEventCreate) {
        onEventCreate(start, end, view);
      }
    },
    [onEventCreate, view]
  );

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => {
    return (
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">{label}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => onNavigate("PREV")}
              className="p-2 hover:bg-background rounded-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate("TODAY")}
              className="px-3 py-1.5 hover:bg-background rounded-md text-sm font-medium transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => onNavigate("NEXT")}
              className="p-2 hover:bg-background rounded-md transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => onView("month")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "month"
                  ? "bg-background text-brand-teal shadow-sm"
                  : "hover:bg-background"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => onView("week")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "week"
                  ? "bg-background text-brand-teal shadow-sm"
                  : "hover:bg-background"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => onView("day")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "day"
                  ? "bg-background text-brand-teal shadow-sm"
                  : "hover:bg-background"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => onView("agenda")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "agenda"
                  ? "bg-background text-brand-teal shadow-sm"
                  : "hover:bg-background"
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
        view={view}
        date={date}
        onView={handleViewChange}
        onNavigate={handleNavigate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        eventPropGetter={eventStyleGetter}
        selectable
        popup
        components={{
          toolbar: CustomToolbar,
        }}
      />
    </Card>
  );
}
