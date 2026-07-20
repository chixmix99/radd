/**
 * Eval: run the pipeline against data/nphies/synthetic_denials.json and score
 * classification + appealability against ground truth.
 *
 * Usage: ANTHROPIC_API_KEY=... npm run eval           (all 16)
 *        ANTHROPIC_API_KEY=... npm run eval -- SD-001 (one record)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DenialRecord } from "@/lib/types";
import { parseDenial } from "@/lib/pipeline/parse";
import { classifyDenial } from "@/lib/pipeline/classify";

interface SyntheticFile {
  denials: DenialRecord[];
}

async function main() {
  const file = JSON.parse(
    readFileSync(join(process.cwd(), "data/nphies/synthetic_denials.json"), "utf-8"),
  ) as SyntheticFile;

  const filterId = process.argv[2];
  const records = filterId ? file.denials.filter((d) => d.id === filterId) : file.denials;
  if (records.length === 0) {
    console.error(`No records matched ${filterId ?? "(none)"}`);
    process.exit(1);
  }

  let codeHits = 0;
  let classHits = 0;
  let appealableHits = 0;

  for (const record of records) {
    const gt = record.ground_truth;
    process.stdout.write(`${record.id} [${record.denial_code}] ... `);
    try {
      const parsed = await parseDenial(record.denial_letter_text);
      const classified = await classifyDenial(parsed);

      const codeOk = parsed.denialCode?.toUpperCase() === record.denial_code.toUpperCase();
      const classOk = gt ? classified.classification === gt.classification : null;
      const appealOk = gt ? classified.appealable === gt.appealable : null;

      if (codeOk) codeHits++;
      if (classOk) classHits++;
      if (appealOk) appealableHits++;

      console.log(
        `code:${codeOk ? "✓" : `✗(${parsed.denialCode})`} class:${
          classOk === null ? "-" : classOk ? "✓" : `✗(${classified.classification} vs ${gt?.classification})`
        } appealable:${appealOk === null ? "-" : appealOk ? "✓" : "✗"}`,
      );
    } catch (err) {
      console.log(`ERROR: ${err instanceof Error ? err.message : err}`);
    }
  }

  const n = records.length;
  console.log(`\n=== Results (${n} records) ===`);
  console.log(`Denial code extraction: ${codeHits}/${n} (${Math.round((codeHits / n) * 100)}%)`);
  console.log(`Classification:         ${classHits}/${n} (${Math.round((classHits / n) * 100)}%)`);
  console.log(`Appealable judgement:   ${appealableHits}/${n} (${Math.round((appealableHits / n) * 100)}%)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
