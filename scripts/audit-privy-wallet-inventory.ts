import { PrivyClient } from "@privy-io/node";
import {
  createPrivyUsersListFn,
  runWalletInventoryAuditCli,
} from "../src/lib/auth/wallet-inventory-audit";

async function main() {
  const listUsers = createPrivyUsersListFn(() => {
    const client = new PrivyClient({
      appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
      appSecret: process.env.PRIVY_APP_SECRET ?? "",
    });

    return client.users();
  });

  const result = await runWalletInventoryAuditCli({
    argv: process.argv.slice(2),
    env: process.env,
    now: () => new Date(),
    listUsers,
  });

  process.stdout.write(result.rendered);
  process.exitCode = result.exit_code;
}

main().catch(() => {
  process.exitCode = 1;
});
