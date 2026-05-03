import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-stretch bg-zinc-50 dark:bg-zinc-950">
      <AdminSidebar />
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
