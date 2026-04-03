import { NextRequest } from "next/server";
import {
  ChatApiError,
  isChatReactionType,
  requireCurrentUser,
  toggleMessageReaction,
} from "~/lib/chat/server";

type Params = {
  params: Promise<{
    messageId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { messageId } = await params;
    const body = (await request.json()) as { type?: string };

    if (!body.type || !isChatReactionType(body.type)) {
      throw new ChatApiError(400, "Invalid reaction type");
    }

    const message = await toggleMessageReaction({
      messageId,
      reactionType: body.type,
      userId: user.userId,
    });

    return Response.json(message);
  } catch (error) {
    if (error instanceof ChatApiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Unable to update reaction";

    const status = message === "Missing Privy access token" ? 401 : 500;

    return Response.json({ error: message }, { status });
  }
}
