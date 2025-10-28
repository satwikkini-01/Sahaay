import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "../../utils/api";
import { withAuth } from "../../utils/withAuth";

function MyComplaints() {
	const [complaints, setComplaints] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState("all");
	const [debugInfo, setDebugInfo] = useState({});

	useEffect(() => {
		fetchComplaints();
	}, []);

	const fetchComplaints = async () => {
		try {
			// Debug information
			const token = localStorage.getItem("token");
			const citizenId = localStorage.getItem("citizenId");
			
			setDebugInfo({
				token: token ? `${token.substring(0, 20)}...` : "No token",
				citizenId: citizenId || "No citizenId",
				timestamp: new Date().toISOString()
			});
			
			console.log("Fetching complaints with debug info:", {
				token: token ? `${token.substring(0, 20)}...` : "No token",
				citizenId: citizenId || "No citizenId"
			});
			
			const response = await api.get("/api/complaints/my-complaints");
			console.log("Received complaints response:", response.data);
			setComplaints(response.data);
		} catch (error) {
			console.error("Error fetching complaints:", error);
			console.error("Error response:", error.response?.data);
		} finally {
			setLoading(false);
		}
	};

	const filteredComplaints = complaints.filter(complaint => {
		if (filter === "all") return true;
		return complaint.status === filter;
	});

	const getStatusColor = (status) => {
		switch (status) {
			case "resolved": return "bg-green-100 text-green-800";
			case "in-progress": return "bg-yellow-100 text-yellow-800";
			case "escalated": return "bg-purple-100 text-purple-800";
			default: return "bg-gray-100 text-gray-800";
		}
	};

	const getPriorityColor = (priority) => {
		switch (priority) {
			case "high": return "bg-red-100 text-red-800";
			case "medium": return "bg-yellow-100 text-yellow-800";
			case "low": return "bg-green-100 text-green-800";
			default: return "bg-gray-100 text-gray-800";
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading complaints...</p>
					{debugInfo.token && (
						<div className="mt-4 text-xs text-gray-500">
							<p>Token: {debugInfo.token}</p>
							<p>Citizen ID: {debugInfo.citizenId}</p>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
			<Head>
				<title>My Complaints - Sahaay</title>
				<meta name="description" content="View your complaints on Sahaay" />
			</Head>

			<main className="container mx-auto px-4 py-12">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
						<div>
							<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
								My Complaints
							</h2>
							<p className="text-gray-600 mt-2">
								Track the status of your submitted complaints
							</p>
						</div>
						<Link
							href="/complaints/new"
							className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
						>
							File New Complaint
						</Link>
					</div>
					
					{/* Debug Info */}
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm">
						<h3 className="font-semibold text-yellow-800 mb-2">Debug Information</h3>
						<p>Token: {debugInfo.token}</p>
						<p>Citizen ID: {debugInfo.citizenId}</p>
						<p>Complaints Count: {complaints.length}</p>
					</div>

					{/* Filters */}
					<div className="mb-6 flex flex-wrap gap-2">
						<button
							onClick={() => setFilter("all")}
							className={`px-4 py-2 rounded-lg font-medium ${
								filter === "all"
									? "bg-blue-600 text-white"
									: "bg-white text-gray-700 hover:bg-gray-100"
							}`}
						>
							All Complaints
						</button>
						<button
							onClick={() => setFilter("pending")}
							className={`px-4 py-2 rounded-lg font-medium ${
								filter === "pending"
									? "bg-blue-600 text-white"
									: "bg-white text-gray-700 hover:bg-gray-100"
							}`}
						>
							Pending
						</button>
						<button
							onClick={() => setFilter("in-progress")}
							className={`px-4 py-2 rounded-lg font-medium ${
								filter === "in-progress"
									? "bg-blue-600 text-white"
									: "bg-white text-gray-700 hover:bg-gray-100"
							}`}
						>
							In Progress
						</button>
						<button
							onClick={() => setFilter("resolved")}
							className={`px-4 py-2 rounded-lg font-medium ${
								filter === "resolved"
									? "bg-blue-600 text-white"
									: "bg-white text-gray-700 hover:bg-gray-100"
							}`}
						>
							Resolved
						</button>
					</div>

					{/* Complaints List */}
					{filteredComplaints.length === 0 ? (
						<div className="bg-white rounded-2xl shadow-xl p-12 text-center">
							<svg
								className="mx-auto h-16 w-16 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<h3 className="mt-4 text-xl font-medium text-gray-900">
								No complaints found
							</h3>
							<p className="mt-2 text-gray-500">
								Get started by filing a new complaint.
							</p>
							<Link
								href="/complaints/new"
								className="mt-6 inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
							>
								File New Complaint
							</Link>
						</div>
					) : (
						<div className="grid gap-6">
							{filteredComplaints.map((complaint) => (
								<div
									key={complaint._id}
									className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow p-6"
								>
									<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
										<div>
											<h3 className="text-xl font-bold text-gray-800">
												{complaint.title}
											</h3>
											<div className="flex flex-wrap items-center gap-2 mt-2">
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
													{complaint.category}
												</span>
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
													{complaint.status.replace("-", " ")}
												</span>
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
													{complaint.priority}
												</span>
												{complaint.groupSize > 1 && (
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
														Group: {complaint.groupSize} similar
													</span>
												)}
											</div>
											<p className="mt-3 text-gray-600">
												{complaint.description.substring(0, 150)}...
											</p>
											<div className="mt-3 text-sm text-gray-500">
												Submitted on {new Date(complaint.createdAt).toLocaleDateString()}
											</div>
										</div>
										<div className="flex-shrink-0">
											<Link
												href={`/complaints/${complaint._id}`}
												className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
											>
												View Details
											</Link>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}

export default withAuth(MyComplaints);