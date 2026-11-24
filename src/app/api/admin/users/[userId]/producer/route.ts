import { adminApiError } from "~/lib/auth/admin-api-error";
import { setProducerRole } from "~/lib/auth/producer-role-admin";

type RouteContext = { params: Promise<{ userId: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { userId } = await params;
    return Response.json(await setProducerRole(request, userId, true), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminApiError(error, "admin/users/producer");
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { userId } = await params;
    return Response.json(await setProducerRole(request, userId, false), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminApiError(error, "admin/users/producer");
  }
}
