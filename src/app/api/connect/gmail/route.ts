import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = "user-123"; // TODO: Replace with real user logic
  const authConfigId = process.env.COMPOSIO_AUTH_CONFIG_ID!;
  const apiKey = process.env.COMPOSIO_API_KEY!;
  const baseUrl = "https://backend.composio.dev";
  const redirectUrl = process.env.FRONTEND_URL 
    ? `${process.env.FRONTEND_URL}/api/composio-callback`
    : "http://localhost:3000/api/composio-callback"; // Fallback for testing

  const response = await fetch(`${baseUrl}/api/v3/connected_accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      auth_config: { id: authConfigId },
      connection: {
        user_id: userId,
        config: {redirectUrl},
      },
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.redirect(data.redirect_url);
}
