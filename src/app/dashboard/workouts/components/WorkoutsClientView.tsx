"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dumbbell, 
  Search, 
  Plus, 
  Calendar, 
  User, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  Flame 
} from "lucide-react";
import { WorkoutPlanBuilderDialog } from "./WorkoutPlanBuilderDialog";
import { PlanStatus } from "@/types/enums";
import { getWorkoutPlanDetails } from "@/actions/workout.actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WorkoutsClientViewProps {
  initialPlans: any[];
  members: any[];
}

export function WorkoutsClientView({ initialPlans, members }: WorkoutsClientViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create / Edit Builder Dialog state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  // View Details Modal state
  const [viewingPlan, setViewingPlan] = useState<any | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const filteredPlans = initialPlans.filter((plan) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = plan.name.toLowerCase().includes(q);
      const matchMember = plan.user?.name?.toLowerCase().includes(q);
      const matchEmail = plan.user?.email?.toLowerCase().includes(q);
      const matchMemberId = plan.user?.profile?.memberId?.toLowerCase().includes(q);
      if (!matchName && !matchMember && !matchEmail && !matchMemberId) return false;
    }

    if (statusFilter !== "ALL" && plan.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const handleOpenEdit = async (plan: any) => {
    // Fetch full plan with exercises
    try {
      const res = await getWorkoutPlanDetails(plan.id);
      if (res.plan) {
        setEditingPlan(res.plan);
        setBuilderOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenView = async (planId: string) => {
    setLoadingDetails(true);
    setViewModalOpen(true);
    try {
      const res = await getWorkoutPlanDetails(planId);
      if (res.plan) {
        setViewingPlan(res.plan);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Workout Plans</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Assign custom workout routines, set exercises, reps, sets, and weights for members.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingPlan(null);
            setBuilderOpen(true);
          }}
          className="bg-black hover:bg-gray-800 text-white gap-2 shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          Create Workout Plan
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-lg">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search member or plan name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-white text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="COMPLETED">Completed</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {(search || statusFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-9"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
            >
              Reset
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground font-medium">
          Showing {filteredPlans.length} plan{filteredPlans.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed bg-white/50">
          <Dumbbell className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <div className="text-base font-semibold text-gray-800">No workout plans found</div>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "ALL"
              ? "Try changing your search filter."
              : "Design and assign your first workout program to a gym member."}
          </p>
          <div className="mt-4">
            <Button
              onClick={() => {
                setEditingPlan(null);
                setBuilderOpen(true);
              }}
              size="sm"
              className="bg-black hover:bg-gray-800 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => {
            const isActive = plan.status === PlanStatus.ACTIVE;
            const isCompleted = plan.status === PlanStatus.COMPLETED;

            return (
              <Card
                key={plan.id}
                className="shadow-2xs border-gray-200 bg-white hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="text-base font-bold text-gray-900 leading-tight">
                          {plan.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{plan.user?.name || "Member"}</span>
                          {plan.user?.profile?.memberId && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ({plan.user.profile.memberId})
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold py-0 px-2 shrink-0 ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : isCompleted
                            ? "bg-blue-50 text-blue-700 border-blue-300"
                            : "bg-gray-100 text-gray-500 border-gray-300"
                        }`}
                      >
                        {plan.status}
                      </Badge>
                    </div>

                    {plan.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border bg-gray-50/70 p-2.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Started: {new Date(plan.startDate).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-gray-800 flex items-center gap-1">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                      {plan._count?.exercises || 0} exercises
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1"
                      onClick={() => handleOpenView(plan.id)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Plan
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-600 hover:text-black gap-1 shrink-0"
                      onClick={() => handleOpenEdit(plan)}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Plan Builder Dialog (Create & Edit) */}
      <WorkoutPlanBuilderDialog
        members={members}
        existingPlan={editingPlan}
        open={builderOpen}
        onOpenChange={(v) => {
          setBuilderOpen(v);
          if (!v) setEditingPlan(null);
        }}
      />

      {/* View Plan Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-xl font-bold tracking-tight">
              {viewingPlan?.name || "Workout Plan Details"}
            </DialogTitle>
            {viewingPlan && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <span>Member: <strong>{viewingPlan.user?.name}</strong></span>
                <span>&middot;</span>
                <span>Status: <strong>{viewingPlan.status}</strong></span>
              </div>
            )}
          </DialogHeader>

          {loadingDetails ? (
            <div className="py-16 text-center text-muted-foreground text-xs">
              Loading workout details...
            </div>
          ) : viewingPlan ? (
            <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1">
              {viewingPlan.description && (
                <div className="p-3 rounded-lg bg-gray-50 border text-xs text-gray-700">
                  {viewingPlan.description}
                </div>
              )}

              {/* Day by day routines */}
              <div className="space-y-4">
                {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((day) => {
                  const dayExercises = (viewingPlan.exercises || []).filter((e: any) => e.day === day);
                  if (dayExercises.length === 0) return null;

                  return (
                    <div key={day} className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-emerald-600" />
                        {day}
                      </div>

                      <div className="divide-y border rounded-xl bg-white overflow-hidden text-xs">
                        {dayExercises.map((ex: any, idx: number) => (
                          <div key={ex.id || idx} className="p-3 flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <div className="font-bold text-sm text-gray-900">{ex.exerciseName}</div>
                              {ex.instructions && (
                                <div className="text-[11px] text-muted-foreground">{ex.instructions}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-gray-100 font-semibold px-2 py-0.5 rounded text-[11px]">
                                {ex.sets} × {ex.reps}
                              </span>
                              {ex.weight > 0 && (
                                <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                                  {ex.weight} kg
                                </span>
                              )}
                              {ex.restSeconds > 0 && (
                                <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded text-[11px] border border-blue-200">
                                  {ex.restSeconds}s rest
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
