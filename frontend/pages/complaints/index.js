import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "../../utils/api";

export default function Complaints() {
	const [filter, setFilter] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [complaints, setComplaints] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		loadComplaints();
	}, []);

	const loadComplaints = async () => {
		try {
			setLoading(true);
			// Fetch only complaints for the authenticated user
			const response = await api.get("/api/complaints/my-complaints");
			setComplaints(response.data);
			setError(null);
		} catch (error) {
			console.error("Error loading complaints:", error);
			if (error?.response?.status === 401 || error?.response?.status === 403) {
				setError(
					"You must be logged in to view your complaints. Please log in."
				);
			} else {
				setError("Failed to load complaints. Please try again later.");
			}
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status) => {
		// Normalize status to handle variants like "in-progress"
		const key = (status || "").replace(/-/g, " ").toLowerCase();
		const colors = {
			pending: "bg-yellow-100 text-yellow-800",
			"in progress": "bg-blue-100 text-blue-800",
			resolved: "bg-green-100 text-green-800",
			escalated: "bg-red-100 text-red-800",
		};
		return colors[key] || "bg-gray-100 text-gray-800";
	};

	const getPriorityColor = (priority) => {
		const key = (priority || "").toLowerCase();
		const colors = {
			low: "bg-gray-100 text-gray-800",
			medium: "bg-yellow-100 text-yellow-800",
			high: "bg-orange-100 text-orange-800",
			critical: "bg-red-100 text-red-800",
		};
		return colors[key] || "bg-gray-100 text-gray-800";
	};

	// Filter complaints based on status filter and search term
	const filterComplaints = () => {
		const term = (searchTerm || "").trim().toLowerCase();
		return (complaints || []).filter((c) => {
			// Status filter (normalize both sides)
			if (filter && filter !== "all") {
				const statusRaw = c?.status || "";
				const statusKey = statusRaw.replace(/-/g, " ").toLowerCase();
				if (statusKey !== filter) return false;
			}

			// Search term filter
			if (term) {
				const hay = [
					c?.title,
					c?.description,
					c?.category,
					c?.department?.name,
					c?.department,
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();
				if (!hay.includes(term)) return false;
			}

			return true;
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading complaints...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 flex items-center justify-center">
				<div className="text-center max-w-md mx-auto p-6">
					<div className="text-red-600 text-xl mb-4">⚠️</div>
					<p className="text-gray-800 mb-4">{error}</p>
					<button
						onClick={loadComplaints}
						className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
			<Head>
				<title>My Complaints - Sahaay</title>
				<meta
					name="description"
					content="View and track your complaints on Sahaay"
				/>
			</Head>

			<div className="container mx-auto flex justify-between items-center px-6 py-4">
				<h1 className="text-2xl font-semibold text-gray-800">My Complaints</h1>
				<Link
					href="/complaints/new"
					className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
				>
					File New Complaint
				</Link>
			</div>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-12">
				{/* Control Panel */}
				<div className="bg-white rounded-xl shadow-lg p-6 mb-8">
					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						{/* Search */}
						<div className="w-full md:w-1/3">
							<input
								type="text"
								placeholder="Search complaints..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						{/* Filters */}
						<div className="flex gap-2">
							{["All", "Pending", "In Progress", "Resolved", "Rejected"].map(
								(status) => (
									<button
										key={status}
										onClick={() => setFilter(status.toLowerCase())}
										className={`px-4 py-2 rounded-lg font-medium transition-colors ${
											filter === status.toLowerCase()
												? "bg-blue-600 text-white"
												: "bg-gray-100 text-gray-600 hover:bg-gray-200"
										}`}
									>
										{status}
									</button>
								)
							)}
						</div>
					</div>
				</div>

				{/* Complaints List */}
				<div className="grid gap-6">
					{filterComplaints().map((complaint) => {
						const createdDate = new Date(complaint.createdAt);
						const formattedDate = createdDate.toLocaleDateString("en-US", {
							year: "numeric",
							month: "short",
							day: "numeric",
						});

						return (
							<div
								key={complaint._id}
								className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
							>
								<div className="flex flex-col md:flex-row justify-between gap-4">
									<div className="flex-1">
										<div className="flex items-center gap-4 mb-2">
											<h3 className="text-xl font-semibold">
												{complaint.title}
											</h3>
											<span className="text-sm text-gray-500">
												#{String(complaint._id).slice(-6).toUpperCase()}
											</span>
										</div>
										<p className="text-gray-600 mb-4">
											{complaint.description}
										</p>
										<div className="flex flex-wrap gap-4 text-sm">
											<div className="flex items-center gap-2">
												<span className="text-gray-500">Category:</span>
												<span className="font-medium">
													{complaint.category}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-gray-500">Location:</span>
												<span className="font-medium">
													{typeof complaint.location === "string"
														? complaint.location
														: complaint.location?.address
														? complaint.location.address
														: Array.isArray(complaint.location?.coordinates)
														? complaint.location.coordinates.join(", ")
														: "—"}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-gray-500">Date:</span>
												<span className="font-medium">{formattedDate}</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-gray-500">Department:</span>
												<span className="font-medium">
													{typeof complaint.department === "string"
														? complaint.department
														: complaint.department?.name ??
														  complaint.department?.pgDeptId ??
														  "—"}
												</span>
											</div>
										</div>
									</div>
									<div className="flex flex-col gap-2 min-w-[150px]">
										<span
											className={`px-3 py-1 rounded-full text-sm font-medium text-center ${getStatusColor(
												complaint.status
											)}`}
										>
											{complaint.status}
										</span>
										<span
											className={`px-3 py-1 rounded-full text-sm font-medium text-center ${getPriorityColor(
												complaint.priority
											)}`}
										>
											{complaint.priority} Priority
										</span>
										<Link
											href={`/complaints/${complaint._id}`}
											className="mt-2 text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
										>
											View Details
										</Link>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Empty State */}
				{filterComplaints().length === 0 && (
					<div className="text-center py-12">
						<div className="text-6xl mb-4">🔍</div>
						<h3 className="text-xl font-semibold text-gray-800 mb-2">
							No complaints found
						</h3>
						<p className="text-gray-600">
							{searchTerm
								? "Try adjusting your search criteria"
								: filter !== "all"
								? "Try changing the status filter"
								: "You haven't filed any complaints yet"}
						</p>
						<Link
							href="/complaints/new"
							className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
						>
							File Your First Complaint
						</Link>
					</div>
				)}
			</main>
		</div>
	);
}
