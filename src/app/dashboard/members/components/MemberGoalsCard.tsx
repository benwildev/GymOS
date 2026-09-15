"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddGoalDialog } from "./AddGoalDialog";
import { updateGoalStatusAction, deleteGoalAction } from "@/actions/progress.actions";
import { GoalStatus } from "@prisma/client";
import { format } from "date-fns";
import { Target, CheckCircle2, XCircle, Trash2, Calendar, Plus, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export interface GoalItem {
  id: string;
  userId: string;
  goalType: string;
  title: string;
  description: string | null;
  targetValue: number | null;
  targetUnit: string | null;
  startDate: Date | string;
  targetDate: Date | string | null;
  status: GoalStatus;
  createdAt: Date | string;
}

interface MemberGoalsCardProps {
  userId: string;
  memberName: string;
  initialGoals: GoalItem[];
}

export function MemberGoalsCard({ userId, memberName, initialGoals }: MemberGoalsCardProps) {
  const router = useRouter();
  const [goals, setGoals] = useState<GoalItem[]>(initialGoals);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activeGoal = goals.find((g) => g.status === GoalStatus.ACTIVE);

  const handleStatusChange = async (goalId: string, status: GoalStatus) => {
    setLoadingId(goalId);
    try {
      const res = await updateGoalStatusAction(goalId, status);
      if (res.success && res.goal) {
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, status: res.goal.status } : g))
        );
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this fitness goal?")) return;
    setLoadingId(goalId);
    try {
      const res = await deleteGoalAction(goalId);
      if (res.success) {
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="border border-slate-200/80 shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-900">Fitness Goals</CardTitle>
            <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200">
              {goals.length} Recorded
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Manage targets, milestones, and fitness goals for {memberName}.
          </CardDescription>
        </div>

        <AddGoalDialog
          userId={userId}
          memberName={memberName}
          onSuccess={() => router.refresh()}
          trigger={
            <Button size="sm" className="gap-1.5 bg-[#1a9d5e] hover:bg-[#15804d] text-white">
              <Plus className="h-4 w-4" />
              Set New Goal
            </Button>
          }
        />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Goal Spotlight */}
        {activeGoal ? (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white text-[10px]">Active Goal</Badge>
                <span className="text-xs font-semibold text-emerald-900">{activeGoal.title}</span>
              </div>
              {activeGoal.description && (
                <p className="text-xs text-emerald-700">{activeGoal.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-800 pt-1 font-medium">
                {activeGoal.targetValue && (
                  <span>
                    Target: <strong className="font-bold">{activeGoal.targetValue} {activeGoal.targetUnit || ""}</strong>
                  </span>
                )}
                {activeGoal.targetDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                    Target Date: {format(new Date(activeGoal.targetDate), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={loadingId === activeGoal.id}
                onClick={() => handleStatusChange(activeGoal.id, GoalStatus.COMPLETED)}
                className="h-8 text-xs gap-1 border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Completed
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={loadingId === activeGoal.id}
                onClick={() => handleStatusChange(activeGoal.id, GoalStatus.CANCELLED)}
                className="h-8 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel Goal
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
            <Target className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">No active goal set</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Set a target milestone like Weight Loss, Strength, or Muscle Gain for {memberName}.
            </p>
          </div>
        )}

        {/* Goals Table */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">All Fitness Goals</div>
          {goals.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
              No goals recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Goal Title</TableHead>
                  <TableHead className="text-xs">Target</TableHead>
                  <TableHead className="text-xs">Target Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => (
                  <TableRow key={goal.id} className="text-xs">
                    <TableCell>
                      <div className="font-semibold text-slate-900">{goal.title}</div>
                      {goal.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">{goal.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {goal.targetValue ? `${goal.targetValue} ${goal.targetUnit || ""}` : "General milestone"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {goal.targetDate ? format(new Date(goal.targetDate), "MMM d, yyyy") : "Open ended"}
                    </TableCell>
                    <TableCell>
                      {goal.status === GoalStatus.ACTIVE ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Active
                        </Badge>
                      ) : goal.status === GoalStatus.COMPLETED ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-200 text-[10px]">
                          Cancelled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {goal.status !== GoalStatus.ACTIVE && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={loadingId === goal.id}
                            onClick={() => handleStatusChange(goal.id, GoalStatus.ACTIVE)}
                            className="h-7 px-2 text-[11px] text-emerald-700 hover:text-emerald-800"
                          >
                            Re-activate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={loadingId === goal.id}
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
