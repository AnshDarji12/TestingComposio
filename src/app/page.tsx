'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/base/buttons/button";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [connections, setConnections] = useState({
    gmail: false,
    notion: false,
    docs: false,
  });
  const [connectionStatus, setConnectionStatus] = useState<{
    gmail?: { id?: string; status?: string; error?: string };
    notion?: { id?: string; status?: string; error?: string };
    docs?: { id?: string; status?: string; error?: string };
  }>({});
  const [loading, setLoading] = useState<{
    gmail?: boolean;
    notion?: boolean;
    docs?: boolean;
  }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      
      // Handle OAuth callback
      const connected = params.get("connected");
      const connectionId = params.get("connection_id");
      const status = params.get("status");
      const error = params.get("error");
      const service = params.get("service") || "gmail"; // Default to gmail for backward compatibility
      
      if (connected === "true") {
        setLoggedIn(true);
        
        // Update connection status for the specific service
        setConnections((prev) => ({ ...prev, [service]: true }));
        setConnectionStatus((prev) => ({
          ...prev,
          [service]: {
            id: connectionId || undefined,
            status: status || "active",
            error: undefined,
          },
        }));
        
        // Show success message
        console.log(`${service} connected successfully!`, { service, connectionId, status });
        
        // If status is not active, start polling
        if (status && status !== "active" && connectionId) {
          pollConnectionStatus(connectionId, service as "gmail" | "notion" | "docs");
        }
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        // Handle OAuth error
        setConnectionStatus((prev) => ({
          ...prev,
          gmail: {
            error: decodeURIComponent(error),
          },
        }));
        
        console.error("OAuth error:", error);
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Legacy support for old callback format
      if (params.get("connected") === "gmail") {
        setLoggedIn(true);
        setConnections((prev) => ({ ...prev, gmail: true }));
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Poll connection status for non-active connections
  const pollConnectionStatus = async (connectionId: string, service: "gmail" | "notion" | "docs" = "gmail") => {
    const maxAttempts = 10;
    const pollInterval = 3000; // 3 seconds
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`/api/connection-status?connection_id=${connectionId}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === "active") {
            setConnectionStatus((prev) => ({
              ...prev,
              [service]: {
                ...prev[service],
                status: "active",
              },
            }));
            console.log(`${service} connection is now active!`);
            break;
          }
        }
      } catch (error) {
        console.error("Error polling connection status:", error);
      }
      
      // Wait before next poll
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
  };

  const handleConnect = async (service: "gmail" | "notion" | "docs") => {
    if (service === "gmail") {
      setLoading((prev) => ({ ...prev, gmail: true }));
      // Clear any previous errors
      setConnectionStatus((prev) => ({
        ...prev,
        gmail: { ...prev.gmail, error: undefined },
      }));
      
      try {
        // Redirect to OAuth flow
        window.location.href = "/api/connect/gmail";
      } catch (error) {
        console.error("Failed to initiate connection:", error);
        setConnectionStatus((prev) => ({
          ...prev,
          gmail: { error: "Failed to initiate connection" },
        }));
        setLoading((prev) => ({ ...prev, gmail: false }));
      }
    } else {
      // For other services, just update the state (placeholder)
      setConnections((prev) => ({ ...prev, [service]: true }));
    }
  };
  
  const handleDisconnect = async (service: "gmail" | "notion" | "docs") => {
    if (service === "gmail") {
      setLoading((prev) => ({ ...prev, gmail: true }));
      
      try {
        // Here you would typically call an API to disconnect
        // For now, just update the local state
        setConnections((prev) => ({ ...prev, gmail: false }));
        setConnectionStatus((prev) => ({ ...prev, gmail: undefined }));
        console.log("Gmail disconnected");
      } catch (error) {
        console.error("Failed to disconnect:", error);
      } finally {
        setLoading((prev) => ({ ...prev, gmail: false }));
      }
    } else {
      setConnections((prev) => ({ ...prev, [service]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8">
      <h1 className="text-2xl font-bold mb-2">Connect Your Accounts</h1>
      
      {/* Connection Status Display */}
      <div className="bg-gray-800 p-4 rounded-lg w-full max-w-xs">
        <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Gmail:</span>
            <span className={connections.gmail ? "text-green-400" : "text-red-400"}>
              {connections.gmail ? "✅ Connected" : "❌ Not Connected"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Notion:</span>
            <span className={connections.notion ? "text-green-400" : "text-red-400"}>
              {connections.notion ? "✅ Connected" : "❌ Not Connected"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Docs:</span>
            <span className={connections.docs ? "text-green-400" : "text-red-400"}>
              {connections.docs ? "✅ Connected" : "❌ Not Connected"}
            </span>
          </div>
        </div>
        
        {/* Debug Tools */}
        <div className="mt-4">
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/check-auth-config');
                const data = await response.json();
                console.log('Auth Config Check:', data);
                alert(`Current Redirect URL: ${data.currentRedirectUrl}\nExpected: ${data.expectedRedirectUrl}\nIs Correct: ${data.isCorrect}`);
                
                if (!data.isCorrect) {
                  const updateResponse = await fetch('/api/check-auth-config', { method: 'POST' });
                  const updateData = await updateResponse.json();
                  if (updateData.success) {
                    alert('Auth config updated! Try connecting again.');
                  } else {
                    alert('Failed to update auth config: ' + updateData.error);
                  }
                }
              } catch (error) {
                console.error('Error:', error);
                alert('Error checking auth config');
              }
            }}
            className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
          >
            🔧 Check & Fix Redirect URL
          </button>
        </div>
      </div>
      {!loggedIn ? (
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <h2 className="text-xl font-bold text-white">Welcome</h2>
          <Button
            size="lg"
            onClick={() => setLoggedIn(true)}
            className="w-full bg-purple-600 text-white hover:bg-purple-700 border-none"
          >
            Login
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <div className="w-full">
            <Button
              size="lg"
              onClick={() => {
                if (connections.gmail) {
                  handleDisconnect("gmail");
                } else {
                  handleConnect("gmail");
                }
              }}
              disabled={loading.gmail}
              color={connections.gmail ? "primary-destructive" : undefined}
              className={connections.gmail ? "w-full" : "w-full bg-purple-600 text-white hover:bg-purple-700 border-none"}
            >
              {loading.gmail
                ? "Connecting..."
                : connections.gmail
                ? "✅ Disconnect Gmail"
                : "Connect Gmail"}
            </Button>
            
            {connectionStatus.gmail?.status && connections.gmail && (
              <div className="mt-2 text-sm text-green-400">
                Status: {connectionStatus.gmail.status}
                {connectionStatus.gmail.id && (
                  <div className="text-xs text-gray-400 mt-1">
                    ID: {connectionStatus.gmail.id.slice(0, 8)}...
                  </div>
                )}
              </div>
            )}
            
            {connectionStatus.gmail?.error && (
              <div className="mt-2 text-sm text-red-400">
                Error: {connectionStatus.gmail.error}
              </div>
            )}
          </div>
          <Button
            size="lg"
            onClick={() =>
              connections.notion
                ? handleDisconnect("notion")
                : handleConnect("notion")
            }
            color={connections.notion ? "primary-destructive" : undefined}
            className={connections.notion ? "w-full" : "w-full bg-purple-600 text-white hover:bg-purple-700 border-none"}
          >
            {connections.notion ? "Disconnect" : "Connect Notion"}
          </Button>
          <Button
            size="lg"
            onClick={() =>
              connections.docs
                ? handleDisconnect("docs")
                : handleConnect("docs")
            }
            color={connections.docs ? "primary-destructive" : undefined}
            className={connections.docs ? "w-full" : "w-full bg-purple-600 text-white hover:bg-purple-700 border-none"}
          >
            {connections.docs ? "Disconnect" : "Connect Docs"}
          </Button>
        </div>
      )}
    </div>
  );
}
