"use client";

import PrivyAuthProvider from "~/components/providers/PrivyAuthProvider";
import { StyledConnectKitButton } from "~/components/ui/StyledConnectKitButton";

export default function NavAuthButton() {
  return (
    <PrivyAuthProvider>
      <StyledConnectKitButton />
    </PrivyAuthProvider>
  );
}
