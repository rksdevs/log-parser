import fs from "fs";
import readline from "readline";

const instanceGapMs = 3 * 60 * 60 * 1000; // 3 hours

export async function detectInstances(logPath) {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({ input: fileStream });

  const instances = [];
  let current = null;
  let lineIndex = 0;

  for await (const line of rl) {
    const match = line.match(/^\d{1,2}\/\d{1,2} \d{2}:\d{2}:\d{2}\.\d{3}/);
    if (!match) {
      lineIndex++;
      continue;
    }

    const timestamp = match[0];
    const nowYear = new Date().getFullYear();
    const [month, day] = timestamp.split(" ")[0].split("/");
    const [hour, min, secMs] = timestamp.split(" ")[1].split(":");
    const [sec, ms] = secMs.split(".");

    const ts = Date.UTC(nowYear, month - 1, day, hour, min, sec, ms);

    if (!current || ts - current.endMs > instanceGapMs) {
      if (current) instances.push(current);
      current = {
        name: timestamp,
        encounterStartTime: new Date(ts)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19),
        startMs: ts,
        endMs: ts,
        lineStart: lineIndex,
        lineEnd: lineIndex,
      };
    } else {
      current.endMs = ts;
      current.lineEnd = lineIndex;
    }

    lineIndex++;
  }

  if (current) instances.push(current);
  return instances;
}
