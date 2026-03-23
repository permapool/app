import { NextRequest } from "next/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "~/lib/prisma";
import { getCurrentUser } from "~/lib/auth/get-current-user";
import { normalizeUsername } from "~/lib/auth/user-profile";

type UpdateProfileBody = {
  username?: string;
};

async function handleUpdateProfile(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    const body = (await request.json()) as UpdateProfileBody;
    const username = body.username ? normalizeUsername(body.username) : "";

    if (!username) {
      return Response.json({ error: "Username is required." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        username,
        hasCustomHandle: true,
      },
      include: {
        wallets: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return Response.json({
      userId: updatedUser.id,
      privyId: updatedUser.privyId,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      hasCustomHandle: updatedUser.hasCustomHandle,
      wallets: updatedUser.wallets.map((wallet: { id: string; address: string; chainId: number }) => ({
        id: wallet.id,
        address: wallet.address,
        chainId: wallet.chainId,
      })),
      roles: updatedUser.userRoles.map(({ role }: { role: { id: string; name: string } }) => ({
        id: role.id,
        name: role.name,
      })),
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Username is already taken." }, { status: 409 });
    }

    const message =
      error instanceof Error ? error.message : "Unable to update profile";

    return Response.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  return handleUpdateProfile(request);
}

export async function POST(request: NextRequest) {
  return handleUpdateProfile(request);
}
