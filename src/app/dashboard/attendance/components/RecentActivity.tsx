"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkOutMember } from "@/actions/attendance.actions";

type Member = {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  profile: {
    memberId: string | null;
  } | null;
};

type Attendance = {
  id: string;
  userId: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  user: Member;
};

export default function RecentActivity({
  currentlyCheckedIn,
  recentCheckOuts,
}: {
  currentlyCheckedIn: Attendance[];
  recentCheckOuts: Attendance[];
}) {
  const [activeTab, setActiveTab] = useState<"in-gym" | "recent">("in-gym");

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "in-gym"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-black"
          }`}
          onClick={() => setActiveTab("in-gym")}
        >
          Currently in Gym ({currentlyCheckedIn.length})
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "recent"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-black"
          }`}
          onClick={() => setActiveTab("recent")}
        >
          Recent Check-outs
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeTab === "in-gym" ? (
          currentlyCheckedIn.length > 0 ? (
            currentlyCheckedIn.map((record) => (
              <div key={record.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={record.user.avatar || undefined} />
                    <AvatarFallback>{record.user.name?.charAt(0) || "M"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{record.user.name}</span>
                    <span className="text-xs text-green-600">
                      In for {formatDistanceToNow(new Date(record.checkInAt))}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Check Out"
                  onClick={async () => {
                    await checkOutMember(record.id);
                  }}
                  className="text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              No one is currently checked in.
            </div>
          )
        ) : (
          recentCheckOuts.length > 0 ? (
            recentCheckOuts.map((record) => (
              <div key={record.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={record.user.avatar || undefined} />
                    <AvatarFallback>{record.user.name?.charAt(0) || "M"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{record.user.name}</span>
                    <span className="text-xs text-gray-500">
                      Left {formatDistanceToNow(new Date(record.checkOutAt!))} ago
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {format(new Date(record.checkOutAt!), "h:mm a")}
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              No recent check-outs.
            </div>
          )
        )}
      </div>
    </div>
  );
}
