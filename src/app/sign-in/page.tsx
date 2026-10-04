import { Suspense } from "react";
import { SignInClient } from "@/features/auth/sign-in-client";
import { StateView } from "@/components/ui/state-view";

export default function SignInPage() {
  return (
    <Suspense fallback={<StateView state="loading" />}>
      <SignInClient />
    </Suspense>
  );
}
