import { prisma } from "@/lib/prisma";
import { NotificationType, AnnouncementAudience } from "@prisma/client";

export async function getUnreadNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getAllNotifications(userId: string, limit = 50) {
  return await prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  return await prisma.notification.update({
    where: {
      id: notificationId,
      userId, // Ensure the user owns the notification
    },
    data: {
      isRead: true,
    },
  });
}

export async function markAllAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = "SYSTEM"
) {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
    },
  });
}

// Announcements
export async function getActiveAnnouncements(userId?: string) {
  // If no userId provided, assuming OWNER viewing all active
  const now = new Date();
  
  const whereClause: any = {
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: now } },
    ],
  };

  if (userId) {
    // If a member is requesting, we should check their status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: true },
    });

    if (user && user.role === "MEMBER") {
      const hasActiveMembership = user.memberships.some(
        (m) => m.status === "ACTIVE" && m.endDate > now
      );

      whereClause.audience = {
        in: [
          AnnouncementAudience.ALL,
          hasActiveMembership
            ? AnnouncementAudience.ACTIVE_MEMBERS
            : AnnouncementAudience.INACTIVE_MEMBERS,
        ],
      };
    }
  }

  return await prisma.announcement.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createAnnouncement(
  title: string,
  content: string,
  audience: AnnouncementAudience = "ALL",
  expiresInDays?: number
) {
  let expiresAt = null;
  if (expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  return await prisma.announcement.create({
    data: {
      title,
      content,
      audience,
      expiresAt,
    },
  });
}
