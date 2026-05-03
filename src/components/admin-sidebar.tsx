"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/hotels", label: "Hotels" },
  { href: "/admin/bookings", label: "Bookings" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Staybook
        </p>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Admin
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Admin">
        {links.map(({ href, label, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium outline-none ring-teal-500/40 focus-visible:ring-2 ${
                active
                  ? "bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-100"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Public site
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
