"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ActivityCalendar } from "@/components/Calendar";
import { useTasks } from "@/lib/queries/useTasks";
import { useCalls } from "@/lib/queries/useCalls";
import { useMeetings } from "@/lib/queries/useMeetings";
import { Card } from "@/components/ui/card";
import { Calendar, ListTodo, Phone, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function CalendarPage() {
  const router = useRouter();
  const { data: tasks = [] } = useTasks();
  const { data: calls = [] } = useCalls();
  const { data: meetings = [] } = useMeetings();

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(["tasks", "calls", "meetings"])
  );

  // Filter activities based on selected types
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

  const handleEventClick = (event: any) => {
    // Navigate to detail page based on type
    switch (event.type) {
      case "task":
        router.push(`/activities/tasks/${event.id}`);
        break;
      case "call":
        router.push(`/activities/calls/${event.id}`);
        break;
      case "meeting":
        router.push(`/activities/meetings/${event.id}`);
        break;
    }
  };

  const handleEventCreate = (start: Date, end: Date, view: string) => {
    // For now, just log - can open create modal later
    console.log("Create event:", { start, end, view });
  };

  const stats = useMemo(() => {
    const now = new Date();
    const upcomingTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) > now
    ).length;
    const upcomingCalls = calls.filter(
      (c) => c.date && new Date(c.date) > now
    ).length;
    const upcomingMeetings = meetings.filter(
      (m) => m.date && new Date(m.date) > now
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
                <ListTodo className="h-6 w-6" style={{ color: "hsl(var(--chart-1))" }} />
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
                <Phone className="h-6 w-6" style={{ color: "hsl(var(--chart-3))" }} />
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
                <p className="text-sm text-muted-foreground">Upcoming Meetings</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.meetings}
                </p>
              </div>
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <Users className="h-6 w-6" style={{ color: "hsl(var(--chart-2))" }} />
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
                <p className="text-sm text-muted-foreground">Total Activities</p>
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
    </div>
  );
}
