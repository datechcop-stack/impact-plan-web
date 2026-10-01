import { ActivateOtpClient } from "@/features/auth/activate-otp-client";

export default async function ActivateOtpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ActivateOtpClient token={token} />;
}
