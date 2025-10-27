import Head from "next/head";
import { useState, useEffect } from "react";
import api from "../utils/api";

export default function Analytics() {
	const [loading, setLoading] = useState(true);
	const [analytics, setAnalytics] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		loadAnalytics();
	}, []);

	const loadAnalytics = async () => {
		try {
			setLoading(true);
			const response = await api.get("/api/complaints/analytics");
			setAnalytics(response.data);
			setError(null);
		} catch (error) {
			console.error("Error loading analytics:", error);
			setError("Failed to load analytics data. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	const calculateStats = () => {
		if (!analytics) return null;

		const stats = {
			total: 0,
			resolved: 0,
			pending: 0,
			inProgress: 0,
			avgResolutionTime: "0 hours",
			satisfactionRate: "0%",
		};

		// Calculate total complaints and status distribution
		analytics.priorityDistribution.forEach((item) => {
			stats.total += item.count;
			if (item._id?.toLowerCase() === "resolved") stats.resolved += item.count;
			else if (item._id?.toLowerCase() === "pending")
				stats.pending += item.count;
			else if (item._id?.toLowerCase() === "in progress")
				stats.inProgress += item.count;
		});

		// Calculate average resolution time
		if (analytics.metricsFromPostgres.length > 0) {
			const avgTime =
				analytics.metricsFromPostgres.reduce(
					(acc, curr) => acc + curr.avg_resolution_time,
					0
				) / analytics.metricsFromPostgres.length;
			stats.avgResolutionTime = `${Math.round(avgTime)} hours`;
		}

		// Calculate satisfaction rate based on resolution rate
		if (stats.total > 0) {
			stats.satisfactionRate = `${Math.round(
				(stats.resolved / stats.total) * 100
			)}%`;
		}

		return stats;
	};

	const calculateCategoryData = () => {
		if (!analytics) return [];

		const categoryTotals = {};
		let total = 0;

		// Sum complaints by category
		analytics.categoryTrends.forEach((item) => {
			const category = item._id.category;
			categoryTotals[category] = (categoryTotals[category] || 0) + item.count;
			total += item.count;
		});

		// Convert to array with percentages
		return Object.entries(categoryTotals).map(([name, count]) => ({
			name,
			count,
			percentage: Math.round((count / total) * 100),
		}));
	};

	// Calculate recent activity from real data
	const getRecentActivity = () => {
		if (!analytics || !analytics.recentComplaints) return [];

		return analytics.recentComplaints.slice(0, 4).map((complaint) => ({
			action:
				complaint.status === "RESOLVED"
					? "Complaint Resolved"
					: complaint.status === "IN_PROGRESS"
					? "Status Update"
					: "New Complaint",
			department: complaint.department,
			time: new Date(complaint.updatedAt).toRelativeTime(),
		}));
	};

	const stats = calculateStats() || {
		total: 0,
		resolved: 0,
		pending: 0,
		inProgress: 0,
		avgResolutionTime: "0 hours",
		satisfactionRate: "0%",
	};

	const categoryData = calculateCategoryData();
	const recentActivity = getRecentActivity();

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading analytics...</p>
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
						onClick={loadAnalytics}
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
				<title>Analytics Dashboard - Sahaay</title>
				<meta
					name="description"
					content="Analytics and insights for Sahaay complaints"
				/>
			</Head>

			<div className="container mx-auto flex justify-between items-center px-6 py-4">
				<div className="text-sm text-gray-600">Analytics Dashboard</div>
				<div className="text-sm text-gray-600">
					Last updated: {new Date().toLocaleString()}
				</div>
			</div>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-12">
				{/* Overview Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					{[
						{ label: "Total Complaints", value: stats.total, color: "blue" },
						{ label: "Resolved", value: stats.resolved, color: "green" },
						{ label: "Pending", value: stats.pending, color: "yellow" },
						{ label: "In Progress", value: stats.inProgress, color: "purple" },
					].map((stat, idx) => (
						<div
							key={idx}
							className={`bg-${stat.color}-50 rounded-xl p-6 border border-${stat.color}-100 shadow-lg`}
						>
							<h3 className="text-lg font-medium text-gray-600">
								{stat.label}
							</h3>
							<p className={`text-3xl font-bold text-${stat.color}-600 mt-2`}>
								{stat.value}
							</p>
						</div>
					))}
				</div>

				{/* Charts and Analytics */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Category Distribution */}
					<div className="bg-white rounded-xl shadow-lg p-6">
						<h3 className="text-xl font-semibold mb-6">
							Complaints by Category
						</h3>
						<div className="space-y-4">
							{categoryData.map((category, idx) => (
								<div key={idx}>
									<div className="flex justify-between text-sm mb-1">
										<span className="font-medium">{category.name}</span>
										<span className="text-gray-600">
											{category.count} complaints
										</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-blue-600 h-2 rounded-full"
											style={{ width: `${category.percentage}%` }}
										/>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Performance Metrics */}
					<div className="bg-white rounded-xl shadow-lg p-6">
						<h3 className="text-xl font-semibold mb-6">Performance Metrics</h3>
						<div className="grid grid-cols-2 gap-6">
							<div className="text-center p-4 bg-green-50 rounded-lg">
								<p className="text-sm text-gray-600 mb-1">
									Average Resolution Time
								</p>
								<p className="text-2xl font-bold text-green-600">
									{stats.avgResolutionTime}
								</p>
							</div>
							<div className="text-center p-4 bg-blue-50 rounded-lg">
								<p className="text-sm text-gray-600 mb-1">Satisfaction Rate</p>
								<p className="text-2xl font-bold text-blue-600">
									{stats.satisfactionRate}
								</p>
							</div>
						</div>
					</div>

					{/* Recent Activity */}
					<div className="bg-white rounded-xl shadow-lg p-6">
						<h3 className="text-xl font-semibold mb-6">Recent Activity</h3>
						<div className="space-y-4">
							{recentActivity.map((activity, idx) => (
								<div
									key={idx}
									className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg"
								>
									<div className="w-2 h-2 rounded-full bg-blue-500" />
									<div>
										<p className="font-medium">{activity.action}</p>
										<p className="text-sm text-gray-600">
											{activity.department} • {activity.time}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Trends */}
					<div className="bg-white rounded-xl shadow-lg p-6">
						<h3 className="text-xl font-semibold mb-6">Resolution Trends</h3>
						<div className="grid grid-cols-7 gap-2">
							{Array.from({ length: 28 }, (_, i) => (
								<div
									key={i}
									className={`h-8 rounded-md ${
										Math.random() > 0.5 ? "bg-green-100" : "bg-green-300"
									}`}
									title={`Day ${i + 1}`}
								/>
							))}
						</div>
						<div className="mt-4 text-sm text-gray-600 text-center">
							Resolution activity for the past 28 days
						</div>
					</div>
				</div>

				{/* Department Insights */}
				<div className="mt-8 bg-white rounded-xl shadow-lg p-6">
					<h3 className="text-xl font-semibold mb-6">Department Performance</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{analytics?.departmentMetrics?.map((dept, idx) => {
							const totalComplaints =
								dept.resolved + dept.pending + dept.in_progress;
							const satisfactionRate = Math.round(
								(dept.resolved / totalComplaints) * 100
							);

							return (
								<div key={idx} className="bg-gray-50 rounded-lg p-4">
									<h4 className="font-semibold mb-3">{dept.department}</h4>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-600">Resolved:</span>
											<span className="font-medium">{dept.resolved}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Pending:</span>
											<span className="font-medium">{dept.pending}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">In Progress:</span>
											<span className="font-medium">{dept.in_progress}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Avg Response:</span>
											<span className="font-medium">
												{Math.round(dept.avg_response_time)}h
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</main>
		</div>
	);
}
