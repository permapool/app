import { PrivyClient } from "@privy-io/node";
import {
  runWalletInventoryAuditCli,
} from "../src/lib/auth/wallet-inventory-audit";

async function main() {
  const result = await runWalletInventoryAuditCli({
    argv: process.argv.slice(2),
    env: process.env,
    now: () => new Date(),
    listUsers: async (query) => {
      const client = new PrivyClient({
        appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
        appSecret: process.env.PRIVY_APP_SECRET ?? "",
      });
      const users = client.users();
      const page = await users.list(query);

      return {
        data: page.data,
        next_cursor: page.next_cursor,
      };
    },
  });

  process.stdout.write(result.rendered);
  process.exitCode = result.exit_code;
}

main().catch(() => {
  process.exitCode = 1;
});
