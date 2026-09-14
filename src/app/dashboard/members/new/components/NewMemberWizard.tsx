"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MembershipPlan } from "@prisma/client";
import { createMember } from "@/actions/member.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function NewMemberWizard({ plans }: { plans: MembershipPlan[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRel: "",
    planId: "",
    paymentMethod: "CASH",
    paymentAmount: "", // override amount
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.firstName || !formData.email) {
        setError("First Name and Email are required.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.planId) {
        setError("Please select a membership plan.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    try {
      const res = await createMember(data);
      if (res.error) {
        setError(res.error);
        setStep(1); // Go back to fix error if needed
      } else {
        router.push("/dashboard/members");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === formData.planId);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {step === 1 && "Step 1: Member Information"}
              {step === 2 && "Step 2: Membership Plan"}
              {step === 3 && "Step 3: Payment Details"}
              {step === 4 && "Step 4: Confirmation"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Enter the member's personal and emergency contact details."}
              {step === 2 && "Select a membership plan for the new member."}
              {step === 3 && "Record the initial payment details."}
              {step === 4 && "Review the details before creating the member."}
            </CardDescription>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Step {step} of 4
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" name="dob" value={formData.dob} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(val) => handleSelect("gender", val || "")}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />
            <h3 className="font-medium text-sm">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Name</Label>
                <Input id="emergencyContactName" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Phone</Label>
                <Input id="emergencyContactPhone" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactRel">Relationship</Label>
                <Input id="emergencyContactRel" name="emergencyContactRel" value={formData.emergencyContactRel} onChange={handleChange} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                No active membership plans found. Please create one first in the Memberships tab.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    onClick={() => handleSelect("planId", plan.id)}
                    className={`border p-4 rounded-lg cursor-pointer transition-all ${
                      formData.planId === plan.id 
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                        : "hover:border-primary/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{plan.name}</h4>
                      <span className="font-bold text-lg">${plan.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-4 text-sm font-medium">
                      Duration: {plan.duration} days
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 max-w-md">
            <div className="space-y-2">
              <Label>Selected Plan</Label>
              <div className="p-3 bg-secondary rounded-md text-sm font-medium flex justify-between">
                <span>{selectedPlan?.name}</span>
                <span>${selectedPlan?.price.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={formData.paymentMethod} onValueChange={(val) => handleSelect("paymentMethod", val || "")}>
                <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="COMPLIMENTARY">Complimentary (Free)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Amount Paid ($) <span className="text-muted-foreground font-normal">(Optional Override)</span></Label>
              <Input 
                id="paymentAmount" 
                name="paymentAmount" 
                type="number" 
                step="0.01"
                min="0"
                placeholder={selectedPlan?.price.toFixed(2)}
                value={formData.paymentAmount} 
                onChange={handleChange} 
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use the default plan price.
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-medium border-b pb-2">Member Information</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Name:</div>
                  <div className="font-medium">{formData.firstName} {formData.lastName}</div>
                  
                  <div className="text-muted-foreground">Email:</div>
                  <div className="font-medium">{formData.email}</div>
                  
                  <div className="text-muted-foreground">Phone:</div>
                  <div className="font-medium">{formData.phone || "-"}</div>
                  
                  <div className="text-muted-foreground">Gender:</div>
                  <div className="font-medium">{formData.gender || "-"}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium border-b pb-2">Membership & Payment</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Plan:</div>
                  <div className="font-medium">{selectedPlan?.name}</div>
                  
                  <div className="text-muted-foreground">Duration:</div>
                  <div className="font-medium">{selectedPlan?.duration} days</div>
                  
                  <div className="text-muted-foreground">Payment Method:</div>
                  <div className="font-medium">{formData.paymentMethod}</div>
                  
                  <div className="text-muted-foreground">Amount:</div>
                  <div className="font-medium">
                    ${formData.paymentAmount ? parseFloat(formData.paymentAmount).toFixed(2) : selectedPlan?.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-md text-sm">
              <p className="font-medium">Ready to create member!</p>
              <p className="mt-1">When you click confirm, a new member profile will be generated, the membership will be activated, and the initial payment will be recorded.</p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-6">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={step === 1 || loading}
        >
          Back
        </Button>
        
        {step < 4 ? (
          <Button onClick={nextStep} disabled={plans.length === 0 && step === 2}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Processing..." : "Confirm & Create Member"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
