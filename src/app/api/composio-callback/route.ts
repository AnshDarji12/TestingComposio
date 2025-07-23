import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters from the callback URL
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get('connection_id');
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Handle alternative Composio redirect format
    const status = searchParams.get('status');
    const connectedAccountId = searchParams.get('connectedAccountId');
    const appName = searchParams.get('appName');

    // Handle OAuth error
    if (error) {
      console.error('OAuth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return NextResponse.redirect(`${frontendUrl}/?error=${encodeURIComponent(error)}`);
    }
    
    // Handle alternative Composio success format
    if (status === 'success' && connectedAccountId) {
      console.log('Composio success callback:', { status, connectedAccountId, appName });
      
      // Redirect to success page with connection details
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${frontendUrl}/?connected=true&connection_id=${connectedAccountId}&status=active&service=${appName || 'gmail'}`
      );
    }

    // If we have a connection ID, verify the connection status
    if (connectionId) {
      const apiKey = process.env.COMPOSIO_API_KEY!;
      const baseUrl = "https://backend.composio.dev";

      try {
        // Check connection status
        const response = await fetch(`${baseUrl}/api/v3/connected_accounts/${connectionId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        });

        if (response.ok) {
          const connectionData = await response.json();
          console.log('Connection verified:', connectionData);
          
          // Redirect to success page with connection details
          const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
          return NextResponse.redirect(
            `${frontendUrl}/?connected=true&connection_id=${connectionId}&status=${connectionData.status || 'active'}`
          );
        } else {
          console.error('Failed to verify connection:', response.status);
        }
      } catch (verifyError) {
        console.error('Error verifying connection:', verifyError);
      }
    }

    // Fallback: redirect with basic success indication
    const redirectUrl = new URL(process.env.FRONTEND_URL!);
    redirectUrl.searchParams.set('connected', 'true');
    
    if (connectionId) {
      redirectUrl.searchParams.set('connection_id', connectionId);
    }
    if (code) {
      redirectUrl.searchParams.set('code', code);
    }
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    return NextResponse.redirect(redirectUrl.toString());
    
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${process.env.FRONTEND_URL}/?error=callback_failed`);
  }
}