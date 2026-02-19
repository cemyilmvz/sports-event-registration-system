import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { UserNav } from "@/components/user-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };

  const role = user.role as "admin" | "athlete";
  const name = user.name || "Kullanıcı";
  const email = user.email || "";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar role={role} userName={name} userEmail={email} />
      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-end px-6 shrink-0">
          <UserNav name={name} email={email} role={role} />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
