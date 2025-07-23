import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY!;
    const authConfigId = process.env.COMPOSIO_AUTH_CONFIG_ID!;
    const baseUrl = "https://backend.composio.dev";

    // Get current auth config
    const response = await fetch(`${baseUrl}/api/v3/auth_configs/${authConfigId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch auth config" }, { status: 500 });
    }

    const authConfig = await response.json();
    
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const expectedRedirectUrl = `${frontendUrl}/api/composio-callback`;
    
    return NextResponse.json({
      authConfig,
      currentRedirectUrl: authConfig.redirect_url || authConfig.redirectUrl,
      expectedRedirectUrl,
      isCorrect: (authConfig.redirect_url || authConfig.redirectUrl) === expectedRedirectUrl,
      frontendUrlSet: !!process.env.FRONTEND_URL
    });

  } catch (error) {
    console.error("Auth config check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY!;
    const authConfigId = process.env.COMPOSIO_AUTH_CONFIG_ID!;
    const baseUrl = "https://backend.composio.dev";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const correctRedirectUrl = `${frontendUrl}/api/composio-callback`;

    // Update auth config with correct redirect URL
    const response = await fetch(`${baseUrl}/api/v3/auth_configs/${authConfigId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        redirect_url: correctRedirectUrl,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to update auth config" }, { status: 500 });
    }

    const updatedConfig = await response.json();
    
    return NextResponse.json({
      success: true,
      message: "Auth config updated successfully",
      redirectUrl: correctRedirectUrl,
      updatedConfig
    });

  } catch (error) {
    console.error("Auth config update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
