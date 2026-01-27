import { neonAuth } from "@neondatabase/auth/next/server";

export default async function ServerRenderedPage() {
  const { session, user } = await neonAuth();

  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Server Rendered Page</h1>
      <p>Authenticated: {session ? "Yes" : "No"}</p>
      {user ? <p>User ID: {user.id}</p> : null}
      <h2 className="text-lg font-medium">Session and User Data</h2>
      <pre className="overflow-x-auto rounded-md bg-zinc-100 p-4 text-sm text-zinc-900">
        {JSON.stringify({ session, user }, null, 2)}
      </pre>
    </main>
  );
}
