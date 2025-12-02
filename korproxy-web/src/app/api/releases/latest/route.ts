import { NextResponse } from "next/server";
import { getLatestRelease } from "@/lib/github";

export async function GET() {
  const release = await getLatestRelease();
  
  if (!release) {
    return NextResponse.json(null, { status: 404 });
  }
  
  return NextResponse.json(release);
}
