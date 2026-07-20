import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAppealPipeline } from "@/lib/pipeline";

const RequestBody = z.object({
  letterText: z.string().min(20, "Denial letter text is too short"),
  languages: z.array(z.enum(["en", "ar"])).optional(),
});

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let body: z.infer<typeof RequestBody>;
  try {
    body = RequestBody.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 },
    );
  }

  try {
    const result = await runAppealPipeline(body.letterText, { languages: body.languages });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Pipeline error:", err);
    return NextResponse.json({ error: "Pipeline failed — check server logs" }, { status: 500 });
  }
}
