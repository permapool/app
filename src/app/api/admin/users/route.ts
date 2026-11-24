import { adminApiError } from "~/lib/auth/admin-api-error";
import { listUsersForProducerAccess } from "~/lib/auth/producer-role-admin";

export async function GET(request: Request) {
  try {
    return Response.json({ users: await listUsersForProducerAccess(request) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminApiError(error, "admin/users");
  }
}
