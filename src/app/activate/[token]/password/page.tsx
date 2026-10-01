import { ActivatePasswordClient } from "@/features/auth/activate-password-client";

export default async function ActivatePasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ActivatePasswordClient token={token} />;
}
