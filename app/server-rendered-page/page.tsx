import { Suspense } from "react";
import { neonAuth } from "@neondatabase/auth/next/server";

async function AuthDetails() {
  const { session, user } = await neonAuth();

  return (
    <>
      <p>Authenticated: {session ? "Yes" : "No"}</p>
      {user ? <p>User ID: {user.id}</p> : null}
      <h2 className="text-lg font-medium">Session and User Data</h2>
      <pre className="overflow-x-auto rounded-md bg-zinc-100 p-4 text-sm text-zinc-900">
        {JSON.stringify({ session, user }, null, 2)}
      </pre>
    </>
  );
}

export default function ServerRenderedPage() {
  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Server Rendered Page</h1>
      <Suspense fallback={<p>Loading session...</p>}>
        <AuthDetails />
      </Suspense>
    </main>
  );
}
