import Head from "next/head";
import { useState, useEffect } from "react";
import api from "../utils/api";
import ComplaintGroups from "../components/ComplaintGroups";

export default function Analytics() {
	const [analytics, setAnalytics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("overview");
	const [timeRange, setTimeRange] = useState("all");

	useEffect(() => {
		fetchAnalytics();
	}, [timeRange]); // Refetch when time range changes

	const fetchAnalytics = async () => {
		try {
			setLoading(true);
			const response = await api.get(`/api/complaints/analytics?timeRange=${timeRange}`);
			console.log('📊 Analytics data:', response.data);
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
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading analytics...</p>
				</div>
			</div>
		);
	}

	const priorityDistribution = analytics?.priorityDistribution || [];
	const categoryDistribution = analytics?.categoryDistribution || [];
	const statusDistribution = analytics?.statusDistribution || [];
	const slaBreachStats = analytics?.slaBreachStats || [];
	const summary = analytics?.summary || {};
	const groupingStats = analytics?.groupingStats || {};

	const getPriorityColor = (priority) => {
		switch (priority) {
			case "high": return "bg-red-500";
			case "medium": return "bg-yellow-500";
			case "low": return "bg-green-500";
			default: return "bg-gray-500";
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "resolved": return "bg-green-500";
			case "in-progress": return "bg-blue-500";
			case "escalated": return "bg-red-500";
			case "pending": return "bg-yellow-500";
			default: return "bg-gray-500";
		}
	};

	const getCategoryColor = (index) => {
		const colors = [
			"bg-blue-500", "bg-purple-500", "bg-green-500",
			"bg-yellow-500", "bg-red-500", "bg-indigo-500"
		];
		return colors[index % colors.length];
	};

	const totalComplaints = summary.totalComplaints || 0;

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
			<Head>
				<title>Analytics - Sahaay</title>
				<meta name="description" content="Analytics dashboard for Sahaay" />
			</Head>

			<main className="container mx-auto px-4 py-12">
				<div className="max-w-7xl mx-auto">
					{/* Header */}
					<div className="mb-8">
						<div className="text-center mb-6">
							<h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
								Analytics Dashboard
							</h2>
							<p className="text-gray-600 text-lg">
								Comprehensive insights from {totalComplaints} civic complaints
							</p>
						</div>
						
						{/* Time Range Filter */}
						<div className="flex justify-center">
							<div className="inline-flex items-center bg-white rounded-xl shadow-lg p-2">
								<span className="text-sm font-medium text-gray-600 mr-3 ml-2">📅 Time Range:</span>
								<select
									value={timeRange}
									onChange={(e) => setTimeRange(e.target.value)}
									className="px-4 py-2 border-0 rounded-lg font-medium text-sm bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition"
								>
									<option value="1day">Last 24 Hours</option>
									<option value="7days">Last 7 Days</option>
									<option value="15days">Last 15 Days</option>
									<option value="30days">Last 30 Days</option>
									<option value="6months">Last 6 Months</option>
									<option value="1year">Last Year</option>
									<option value="all">All Time</option>
								</select>
							</div>
						</div>
					</div>

					{/* Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						<div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
							<h3 className="text-sm font-medium opacity-90 mb-2">Total Complaints</h3>
							<p className="text-4xl font-bold">{totalComplaints}</p>
						</div>
						<div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
							<h3 className="text-sm font-medium opacity-90 mb-2">High Priority</h3>
							<p className="text-4xl font-bold">{summary.highPriority || 0}</p>
							<p className="text-xs opacity-75 mt-1">{totalComplaints ? ((summary.highPriority/totalComplaints)*100).toFixed(1) : 0}% of total</p>
						</div>
						<div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
							<h3 className="text-sm font-medium opacity-90 mb-2">Categories</h3>
							<p className="text-4xl font-bold">{summary.categories || 0}</p>
						</div>
						<div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
							<h3 className="text-sm font-medium opacity-90 mb-2">Grouped</h3>
							<p className="text-4xl font-bold">{groupingStats.groupedComplaints || 0}</p>
							<p className="text-xs opacity-75 mt-1">{totalComplaints ? ((groupingStats.groupedComplaints/totalComplaints)*100).toFixed(1) : 0}% grouped</p>
						</div>
					</div>

					{/* Tabs */}
					<div className="flex space-x-1 border-b border-gray-200 mb-8">
						<button
							className={`py-3 px-6 font-medium text-sm transition ${
								activeTab === "overview"
									? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
									: "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
							}`}
							onClick={() => setActiveTab("overview")}
						>
							Overview
						</button>
						<button
							className={`py-3 px-6 font-medium text-sm transition ${
								activeTab === "categories"
									? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
									: "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
							}`}
							onClick={() => setActiveTab("categories")}
						>
							Category Analysis
						</button>
						<button
							className={`py-3 px-6 font-medium text-sm transition ${
								activeTab === "groups"
									? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
									: "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
							}`}
							onClick={() => setActiveTab("groups")}
						>
							Complaint Groups
						</button>
					</div>

					{/* Tab Content */}
					{activeTab === "overview" && (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							{/* Priority Distribution */}
							<div className="bg-white rounded-xl shadow-lg p-6">
								<h3 className="text-xl font-bold text-gray-800 mb-6">Priority Distribution</h3>
								<div className="space-y-4">
									{priorityDistribution.map((item) => {
										const percentage = totalComplaints ? (item.count / totalComplaints) * 100 : 0;
										return (
											<div key={item._id} className="group hover:bg-gray-50 p-3 rounded-lg transition">
												<div className="flex items-center justify-between mb-2">
													<span className="text-sm font-medium text-gray-700 capitalize">{item._id}</span>
													<span className="text-sm font-bold text-gray-900">{item.count} ({percentage.toFixed(1)}%)</span>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-3">
													<div
														className={`h-3 rounded-full ${getPriorityColor(item._id)} transition-all duration-500`}
														style={{ width: `${percentage}%` }}
													></div>
												</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* Status Distribution */}
							<div className="bg-white rounded-xl shadow-lg p-6">
								<h3 className="text-xl font-bold text-gray-800 mb-6">Status Overview</h3>
								<div className="space-y-4">
									{statusDistribution.map((item) => {
										const percentage = totalComplaints ? (item.count / totalComplaints) * 100 : 0;
										return (
											<div key={item._id} className="group hover:bg-gray-50 p-3 rounded-lg transition">
												<div className="flex items-center justify-between mb-2">
													<span className="text-sm font-medium text-gray-700 capitalize">{item._id.replace('-', ' ')}</span>
													<span className="text-sm font-bold text-gray-900">{item.count} ({percentage.toFixed(1)}%)</span>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-3">
													<div
														className={`h-3 rounded-full ${getStatusColor(item._id)} transition-all duration-500`}
														style={{ width: `${percentage}%` }}
													></div>
												</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* SLA Breach Statistics */}
							<div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
								<h3 className="text-xl font-bold text-gray-800 mb-6">SLA Compliance by Category</h3>
								<div className="overflow-x-auto">
									<table className="min-w-full">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breached</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance Rate</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{slaBreachStats.map((item, index) => {
												const complianceRate = item.totalComplaints ? ((item.totalComplaints - item.slaBreaches) / item.totalComplaints) * 100 : 0;
												return (
													<tr key={index} className="hover:bg-gray-50">
														<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{item._id}</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalComplaints}</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{item.slaBreaches}</td>
														<td className="px-6 py-4 whitespace-nowrap">
															<div className="flex items-center">
																<div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
																	<div
																		className={`h-2 rounded-full ${complianceRate >= 75 ? 'bg-green-500' : complianceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
																		style={{ width: `${complianceRate}%` }}
																	></div>
																</div>
																<span className={`text-sm font-medium ${complianceRate >= 75 ? 'text-green-600' : complianceRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
																	{complianceRate.toFixed(1)}%
																</span>
															</div>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					)}

					{activeTab === "categories" && (
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{categoryDistribution.map((cat, index) => {
								const percentage = totalComplaints ? (cat.count / totalComplaints) * 100 : 0;
								return (
									<div key={cat._id} className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
										<div className="flex items-center justify-between mb-4">
											<h3 className="text-lg font-bold text-gray-800 capitalize">{cat._id}</h3>
											<div className={`w-12 h-12 rounded-full ${getCategoryColor(index)} flex items-center justify-center text-white font-bold text-lg`}>
												{cat.count}
											</div>
										</div>
										<div className="mb-3">
											<div className="flex justify-between text-sm text-gray-600 mb-1">
												<span>Share of Total</span>
												<span className="font-medium">{percentage.toFixed(1)}%</span>
											</div>
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className={`h-2 rounded-full ${getCategoryColor(index)}`}
													style={{ width: `${percentage}%` }}
												></div>
											</div>
										</div>
										<div className="text-sm text-gray-600">
											<div className="flex justify-between py-1">
												<span>Avg Priority Score</span>
												<span className="font-medium">{cat.avgPriorityScore?.toFixed(1) || 'N/A'}</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{activeTab === "groups" && (
						<div className="bg-white rounded-xl shadow-lg p-6">
							<ComplaintGroups />
						</div>
					)}
				</div>
			</main>
		</div>
	);
}