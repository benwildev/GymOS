"use server"

import { auth } from "@/lib/auth"
import { getUnreadNotifications, markAsRead, markAllAsRead } from "@/services/notification.service"

export async function fetchUnreadNotificationsAction() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    const notifications = await getUnreadNotifications(session.user.id)
    return { notifications }
  } catch (error) {
    return { error: "Failed to fetch notifications" }
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    await markAsRead(notificationId, session.user.id)
    return { success: true }
  } catch (error) {
    return { error: "Failed to mark as read" }
  }
}

export async function markAllNotificationsAsReadAction() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    await markAllAsRead(session.user.id)
    return { success: true }
  } catch (error) {
    return { error: "Failed to mark all as read" }
  }
}
