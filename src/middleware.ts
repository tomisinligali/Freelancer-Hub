import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Fast, route-level guard: unauthenticated requests never reach /dashboard.
  matcher: ["/dashboard/:path*"],
};