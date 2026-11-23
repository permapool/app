import { AuthorizationError } from "~/lib/auth/authorization";
import { EpisodeConflictError } from "~/lib/episodes/create";
import { EpisodeValidationError } from "~/lib/episodes/schedule";

export function episodeErrorResponse(error: unknown): Response | null {
  if (error instanceof AuthorizationError) {
    return Response.json({ error: error.code }, { status: error.status });
  }
  if (error instanceof EpisodeValidationError) {
    return Response.json(
      { error: "VALIDATION_ERROR", message: error.message },
      { status: 400 },
    );
  }
  if (error instanceof EpisodeConflictError) {
    return Response.json({ error: "CONFLICT" }, { status: 409 });
  }

  return null;
}
