import { neonAuthMiddleware } from "@neondatabase/auth/next/server";

export default neonAuthMiddleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/account/:path*",
    "/action",
    "/api/crypto/:path*",
    "/api/stocks/:path*",
    "/api/secure-api-route",
    "/api/version",
    "/assets/:path*",
    "/categories/:path*",
    "/client-rendered-page",
    "/me/:path*",
    "/server-rendered-page",
  ],
};
