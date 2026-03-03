"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ActivityCalendar } from "@/components/Calendar";
import { useActivitiesV2 } from "@/lib/queries/useActivitiesV2";
import type { ActivityV2 } from "@/lib/api/activitiesV2";
import { Card } from "@/components/ui/card";
import { Calendar, ListTodo, Phone, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const mapToCalendarFormat = (activities: ActivityV2[]) =>
  activities.map((a) => ({
    id: a.id,
    title: a.subject,
    subject: a.subject,
    dueDate: a.due_date || a.start_time || undefined,
    date: a.due_date?.split("T")[0] || a.start_time?.split("T")[0] || undefined,
    time: a.start_time
      ? new Date(a.start_time).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : undefined,
    duration: a.duration_minutes ? `${a.duration_minutes} min` : undefined,
    status: a.status,
    priority: a.priority,
    type: a.activity_type,
  }));

export default function CalendarV2Page() {
  const router = useRouter();
  const { data: tasksResponse, isLoading: loadingTasks } = useActivitiesV2({
    activity_type: "task",
    page_size: 100,
  });
  const { data: callsResponse, isLoading: loadingCalls } = useActivitiesV2({
    activity_type: "call",
    page_size: 100,
  });
  const { data: meetingsResponse, isLoading: loadingMeetings } = useActivitiesV2({
    activity_type: "meeting",
    page_size: 100,
  });

  const isLoading = loadingTasks || loadingCalls || loadingMeetings;

  const tasks = useMemo(
    () => mapToCalendarFormat(tasksResponse?.results ?? []),
    [tasksResponse]
  );
  const calls = useMemo(
    () => mapToCalendarFormat(callsResponse?.results ?? []),
    [callsResponse]
  );
  const meetings = useMemo(
    () => mapToCalendarFormat(meetingsResponse?.results ?? []),
    [meetingsResponse]
  );

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(["tasks", "calls", "meetings"])
  );

  const filteredTasks = selectedTypes.has("tasks") ? tasks : [];
  const filteredCalls = selectedTypes.has("calls") ? calls : [];
  const filteredMeetings = selectedTypes.has("meetings") ? meetings : [];

  const toggleType = (type: string) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const handleEventClick = (event: { id: number | string; type: string }) => {
    switch (event.type) {
      case "task":
        router.push(`/activities-v2/tasks/${event.id}`);
        break;
      case "call":
        router.push(`/activities-v2/calls/${event.id}`);
        break;
      case "meeting":
        router.push(`/activities-v2/meetings/${event.id}`);
        break;
    }
  };

  const handleEventCreate = (_start: Date, _end: Date, _view: string) => {
    // Calendar click-to-create not implemented for V2 yet
  };

  const stats = useMemo(() => {
    const now = new Date();
    const upcomingTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) > now
    ).length;
    const upcomingCalls = calls.filter(
      (c) => c.dueDate && new Date(c.dueDate) > now
    ).length;
    const upcomingMeetings = meetings.filter(
      (m) => m.dueDate && new Date(m.dueDate) > now
    ).length;

    return {
      tasks: upcomingTasks,
      calls: upcomingCalls,
      meetings: upcomingMeetings,
      total: upcomingTasks + upcomingCalls + upcomingMeetings,
    };
  }, [tasks, calls, meetings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Activities Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your tasks, calls, and meetings
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Tasks</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.tasks}
                </p>
              </div>
              <div className="p-3 bg-chart-1/10 rounded-lg">
                <ListTodo
                  className="h-6 w-6"
                  style={{ color: "hsl(var(--chart-1))" }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Calls</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.calls}
                </p>
              </div>
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <Phone
                  className="h-6 w-6"
                  style={{ color: "hsl(var(--chart-3))" }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Upcoming Meetings
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.meetings}
                </p>
              </div>
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <Users
                  className="h-6 w-6"
                  style={{ color: "hsl(var(--chart-2))" }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Activities
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filter Buttons */}
      <Card className="p-4 border border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            Show:
          </span>
          <button
            onClick={() => toggleType("tasks")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedTypes.has("tasks")
                ? "bg-chart-1/20 text-foreground border-2"
                : "bg-muted text-muted-foreground"
            }`}
            style={
              selectedTypes.has("tasks")
                ? { borderColor: "hsl(var(--chart-1))" }
                : {}
            }
          >
            <ListTodo className="h-4 w-4" />
            Tasks
          </button>
          <button
            onClick={() => toggleType("calls")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedTypes.has("calls")
                ? "bg-chart-3/20 text-foreground border-2"
                : "bg-muted text-muted-foreground"
            }`}
            style={
              selectedTypes.has("calls")
                ? { borderColor: "hsl(var(--chart-3))" }
                : {}
            }
          >
            <Phone className="h-4 w-4" />
            Calls
          </button>
          <button
            onClick={() => toggleType("meetings")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedTypes.has("meetings")
                ? "bg-chart-2/20 text-foreground border-2"
                : "bg-muted text-muted-foreground"
            }`}
            style={
              selectedTypes.has("meetings")
                ? { borderColor: "hsl(var(--chart-2))" }
                : {}
            }
          >
            <Users className="h-4 w-4" />
            Meetings
          </button>
        </div>
      </Card>

      {/* Calendar */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading activities...</span>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ActivityCalendar
            tasks={filteredTasks}
            calls={filteredCalls}
            meetings={filteredMeetings}
            onEventClick={handleEventClick}
            onEventCreate={handleEventCreate}
          />
        </motion.div>
      )}
    </div>
  );
}
