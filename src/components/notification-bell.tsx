"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Info, AlertTriangle, AlertCircle } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchUnreadNotificationsAction, markNotificationAsReadAction, markAllNotificationsAsReadAction } from "@/actions/notification/notification-actions"
import { formatDistanceToNow } from "date-fns"

type NotificationType = "SYSTEM" | "REMINDER" | "PROMOTION" | "PAYMENT_DUE" | "MEMBERSHIP_EXPIRING" | "CLASS_UPDATE" | string

interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: Date
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    const result = await fetchUnreadNotificationsAction()
    if (result.notifications) {
      setNotifications(result.notifications as Notification[])
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 2 minutes
    const interval = setInterval(fetchNotifications, 120000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = async (id: string) => {
    setLoading(true)
    await markNotificationAsReadAction(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setLoading(false)
  }

  const handleMarkAllAsRead = async () => {
    setLoading(true)
    await markAllNotificationsAsReadAction()
    setNotifications([])
    setLoading(false)
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "PAYMENT_DUE":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "MEMBERSHIP_EXPIRING":
      case "REMINDER":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "CLASS_UPDATE":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors inline-flex items-center justify-center cursor-pointer">
        <Bell className="h-5 w-5 text-slate-600" />
        {notifications.length > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center p-0 text-[10px] bg-red-500 hover:bg-red-600 rounded-full text-white font-bold border-2 border-white"
          >
            {notifications.length > 99 ? '99+' : notifications.length}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-lg border-gray-100 rounded-xl" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b bg-gray-50/50 rounded-t-xl">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-muted-foreground hover:text-black px-2"
              onClick={handleMarkAllAsRead}
              disabled={loading}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center px-4">
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">You're all caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">No new notifications.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="flex gap-3 p-4 border-b last:border-0 hover:bg-gray-50 transition-colors group"
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground pt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={loading}
                    title="Mark as read"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
