"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewHotelPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      city: String(fd.get("city") ?? "").trim(),
      country: String(fd.get("country") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim() || null,
      imageUrl: String(fd.get("imageUrl") ?? "").trim() || null,
    };
    const res = await fetch("/api/admin/hotels", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as { data?: { id: string }; error?: { message?: string } };
    setPending(false);
    if (!res.ok) {
      setError(body.error?.message ?? "Could not create hotel.");
      return;
    }
    if (body.data?.id) router.push(`/admin/hotels/${body.data.id}/edit`);
    else router.push("/admin/hotels");
  }

  return (
    <div>
      <Link
        href="/admin/hotels"
        className="text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400"
      >
        ← Hotels
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        New hotel
      </h1>
      <form
        onSubmit={handleSubmit}
        className="mt-8 w-full space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {error ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        <Field label="Name" name="name" required />
        <Field label="City" name="city" required />
        <Field label="Country" name="country" required />
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <Field label="Image URL" name="imageUrl" placeholder="https://…" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Create hotel"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
      />
    </div>
  );
}
