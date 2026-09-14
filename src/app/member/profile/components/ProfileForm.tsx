"use client";

import { useState } from "react";
import { updateMemberProfile } from "@/actions/member-portal.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

export default function ProfileForm({ member }: { member: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    phone: member.profile?.phone || "",
    gender: member.profile?.gender || "",
    dob: member.profile?.dob ? new Date(member.profile.dob).toISOString().split('T')[0] : "",
    address: member.profile?.address || "",
    emergencyContactName: member.profile?.emergencyContactName || "",
    emergencyContactPhone: member.profile?.emergencyContactPhone || "",
    emergencyContactRel: member.profile?.emergencyContactRel || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    try {
      const res = await updateMemberProfile(data);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded text-sm">
          Profile updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input defaultValue={member.name || ""} disabled />
              <p className="text-xs text-muted-foreground">Please contact support to change your name.</p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue={member.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
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
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
            <CardDescription>Who should we contact in an emergency?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Contact Name</Label>
              <Input id="emergencyContactName" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
              <Input id="emergencyContactPhone" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactRel">Relationship</Label>
              <Input id="emergencyContactRel" name="emergencyContactRel" value={formData.emergencyContactRel} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
