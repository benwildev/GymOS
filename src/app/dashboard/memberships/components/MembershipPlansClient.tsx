"use client";

import { useState } from "react";
import type { MembershipPlan } from "@prisma/client";
import { createMembershipPlan, updateMembershipPlan } from "@/actions/membership.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MembershipPlansClient({ initialPlans }: { initialPlans: MembershipPlan[] }) {
  const [plans, setPlans] = useState<MembershipPlan[]>(initialPlans);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openNewPlan = () => {
    setEditingPlan(null);
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setError(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // Switch sends "on" if checked, but we need it as a boolean string
    // Let's manually append it since unchecked switch might not send anything
    const isActive = (e.currentTarget.elements.namedItem("isActive") as HTMLInputElement)?.checked;
    formData.set("isActive", isActive ? "true" : "false");

    try {
      let res;
      if (editingPlan) {
        res = await updateMembershipPlan(editingPlan.id, formData);
      } else {
        res = await createMembershipPlan(formData);
      }

      if (res.error) {
        setError(res.error);
      } else {
        setIsDialogOpen(false);
        // Refresh the page to get the updated list
        window.location.reload();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={openNewPlan}>+ Create Plan</Button>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
              <DialogDescription>
                {editingPlan 
                  ? "Update the details of your membership plan." 
                  : "Add a new membership plan for your members to subscribe to."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingPlan?.name || ""} 
                  placeholder="e.g. Monthly Standard" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  name="description" 
                  defaultValue={editingPlan?.description || ""} 
                  placeholder="e.g. Access to all gym equipment" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input 
                    id="price" 
                    name="price" 
                    type="number" 
                    step="0.01"
                    min="0"
                    defaultValue={editingPlan?.price || ""} 
                    placeholder="49.99" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Days)</Label>
                  <Input 
                    id="duration" 
                    name="duration" 
                    type="number" 
                    min="1"
                    defaultValue={editingPlan?.duration || 30} 
                    required 
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="isActive" 
                  name="isActive" 
                  defaultChecked={editingPlan ? editingPlan.isActive : true} 
                />
                <Label htmlFor="isActive">Active (available for new members)</Label>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Plan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No membership plans found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    {plan.name}
                    {plan.description && (
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">{plan.description}</p>
                    )}
                  </TableCell>
                  <TableCell>${plan.price.toFixed(2)}</TableCell>
                  <TableCell>{plan.duration} days</TableCell>
                  <TableCell>
                    {plan.isActive ? (
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditPlan(plan)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
