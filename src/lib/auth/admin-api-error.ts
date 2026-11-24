import { AuthorizationError } from "~/lib/auth/authorization";

export function adminApiError(error: unknown, route: string): Response {
  if (error instanceof AuthorizationError) {
    return Response.json({ error: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }

  console.error(JSON.stringify({ route, result: "error", errorName: error instanceof Error ? error.name : "UnknownError" }));
  return Response.json({ error: "INTERNAL_ERROR" }, { status: 500, headers: { "Cache-Control": "no-store" } });
}
