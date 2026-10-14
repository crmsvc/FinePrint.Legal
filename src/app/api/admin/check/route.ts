import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/site/admin-auth";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({ authenticated });
}
