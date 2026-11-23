import { createHostedEpisode } from "~/lib/episodes/create";
import { episodeErrorResponse } from "~/lib/episodes/api-error";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "VALIDATION_ERROR", message: "Enter session details." },
      { status: 400 },
    );
  }

  try {
    const result = await createHostedEpisode(request, body);
    return Response.json(result.episode, { status: result.created ? 201 : 200 });
  } catch (error) {
    const response = episodeErrorResponse(error);
    if (response) return response;

    console.error("[episodes] failed to create session", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
