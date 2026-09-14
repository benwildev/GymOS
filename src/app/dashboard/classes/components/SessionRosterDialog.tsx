"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Ban, 
  UserCheck 
} from "lucide-react";
import { 
  getClassScheduleBookings, 
  updateBookingAttendance, 
  cancelClassSchedule 
} from "@/actions/class.actions";
import { BookingStatus, ScheduleStatus } from "@/types/enums";
import { useRouter } from "next/navigation";

interface SessionRosterDialogProps {
  scheduleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SessionRosterDialog({
  scheduleId,
  open,
  onOpenChange,
  onSuccess,
}: SessionRosterDialogProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cancellingSession, setCancellingSession] = useState(false);

  const router = useRouter();

  const fetchRoster = async () => {
    if (!scheduleId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getClassScheduleBookings(scheduleId);
      if (res.error) {
        setError(res.error);
      } else {
        setData(res);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load session roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && scheduleId) {
      fetchRoster();
    } else {
      setData(null);
      setError(null);
    }
  }, [open, scheduleId]);

  const handleUpdateStatus = async (bookingId: string, status: "ATTENDED" | "NO_SHOW" | "CANCELLED") => {
    setUpdatingId(bookingId);
    try {
      const res = await updateBookingAttendance(bookingId, status);
      if (res.error) {
        setError(res.error);
      } else {
        await fetchRoster();
        router.refresh();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to update attendance.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelSession = async () => {
    if (!scheduleId) return;
    if (!confirm("Are you sure you want to cancel this scheduled class session? Members will see the cancelled status.")) {
      return;
    }
    setCancellingSession(true);
    try {
      const res = await cancelClassSchedule(scheduleId);
      if (res.error) {
        setError(res.error);
      } else {
        onOpenChange(false);
        router.refresh();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to cancel session.");
    } finally {
      setCancellingSession(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                {data?.schedule?.class?.name || "Class Session Roster"}
              </DialogTitle>
              {data?.schedule && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(data.schedule.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>&middot;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {data.schedule.startTime} - {data.schedule.endTime}
                  </span>
                </div>
              )}
            </div>

            {data?.schedule?.status === ScheduleStatus.CANCELLED ? (
              <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">
                CANCELLED SESSION
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleCancelSession}
                disabled={cancellingSession}
              >
                {cancellingSession ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Ban className="w-3 h-3 mr-1" />
                )}
                Cancel Session
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-xs">Loading attendees...</span>
          </div>
        ) : error ? (
          <div className="my-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
            {/* Capacity Progress Bar */}
            <div className="p-4 rounded-xl border bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">Capacity & Attendance</span>
                <span className="font-mono text-xs">
                  <strong className="text-black font-bold">{data.bookedCount}</strong> / {data.schedule.capacity} spots booked
                  ({data.availableSpots} available)
                </span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    data.bookedCount >= data.schedule.capacity
                      ? "bg-rose-500"
                      : data.bookedCount >= data.schedule.capacity * 0.8
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((data.bookedCount / data.schedule.capacity) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Attendees List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Booked Members ({data.bookings?.length || 0})
                </span>
              </div>

              {data.bookings?.length === 0 ? (
                <div className="py-12 text-center rounded-lg border border-dashed text-xs text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  No members have booked this session yet.
                </div>
              ) : (
                <div className="divide-y border rounded-lg overflow-hidden bg-white">
                  {data.bookings.map((booking: any) => {
                    const isAttended = booking.status === BookingStatus.ATTENDED;
                    const isNoShow = booking.status === BookingStatus.NO_SHOW;
                    const isCancelled = booking.status === BookingStatus.CANCELLED;
                    const isBooked = booking.status === BookingStatus.BOOKED;
                    const isUpdating = updatingId === booking.id;

                    return (
                      <div
                        key={booking.id}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCancelled ? "bg-gray-50/70 opacity-60" : ""
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900">
                              {booking.user?.name || "Gym Member"}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold py-0 px-1.5 ${
                                isAttended
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : isNoShow
                                  ? "bg-rose-50 text-rose-700 border-rose-300"
                                  : isCancelled
                                  ? "bg-gray-100 text-gray-500 border-gray-300"
                                  : "bg-blue-50 text-blue-700 border-blue-300"
                              }`}
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2">
                            <span>ID: {booking.user?.profile?.memberId || "N/A"}</span>
                            {booking.user?.profile?.phone && (
                              <span>&middot; Phone: {booking.user.profile.phone}</span>
                            )}
                            <span>&middot; Booked: {new Date(booking.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {/* Status Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : isBooked ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 px-2"
                                onClick={() => handleUpdateStatus(booking.id, "ATTENDED")}
                              >
                                <UserCheck className="w-3 h-3 mr-1" />
                                Attended
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 px-2"
                                onClick={() => handleUpdateStatus(booking.id, "NO_SHOW")}
                              >
                                No-Show
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-red-600 hover:bg-red-50 px-2"
                                onClick={() => handleUpdateStatus(booking.id, "CANCELLED")}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium">
                              {isAttended && "Marked Present"}
                              {isNoShow && "Marked No-Show"}
                              {isCancelled && "Booking Cancelled"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
