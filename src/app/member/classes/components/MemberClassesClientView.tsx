"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  CalendarDays, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  XCircle, 
  Sparkles 
} from "lucide-react";
import { bookClass, cancelClassBooking } from "@/actions/class.actions";
import { useRouter } from "next/navigation";

interface MemberClassesClientViewProps {
  availableClasses: any[];
  upcomingBookings: any[];
  bookingHistory: any[];
  hasActiveMembership: boolean;
}

export function MemberClassesClientView({
  availableClasses,
  upcomingBookings,
  bookingHistory,
  hasActiveMembership,
}: MemberClassesClientViewProps) {
  const [tab, setTab] = useState("available");
  const [bookingScheduleId, setBookingScheduleId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const router = useRouter();

  const handleBook = async (scheduleId: string) => {
    setBookingScheduleId(scheduleId);
    setFeedback(null);

    try {
      const res = await bookClass(scheduleId);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: res.message || "You're booked for this class!",
        });
        router.refresh();
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to book class." });
    } finally {
      setBookingScheduleId(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel your booking for this session? Your spot will be released.")) {
      return;
    }

    setCancellingBookingId(bookingId);
    setFeedback(null);

    try {
      const res = await cancelClassBooking(bookingId);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: res.message || "Booking cancelled.",
        });
        router.refresh();
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to cancel booking." });
    } finally {
      setCancellingBookingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gym Classes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Browse upcoming group workouts, reserve your spot, and view your schedule.
        </p>
      </div>

      {/* Membership check notice */}
      {!hasActiveMembership && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 text-xs text-amber-900 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong>Active Membership Required:</strong> You need an active gym membership to book fitness classes.
            Please visit the reception or contact your gym to activate your membership.
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="available" className="text-xs font-semibold px-4">
            Available Classes ({availableClasses.length})
          </TabsTrigger>
          <TabsTrigger value="my-bookings" className="text-xs font-semibold px-4">
            My Bookings ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs font-semibold px-4">
            Booking History ({bookingHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: AVAILABLE SESSIONS */}
        <TabsContent value="available" className="space-y-4">
          {availableClasses.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-dashed bg-white">
              <CalendarDays className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <div className="text-base font-semibold text-gray-800">No classes scheduled</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                There are currently no upcoming classes on the gym schedule. Please check back later!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableClasses.map((item) => {
                const percentage = Math.min(100, Math.round((item.bookedCount / item.capacity) * 100));
                const isBookingThis = bookingScheduleId === item.id;
                const isCancellingThis = cancellingBookingId === item.userBookingId;

                return (
                  <Card
                    key={item.id}
                    className={`shadow-2xs border-gray-200 bg-white hover:shadow-md transition-all flex flex-col justify-between ${
                      item.isUserBooked ? "border-emerald-300 ring-1 ring-emerald-400/50 bg-emerald-50/10" : ""
                    }`}
                  >
                    <CardContent className="p-5 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-base font-bold text-gray-900 leading-tight">
                              {item.className}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.duration} minutes
                            </div>
                          </div>

                          {item.isUserBooked ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-semibold py-0 px-2 shrink-0 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Booked
                            </Badge>
                          ) : item.isFull ? (
                            <Badge variant="outline" className="text-[10px] text-rose-700 bg-rose-50 border-rose-200 shrink-0">
                              Class Full
                            </Badge>
                          ) : item.bookedCount >= item.capacity * 0.8 ? (
                            <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200 shrink-0">
                              Few Spots Left
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200 shrink-0">
                              Available
                            </Badge>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        {/* Date & Time pill */}
                        <div className="rounded-lg border bg-gray-50/80 p-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-gray-800">
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            {new Date(item.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1 font-mono font-medium text-gray-700">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            {item.startTime}
                          </span>
                        </div>

                        {/* Capacity progress */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> Capacity
                            </span>
                            <span className="font-semibold text-gray-900">
                              {item.bookedCount} / {item.capacity} spots{" "}
                              <span className="text-[11px] text-muted-foreground font-normal">
                                ({item.availableSpots} left)
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.isFull
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

                      {/* Action Button */}
                      <div className="pt-2 border-t">
                        {item.isUserBooked ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50 font-semibold"
                            onClick={() => item.userBookingId && handleCancel(item.userBookingId)}
                            disabled={isCancellingThis}
                          >
                            {isCancellingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Cancelling...
                              </>
                            ) : (
                              "Cancel Booking"
                            )}
                          </Button>
                        ) : item.isFull ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="w-full text-xs text-muted-foreground cursor-not-allowed"
                          >
                            Class Full
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full bg-black hover:bg-gray-800 text-white text-xs font-semibold gap-1.5"
                            onClick={() => handleBook(item.id)}
                            disabled={isBookingThis || !hasActiveMembership}
                          >
                            {isBookingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Booking Spot...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                Book Class
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: MY BOOKINGS (UPCOMING) */}
        <TabsContent value="my-bookings" className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-dashed bg-white">
              <CalendarDays className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <div className="text-base font-semibold text-gray-800">You haven't booked any classes yet</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Explore the Available Classes tab and reserve your spot in your favorite sessions!
              </p>
              <div className="mt-4">
                <Button size="sm" onClick={() => setTab("available")}>
                  Browse Available Classes
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y border rounded-xl bg-white overflow-hidden shadow-2xs">
              {upcomingBookings.map((booking) => {
                const isCancelling = cancellingBookingId === booking.id;

                return (
                  <div key={booking.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-gray-900">
                          {booking.classSchedule.class.name}
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">
                          CONFIRMED
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2">
                        <span className="font-medium text-gray-700">
                          {new Date(booking.classSchedule.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span>&middot;</span>
                        <span className="font-mono text-gray-700">
                          {booking.classSchedule.startTime} - {booking.classSchedule.endTime}
                        </span>
                        <span>&middot;</span>
                        <span>{booking.classSchedule.class.duration} mins</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50 shrink-0 font-semibold"
                      onClick={() => handleCancel(booking.id)}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          Cancelling...
                        </>
                      ) : (
                        "Cancel Booking"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: BOOKING HISTORY */}
        <TabsContent value="history" className="space-y-4">
          {bookingHistory.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed bg-white text-xs text-muted-foreground">
              No previous class history yet.
            </div>
          ) : (
            <div className="divide-y border rounded-xl bg-white overflow-hidden shadow-2xs">
              {bookingHistory.map((booking) => (
                <div key={booking.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-gray-900 text-sm">
                      {booking.classSchedule.class.name}
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(booking.classSchedule.date).toLocaleDateString()} &middot; {booking.classSchedule.startTime}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      booking.status === "ATTENDED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : booking.status === "NO_SHOW"
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : "bg-gray-100 text-gray-500 border-gray-300"
                    }`}
                  >
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
