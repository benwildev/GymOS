"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MembershipStatus } from "@/types/enums";

export default function MembersClient({ 
  initialMembers, 
  plans,
  search,
  status,
  planId
}: { 
  initialMembers: any[]; 
  plans: any[];
  search: string;
  status: string;
  planId: string;
}) {
  const router = useRouter();
  
  const [searchValue, setSearchValue] = useState<string>(search || "");
  const [statusValue, setStatusValue] = useState<string>(status || "ALL");
  const [planValue, setPlanValue] = useState<string>(planId || "ALL");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams(searchValue, statusValue, planValue);
  };

  const updateQueryParams = (s: string, st: string, p: string) => {
    const params = new URLSearchParams();
    if (s) params.set("search", s);
    if (st && st !== "ALL") params.set("status", st);
    if (p && p !== "ALL") params.set("planId", p);
    
    router.push(`/dashboard/members?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 max-w-2xl">
          <Input 
            placeholder="Search by name, email, or Member ID..." 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex-1"
          />
          <Select 
            value={statusValue} 
            onValueChange={(val) => {
              const strVal = val || "";
              setStatusValue(strVal);
              updateQueryParams(searchValue, strVal, planValue);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.values(MembershipStatus).map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={planValue} 
            onValueChange={(val) => {
              const strVal = val || "";
              setPlanValue(strVal);
              updateQueryParams(searchValue, statusValue, strVal);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Plans</SelectItem>
              {plans.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        
        <Link href="/dashboard/members/new">
          <Button>+ Add Member</Button>
        </Link>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Active Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No members found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              initialMembers.map((member) => {
                // Find the active membership, or the latest one if none are active
                const activeMembership = member.memberships.find((m: any) => m.status === MembershipStatus.ACTIVE) 
                  || member.memberships[0];

                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {member.profile?.memberId || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {member.name}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{member.email}</div>
                        {member.profile?.phone && (
                          <div className="text-xs text-muted-foreground">{member.profile.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {activeMembership ? (
                        <div className="text-sm">
                          <div>{activeMembership.plan.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Expires: {new Date(activeMembership.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No plan</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {activeMembership ? (
                        <Badge 
                          variant={activeMembership.status === MembershipStatus.ACTIVE ? "default" : "secondary"}
                          className={activeMembership.status === MembershipStatus.ACTIVE ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200" : ""}
                        >
                          {activeMembership.status}
                        </Badge>
                      ) : (
                        <Badge variant="outline">NONE</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/members/${member.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
