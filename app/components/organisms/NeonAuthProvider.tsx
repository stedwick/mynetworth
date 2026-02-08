"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

type NeonAuthProviderProps = {
  children: React.ReactNode;
};

export function NeonAuthProvider({ children }: NeonAuthProviderProps) {
  const router = useRouter();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      redirectTo="/me"
      social={{ providers: ["google"] }}
      Link={Link}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
