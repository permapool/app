import { NextRequest } from "next/server";
import {
  ChatApiError,
  createChatMessage,
  requireCurrentUser,
} from "~/lib/chat/server";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser(request);
    const body = (await request.json()) as { content?: string };
    const message = await createChatMessage({
      content: body.content ?? "",
      userId: user.userId,
    });

    return Response.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof ChatApiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Unable to create message";

    const status = message === "Missing Privy access token" ? 401 : 500;

    return Response.json({ error: message }, { status });
  }
}
