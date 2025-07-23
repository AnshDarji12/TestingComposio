import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get('connection_id');

    if (!connectionId) {
      return NextResponse.json({ error: "Missing connection_id" }, { status: 400 });
    }

    const apiKey = process.env.COMPOSIO_API_KEY!;
    const baseUrl = "https://backend.composio.dev";

    // Check connection status with Composio API
    const response = await fetch(`${baseUrl}/api/v3/connected_accounts/${connectionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch connection status" }, { status: 500 });
    }

    const connectionData = await response.json();
    
    return NextResponse.json({
      status: connectionData.status || "unknown",
      connection_id: connectionId,
      data: connectionData,
    });

  } catch (error) {
    console.error("Connection status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
