import { ActivateMethodClient } from "@/features/auth/activate-method-client";

export default async function ActivatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ActivateMethodClient token={token} />;
}
