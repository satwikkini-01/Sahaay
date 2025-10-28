import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function DebugAuth() {
  const router = useRouter();
  const [authData, setAuthData] = useState({
    token: null,
    citizenId: null,
    citizenData: null
  });

  useEffect(() => {
    // Check localStorage for auth data
    const token = localStorage.getItem("token");
    const citizenId = localStorage.getItem("citizenId");
    const citizenData = localStorage.getItem("citizenData");
    
    setAuthData({
      token,
      citizenId,
      citizenData: citizenData ? JSON.parse(citizenData) : null
    });
    
    // If no token, redirect to login
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("citizenId");
    localStorage.removeItem("citizenData");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <Head>
        <title>Auth Debug - Sahaay</title>
      </Head>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Auth Debug
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Authentication Data</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Token</h3>
                <p className="text-sm break-words bg-gray-50 p-3 rounded mt-1">
                  {authData.token || "No token found"}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Citizen ID</h3>
                <p className="text-sm break-words bg-gray-50 p-3 rounded mt-1">
                  {authData.citizenId || "No citizen ID found"}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Citizen Data</h3>
                <pre className="text-sm bg-gray-50 p-3 rounded mt-1 overflow-x-auto">
                  {authData.citizenData ? JSON.stringify(authData.citizenData, null, 2) : "No citizen data found"}
                </pre>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="font-medium text-gray-700 mb-2">Actions</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/complaints")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to My Complaints
                </button>
                <button
                  onClick={() => router.push("/test-complaints")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Test Complaints API
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}