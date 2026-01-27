import { authServer } from "@/lib/auth/server";

export async function GET() {
  const { data } = await authServer.getSession();

  if (!data?.session) {
    return new Response(JSON.stringify({ error: "Unauthenticated" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(
    JSON.stringify({
      session: data.session,
      user: data.user,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
