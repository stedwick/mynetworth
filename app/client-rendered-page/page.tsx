"use client";

import { authClient } from "@/lib/auth/client";

export default function ClientRenderedPage() {
  const { data } = authClient.useSession();

  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Client Rendered Page</h1>
      <p>Authenticated: {data?.session ? "Yes" : "No"}</p>
      {data?.user ? <p>User ID: {data.user.id}</p> : null}
      <h2 className="text-lg font-medium">Session and User Data</h2>
      <pre className="overflow-x-auto rounded-md bg-zinc-100 p-4 text-sm text-zinc-900">
        {JSON.stringify(
          { session: data?.session, user: data?.user },
          null,
          2
        )}
      </pre>
    </main>
  );
}
