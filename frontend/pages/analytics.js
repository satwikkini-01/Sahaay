import Head from "next/head";
import { useState, useEffect } from "react";
import api from "../utils/api";
import ComplaintGroups from "../components/ComplaintGroups";

export default function Analytics() {
	const [analytics, setAnalytics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("overview");

	useEffect(() => {
		fetchAnalytics();
	}, []);

	const fetchAnalytics = async () => {
		try {
			const response = await api.get("/api/complaints/analytics");
			setAnalytics(response.data);
		} catch (error) {
			console.error("Error fetching analytics:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	const priorityDistribution = analytics?.priorityDistribution || [];
	const slaBreachStats = analytics?.slaBreachStats || [];
	const groupingStats = analytics?.groupingStats?.[0] || {};

	const getPriorityColor = (priority) => {
		switch (priority) {
			case "high": return "bg-red-500";
			case "medium": return "bg-yellow-500";
			case "low": return "bg-green-500";
			default: return "bg-gray-500";
		}
	};

	const getCategoryColor = (index) => {
		const colors = [
			"bg-blue-500",
			"bg-purple-500",
			"bg-green-500",
			"bg-yellow-500",
			"bg-red-500",
			"bg-indigo-500",
			"bg-pink-500",
			"bg-teal-500"
		];
		return colors[index % colors.length];
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
			<Head>
				<title>Analytics - Sahaay</title>
				<meta name="description" content="Analytics dashboard for Sahaay" />
			</Head>

			<main className="container mx-auto px-4 py-12">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						Analytics Dashboard
					</h2>
					<p className="text-gray-600 text-center mb-12">
						Insights and trends from citizen complaints
					</p>

					{/* Tabs */}
					<div className="flex border-b border-gray-200 mb-8">
						<button
							className={`py-2 px-4 font-medium text-sm ${activeTab === "overview" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
							onClick={() => setActiveTab("overview")}
						>
							Overview
						</button>
						<button
							className={`py-2 px-4 font-medium text-sm ${activeTab === "groups" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
							onClick={() => setActiveTab("groups")}
						>
							Complaint Groups
						</button>
					</div>

					{activeTab === "overview" ? (
						<div className="space-y-12">
							{/* Key Metrics */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
								<div className="bg-white rounded-xl shadow p-6">
									<h3 className="text-lg font-semibold text-gray-800 mb-2">Total Complaints</h3>
									<p className="text-3xl font-bold text-blue-600">{groupingStats.totalComplaints || 0}</p>
								</div>
								<div className="bg-white rounded-xl shadow p-6">
									<h3 className="text-lg font-semibold text-gray-800 mb-2">Grouped Complaints</h3>
									<p className="text-3xl font-bold text-purple-600">{groupingStats.groupedComplaints || 0}</p>
								</div>
								<div className="bg-white rounded-xl shadow p-6">
									<h3 className="text-lg font-semibold text-gray-800 mb-2">Avg Group Size</h3>
									<p className="text-3xl font-bold text-green-600">
										{groupingStats.averageGroupSize ? groupingStats.averageGroupSize.toFixed(1) : "0.0"}
									</p>
								</div>
								<div className="bg-white rounded-xl shadow p-6">
									<h3 className="text-lg font-semibold text-gray-800 mb-2">Grouping Rate</h3>
									<p className="text-3xl font-bold text-yellow-600">
										{groupingStats.totalComplaints && groupingStats.groupedComplaints
											? ((groupingStats.groupedComplaints / groupingStats.totalComplaints) * 100).toFixed(1)
											: "0.0"}%
									</p>
								</div>
							</div>

							{/* Priority Distribution */}
							<div className="bg-white rounded-xl shadow p-6">
								<h3 className="text-xl font-semibold text-gray-800 mb-6">Priority Distribution</h3>
								<div className="space-y-4">
									{priorityDistribution.map((item, index) => (
										<div key={item._id} className="flex items-center">
											<div className="w-32 text-sm font-medium text-gray-700 capitalize">
												{item._id || "Unknown"}
											</div>
											<div className="flex-1 ml-4">
												<div className="flex items-center">
													<div className="w-full bg-gray-200 rounded-full h-4">
														<div
															className={`h-4 rounded-full ${getPriorityColor(item._id)}`}
															style={{ width: `${(item.count / (priorityDistribution.reduce((sum, p) => sum + p.count, 0) || 1)) * 100}%` }}
														></div>
													</div>
													<div className="ml-4 text-sm font-medium text-gray-700 w-16">
														{item.count}
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* SLA Breach Statistics */}
							<div className="bg-white rounded-xl shadow p-6">
								<h3 className="text-xl font-semibold text-gray-800 mb-6">SLA Breach Statistics</h3>
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Category
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Total Complaints
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Breached SLA
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Breach Rate
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{slaBreachStats.map((item, index) => (
												<tr key={index}>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
														{item._id}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
														{item.totalComplaints}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
														{item.slaBreaches}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="flex items-center">
															<div className="w-24 bg-gray-200 rounded-full h-2">
																<div
																	className={`h-2 rounded-full ${item.slaBreaches / item.totalComplaints > 0.5 ? "bg-red-500" : "bg-green-500"}`}
																	style={{ width: `${(item.slaBreaches / (item.totalComplaints || 1)) * 100}%` }}
																></div>
															</div>
															<span className="ml-2 text-sm text-gray-500">
																{item.totalComplaints ? ((item.slaBreaches / item.totalComplaints) * 100).toFixed(1) : 0}%
															</span>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					) : (
						<div className="bg-white rounded-xl shadow p-6">
							<ComplaintGroups />
						</div>
					)}
				</div>
			</main>
		</div>
	);
}