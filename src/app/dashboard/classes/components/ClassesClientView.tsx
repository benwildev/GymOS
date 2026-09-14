"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  CalendarDays, 
  Clock, 
  Users, 
  Search, 
  Plus, 
  CalendarPlus, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Eye, 
  Power, 
  Filter 
} from "lucide-react";
import { CreateClassDialog } from "./CreateClassDialog";
import { EditClassDialog } from "./EditClassDialog";
import { CreateScheduleDialog } from "./CreateScheduleDialog";
import { SessionRosterDialog } from "./SessionRosterDialog";
import { toggleArchiveClass } from "@/actions/class.actions";
import { ClassStatus, ScheduleStatus } from "@/types/enums";
import { useRouter } from "next/navigation";

interface ClassesClientViewProps {
  initialClasses: any[];
  initialSchedules: any[];
}

export function ClassesClientView({ initialClasses, initialSchedules }: ClassesClientViewProps) {
  const [tab, setTab] = useState("schedules");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  // Modals state
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [rosterDialogOpen, setRosterDialogOpen] = useState(false);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);

  const router = useRouter();

  // Filter schedules
  const filteredSchedules = initialSchedules.filter((s) => {
    if (search.trim() && !s.class.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "ALL" && s.status !== statusFilter) {
      return false;
    }
    if (dateFilter) {
      const scheduleDateStr = new Date(s.date).toISOString().split("T")[0];
      if (scheduleDateStr !== dateFilter) return false;
    }
    return true;
  });

  // Filter classes
  const filteredClasses = initialClasses.filter((c) => {
    if (search.trim() && !c.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "ALL" && c.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleToggleArchive = async (classId: string) => {
    setIsTogglingId(classId);
    try {
      await toggleArchiveClass(classId);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingId(null);
    }
  };

  const activeClasses = initialClasses.filter((c) => c.status === ClassStatus.ACTIVE);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Classes & Schedules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your gym classes, schedule training sessions, and monitor member bookings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <CreateScheduleDialog
            classes={activeClasses}
            trigger={
              <Button variant="outline" className="gap-2 shadow-2xs">
                <CalendarPlus className="w-4 h-4 text-emerald-600" />
                Schedule Session
              </Button>
            }
          />
          <CreateClassDialog
            trigger={
              <Button className="bg-black hover:bg-gray-800 text-white gap-2 shadow-2xs">
                <Plus className="w-4 h-4" />
                New Class
              </Button>
            }
          />
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <Tabs value={tab} onValueChange={setTab} className="w-auto">
          <TabsList className="bg-gray-100/80 p-1">
            <TabsTrigger value="schedules" className="text-xs font-semibold px-4">
              Sessions ({filteredSchedules.length})
            </TabsTrigger>
            <TabsTrigger value="catalog" className="text-xs font-semibold px-4">
              Class Catalog ({filteredClasses.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-white"
            />
          </div>

          {tab === "schedules" && (
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs h-9 w-auto bg-white"
            />
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-white text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {(search || dateFilter || statusFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-9"
              onClick={() => {
                setSearch("");
                setDateFilter("");
                setStatusFilter("ALL");
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* TAB 1: SESSIONS & SCHEDULES */}
      {tab === "schedules" && (
        <div className="space-y-4">
          {filteredSchedules.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-dashed bg-white/50">
              <CalendarDays className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <div className="text-base font-semibold text-gray-800">No scheduled sessions found</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search || dateFilter
                  ? "Try changing your search keywords or date filter."
                  : "Start scheduling your gym sessions for members to book."}
              </p>
              <div className="mt-4">
                <CreateScheduleDialog
                  classes={activeClasses}
                  trigger={
                    <Button size="sm" className="bg-black hover:bg-gray-800 text-white gap-2">
                      <CalendarPlus className="w-4 h-4" />
                      Add Schedule
                    </Button>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSchedules.map((schedule) => {
                const isCancelled = schedule.status === ScheduleStatus.CANCELLED;
                const isFull = schedule.isFull;
                const percentage = Math.min(100, Math.round((schedule.bookedCount / schedule.capacity) * 100));

                return (
                  <Card
                    key={schedule.id}
                    className={`shadow-2xs transition-all hover:shadow-md ${
                      isCancelled ? "border-red-200 bg-red-50/20 opacity-75" : "border-gray-200 bg-white"
                    }`}
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-base font-bold text-gray-900 leading-tight">
                              {schedule.class.name}
                            </span>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {schedule.class.duration} minutes session
                            </div>
                          </div>

                          {isCancelled ? (
                            <Badge variant="outline" className="text-[10px] text-red-700 bg-red-50 border-red-200 shrink-0">
                              CANCELLED
                            </Badge>
                          ) : isFull ? (
                            <Badge variant="outline" className="text-[10px] text-rose-700 bg-rose-50 border-rose-200 shrink-0">
                              FULL
                            </Badge>
                          ) : schedule.bookedCount >= schedule.capacity * 0.8 ? (
                            <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200 shrink-0">
                              ALMOST FULL
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200 shrink-0">
                              AVAILABLE
                            </Badge>
                          )}
                        </div>

                        {/* Timing & Date */}
                        <div className="rounded-lg border bg-gray-50/70 p-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-gray-800">
                            <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
                            {new Date(schedule.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1 font-mono font-medium text-gray-700">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>

                        {/* Capacity progress */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> Booked Spots
                            </span>
                            <span className="font-semibold text-gray-900">
                              {schedule.bookedCount} / {schedule.capacity}{" "}
                              <span className="text-[11px] text-muted-foreground font-normal">
                                ({schedule.availableSpots} left)
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isCancelled
                                  ? "bg-gray-300"
                                  : isFull
                                  ? "bg-rose-500"
                                  : percentage >= 80
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-2 border-t flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs font-semibold gap-1.5"
                          onClick={() => {
                            setSelectedScheduleId(schedule.id);
                            setRosterDialogOpen(true);
                          }}
                        >
                          <Users className="w-3.5 h-3.5" />
                          View Bookings ({schedule.bookedCount})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASS CATALOG */}
      {tab === "catalog" && (
        <div className="border rounded-xl bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Class Name</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Default Capacity</th>
                  <th className="py-3 px-4">Upcoming Sessions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No classes found in catalog. Create your first class!
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        <div>{c.name}</div>
                        {c.description && (
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs font-normal">
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{c.duration} mins</td>
                      <td className="py-3.5 px-4 text-gray-600">{c.capacity} members</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {c._count?.schedules || 0} scheduled
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold py-0 px-2 ${
                            c.status === ClassStatus.ACTIVE
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-gray-100 text-gray-500 border-gray-300"
                          }`}
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-gray-600 hover:text-black gap-1"
                            onClick={() => {
                              setEditingClass(c);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-8 text-xs ${
                              c.status === ClassStatus.ACTIVE
                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            onClick={() => handleToggleArchive(c.id)}
                            disabled={isTogglingId === c.id}
                          >
                            <Power className="w-3.5 h-3.5 mr-1" />
                            {c.status === ClassStatus.ACTIVE ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Class Dialog */}
      <EditClassDialog
        gymClass={editingClass}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Session Roster Dialog */}
      <SessionRosterDialog
        scheduleId={selectedScheduleId}
        open={rosterDialogOpen}
        onOpenChange={setRosterDialogOpen}
      />
    </div>
  );
}
