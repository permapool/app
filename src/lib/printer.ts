function isChatPrinterEnabled() {
  return process.env.CHAT_PRINTER_ENABLED === "true";
}

function getPrinterConfig() {
  const host = process.env.PRINTER_HOST?.trim();
  const token = process.env.PRINTER_AUTH_TOKEN?.trim();

  if (!host || !token) {
    return null;
  }

  return { host, token };
}

export async function printChatMessage({
  username,
  message,
}: {
  username: string;
  message: string;
}) {
  if (!isChatPrinterEnabled()) {
    return;
  }

  const config = getPrinterConfig();

  if (!config) {
    console.error(
      "[printer] CHAT_PRINTER_ENABLED is set but PRINTER_HOST or PRINTER_AUTH_TOKEN is missing",
    );
    return;
  }

  const response = await fetch(`${config.host}/print`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: `${username}: ${message}` }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("[printer] print request failed", response.status, body);
  }
}
