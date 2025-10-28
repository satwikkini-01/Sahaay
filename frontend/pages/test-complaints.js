import Head from "next/head";
import { useState, useEffect } from "react";
import api from "../utils/api";

export default function TestComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Check if token exists
    const storedToken = localStorage.getItem("token");
    setToken(storedToken || "No token found");
    
    if (storedToken) {
      fetchComplaintsWithDebug();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchComplaintsWithDebug = async () => {
    try {
      console.log("Fetching complaints with token:", localStorage.getItem("token"));
      
      // Test the API call manually
      const response = await fetch("http://localhost:5000/api/complaints/my-complaints", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", [...response.headers.entries()]);
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (response.ok) {
        setComplaints(data);
      } else {
        setError(`API Error: ${response.status} - ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError(`Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <Head>
        <title>Test Complaints - Sahaay</title>
      </Head>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Complaints Debug Test</h1>
          
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Token:</span> {token}</p>
              <p><span className="font-medium">Complaints Count:</span> {complaints.length}</p>
              {error && <p className="text-red-600"><span className="font-medium">Error:</span> {error}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Complaints</h2>
            {complaints.length === 0 ? (
              <p className="text-gray-500">No complaints found.</p>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div key={complaint._id} className="border-b border-gray-200 pb-4 last:border-0">
                    <h3 className="font-semibold">{complaint.title}</h3>
                    <p className="text-gray-600 text-sm">{complaint.description.substring(0, 100)}...</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {complaint.category}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}