import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header and at least one data row.");
  }

  const header = lines[0].split(",").map((value) => value.trim());
  const emailIdx = header.indexOf("email");
  const authUserIdIdx = header.indexOf("supabase_user_id");

  if (emailIdx === -1 || authUserIdIdx === -1) {
    throw new Error("CSV header must include: email,supabase_user_id");
  }

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    return {
      email: values[emailIdx],
      authUserId: values[authUserIdIdx],
    };
  });
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    throw new Error("Usage: npm run auth:backfill -- <path-to-mapping.csv>");
  }

  const csv = await readFile(csvPath, "utf8");
  const rows = parseCsv(csv);

  let updated = 0;
  for (const row of rows) {
    if (!row.email || !row.authUserId) continue;

    const result = await prisma.user.updateMany({
      where: { email: row.email },
      data: { authUserId: row.authUserId },
    });
    updated += result.count;
  }

  console.log(`Backfill complete. Updated ${updated} row(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
