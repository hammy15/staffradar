import { NextRequest, NextResponse } from "next/server";
import { analyzeRelocation } from "@/lib/relocation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to state codes required" }, { status: 400 });
  }

  const analysis = analyzeRelocation(from.toUpperCase(), to.toUpperCase());
  return NextResponse.json(analysis);
}
