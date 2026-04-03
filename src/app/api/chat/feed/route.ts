import { NextRequest } from "next/server";
import {
  ChatApiError,
  fetchChatFeed,
  getOptionalViewerUserId,
} from "~/lib/chat/server";

export async function GET(request: NextRequest) {
  try {
    const viewerUserId = await getOptionalViewerUserId(request);
    const since = request.nextUrl.searchParams.get("since");
    const response = await fetchChatFeed({
      since,
      viewerUserId,
    });

    return Response.json(response);
  } catch (error) {
    if (error instanceof ChatApiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Unable to load chat feed";

    return Response.json({ error: message }, { status: 500 });
  }
}
