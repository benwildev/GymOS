import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./components/SettingsForm";

export default async function SettingsPage() {
  const gym = await prisma.gym.findFirst();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your gym's details, branding, and currency.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gym Profile & Branding</CardTitle>
          <CardDescription>
            This information is displayed on your dashboard headers, member portal, login page, and receipts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm gym={gym} />
        </CardContent>
      </Card>
    </div>
  );
}

