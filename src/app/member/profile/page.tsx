import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./components/ProfileForm";

export const metadata = {
  title: "My Profile | Gym Management",
};

export default async function MemberProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Not authenticated</div>;
  }

  const member = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
    }
  });

  if (!member) {
    return <div>Member not found</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Update your personal and contact information.
        </p>
      </div>

      <ProfileForm member={member} />
    </div>
  );
}
