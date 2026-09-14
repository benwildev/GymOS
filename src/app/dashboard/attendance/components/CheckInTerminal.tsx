"use client";

import { useState, useEffect, useRef } from "react";
import { searchMembersForCheckIn, checkInMember, checkOutMember } from "@/actions/attendance.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, CheckCircle2, UserX, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

type SearchResult = {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  memberId: string | null | undefined;
  phone: string | null | undefined;
  hasActiveMembership: boolean;
  activeMembershipPlan: string | undefined;
  membershipEndDate: Date | undefined;
  isCheckedIn: boolean;
  activeCheckInId: string | undefined;
  checkInAt: Date | undefined;
  todaysVisitsCount: number;
};

export default function CheckInTerminal() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // userId of the member being checked in/out

  // Debounced search
  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const data = await searchMembersForCheckIn(query);
        setResults(data);
      } catch (error) {
        console.error("Error searching members:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleCheckIn = async (userId: string) => {
    setActionLoading(userId);
    try {
      const result = await checkInMember(userId);
      if (result.success) {
        // Refresh the search results to reflect the new check-in status
        const data = await searchMembersForCheckIn(query);
        setResults(data);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Failed to check in member");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (userId: string, attendanceId: string) => {
    setActionLoading(userId);
    try {
      const result = await checkOutMember(attendanceId);
      if (result.success) {
        // Refresh the search results to reflect the new check-in status
        const data = await searchMembersForCheckIn(query);
        setResults(data);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Check-out error:", error);
      alert("Failed to check out member");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search by name, email, phone, or member ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 text-lg"
          autoFocus
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-gray-400" />
        )}
      </div>

      <div className="flex flex-col gap-3 min-h-[300px]">
        {query.length >= 2 && results.length === 0 && !isSearching && (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 py-10">
            <UserX className="h-10 w-10 mb-2 opacity-50" />
            <p>No members found matching "{query}"</p>
          </div>
        )}

        {results.map((member) => (
          <div 
            key={member.id} 
            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
              member.isCheckedIn ? 'bg-green-50/50 border-green-200' : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar || undefined} alt={member.name || "Member"} />
                <AvatarFallback>{member.name?.charAt(0) || "M"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{member.name}</span>
                  {!member.hasActiveMembership && (
                    <Badge variant="destructive" className="text-xs">Inactive</Badge>
                  )}
                  {member.hasActiveMembership && member.isCheckedIn && (
                    <Badge variant="default" className="bg-green-600 text-xs">Checked In</Badge>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {member.memberId ? `${member.memberId} • ` : ''}
                  {member.email}
                </span>
                
                {member.hasActiveMembership ? (
                  <span className="text-xs text-gray-500 mt-1">
                    Plan: {member.activeMembershipPlan}
                  </span>
                ) : (
                  <span className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> No active membership
                  </span>
                )}

                {member.isCheckedIn && member.checkInAt && (
                  <span className="text-xs text-green-600 mt-1">
                    In gym for {formatDistanceToNow(new Date(member.checkInAt))}
                  </span>
                )}
                
                {!member.isCheckedIn && member.todaysVisitsCount > 0 && (
                  <span className="text-xs text-blue-600 mt-1">
                    Previously visited {member.todaysVisitsCount} time{member.todaysVisitsCount > 1 ? 's' : ''} today
                  </span>
                )}
              </div>
            </div>
            
            <div>
              {member.isCheckedIn ? (
                <Button 
                  variant="outline" 
                  onClick={() => member.activeCheckInId && handleCheckOut(member.id, member.activeCheckInId)}
                  disabled={actionLoading === member.id}
                  className="w-28 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                  {actionLoading === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check Out"}
                </Button>
              ) : (
                <Button 
                  onClick={() => handleCheckIn(member.id)}
                  disabled={!member.hasActiveMembership || actionLoading === member.id}
                  className={`w-28 ${!member.hasActiveMembership ? 'opacity-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  variant={member.hasActiveMembership ? "default" : "secondary"}
                >
                  {actionLoading === member.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Check In
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
