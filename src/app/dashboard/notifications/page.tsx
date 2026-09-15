import { redirect } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import { AlertCircle, AlertTriangle, Bell, Info } from "lucide-react";
import { auth } from "@/lib/auth";
import { getAllNotifications } from "@/services/notification.service";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  Panel,
  PanelBody,
  PanelHeader,
  SectionLabel,
} from "../components/overview/primitives";

export const metadata = {
  title: "Notifications | GymOS",
  description: "System notifications and reminders.",
};

const ICONS: Record<string, { icon: typeof Bell; tone: string }> = {
  PAYMENT_DUE: { icon: AlertCircle, tone: "bg-rose-50 text-rose-600" },
  MEMBERSHIP_EXPIRING: { icon: AlertTriangle, tone: "bg-amber-50 text-amber-600" },
  REMINDER: { icon: AlertTriangle, tone: "bg-amber-50 text-amber-600" },
  PROMOTION: { icon: Info, tone: "bg-violet-50 text-violet-600" },
  SYSTEM: { icon: Info, tone: "bg-blue-50 text-blue-600" },
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await getAllNotifications(session.user.id);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-slate-900">
          Notifications
        </h1>
        <p className="mt-1.5 text-[13.5px] text-slate-500">
          {unreadCount > 0
            ? `${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}`
            : "You are all caught up."}
        </p>
      </div>

      <section className="space-y-3">
        <SectionLabel>Recent</SectionLabel>
        <Panel>
          <PanelHeader
            title="All notifications"
            description="Newest first, from the last 50 events"
          />
          <PanelBody>
            {notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No notifications yet"
                description="Payment reminders and membership alerts will appear here."
              />
            ) : (
              <ul className="-mx-2 divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const config = ICONS[notification.type] ?? ICONS.SYSTEM;
                  const Icon = config.icon;

                  return (
                    <li
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50",
                        !notification.isRead && "bg-slate-50/60"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          config.tone
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium text-slate-900">
                          {notification.title}
                          {!notification.isRead ? (
                            <span className="ml-2 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                              New
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-600">
                          {notification.message}
                        </p>
                        <time
                          dateTime={notification.createdAt.toISOString()}
                          title={format(
                            notification.createdAt,
                            "EEEE, d MMM yyyy 'at' h:mm a"
                          )}
                          className="mt-1 block text-[11.5px] text-slate-400"
                        >
                          {formatDistanceToNowStrict(notification.createdAt, {
                            addSuffix: true,
                          })}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </PanelBody>
        </Panel>
      </section>
    </div>
  );
}
