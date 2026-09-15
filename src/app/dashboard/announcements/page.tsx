import { getActiveAnnouncements } from "@/services/notification.service";
import { AnnouncementForm } from "./announcement-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Announcements | GymOS",
};

export default async function AnnouncementsPage() {
  const announcements = await getActiveAnnouncements();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">
          Broadcast messages to your members
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create Announcement</CardTitle>
              <CardDescription>Publish a new message to the member portal.</CardDescription>
            </CardHeader>
            <CardContent>
              <AnnouncementForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Active Announcements</h3>
          {announcements.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active announcements.</p>
          ) : (
            announcements.map(a => (
              <Card key={a.id} className="shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {a.audience.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Posted on {a.createdAt.toLocaleDateString()}
                    {a.expiresAt && ` · Expires ${a.expiresAt.toLocaleDateString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{a.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
