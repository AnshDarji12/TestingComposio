import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    FRONTEND_URL: process.env.FRONTEND_URL || 'Not set',
    COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY ? '***' : 'Not set',
    COMPOSIO_AUTH_CONFIG_ID: process.env.COMPOSIO_AUTH_CONFIG_ID || 'Not set',
    NODE_ENV: process.env.NODE_ENV,
  });
}
