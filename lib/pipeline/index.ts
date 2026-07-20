import { AppealResult, AppealLetter } from "@/lib/types";
import { parseDenial } from "./parse";
import { classifyDenial } from "./classify";
import { generateAppeal } from "./generate-appeal";

export interface RunOptions {
  /** Which letter languages to generate. Defaults to the letter's own language (mixed → both). */
  languages?: Array<"en" | "ar">;
}

/** The v1 pipeline: denial letter text → parsed → classified → appeal letter(s). */
export async function runAppealPipeline(
  letterText: string,
  options: RunOptions = {},
): Promise<AppealResult> {
  const parsed = await parseDenial(letterText);
  const classified = await classifyDenial(parsed);

  const languages =
    options.languages ??
    (parsed.letterLanguage === "mixed" ? (["en", "ar"] as const) : [parsed.letterLanguage]);

  let letters: AppealLetter[] = [];
  if (classified.appealable) {
    letters = await Promise.all(
      [...languages].map((lang) => generateAppeal(parsed, classified, lang)),
    );
  }

  return { parsed, classified, letters };
}
