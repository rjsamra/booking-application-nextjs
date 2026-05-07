import { getRegister } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const register = getRegister();
  const body = await register.metrics();
  return new Response(body, {
    headers: {
      "Content-Type": register.contentType,
    },
  });
}
