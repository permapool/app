import { PrismaClient } from "@prisma/client";
import { assertBootstrapEnvironment, bootstrapAdmin, BootstrapAdminError, type BootstrapEnvironment } from "../src/lib/auth/bootstrap-admin";

function argumentsFrom(argv: string[]) {
  let userId: string | null = null;
  let environment: BootstrapEnvironment = "dev";
  let confirm = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--user-id" && argv[index + 1]) userId = argv[++index];
    else if (argument === "--environment" && (argv[index + 1] === "dev" || argv[index + 1] === "staging")) {
      environment = argv[++index] as BootstrapEnvironment;
    } else if (argument === "--confirm") confirm = true;
    else throw new BootstrapAdminError("INVALID_USER_ID");
  }

  if (!userId) throw new BootstrapAdminError("INVALID_USER_ID");
  return { userId, environment, confirm };
}

async function main() {
  try {
    const options = argumentsFrom(process.argv.slice(2));
    const databaseUrl = process.env.DATABASE_URL ?? "";
    const target = assertBootstrapEnvironment(databaseUrl, options.environment);
    console.info(JSON.stringify({ action: "admin_bootstrap_target", ...target }));
    const db = new PrismaClient();
    let result;
    try {
      const preview = await bootstrapAdmin({ ...options, confirm: false, databaseUrl }, db);
      console.info(JSON.stringify({ action: "admin_bootstrap_preview", ...preview }));
      result = options.confirm && preview.result !== "already_admin"
        ? await bootstrapAdmin({ ...options, databaseUrl }, db)
        : preview;
    } finally {
      await db.$disconnect();
    }
    console.info(JSON.stringify({ action: "admin_bootstrap", ...result }));
    if (result.result === "preview") console.info("No write made. Rerun with --confirm to assign the first admin.");
  } catch (error) {
    console.error(JSON.stringify({ action: "admin_bootstrap", result: "refused", code: error instanceof BootstrapAdminError ? error.code : "INTERNAL_ERROR" }));
    process.exitCode = 1;
  }
}

void main();
