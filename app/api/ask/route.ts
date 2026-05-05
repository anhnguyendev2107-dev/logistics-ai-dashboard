import { NextResponse } from "next/server";
import { ask } from "@/lib/ai/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { question?: string };
    const question = body.question ?? "";
    const result = await ask(question);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        kind: "error",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
