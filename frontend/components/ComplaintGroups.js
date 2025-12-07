import React, { useState, useEffect } from "react";
import api from "../utils/api";

const ComplaintGroups = () => {
	const [groups, setGroups] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");
	const [expandedGroup, setExpandedGroup] = useState(null);

	useEffect(() => {
		fetchComplaintGroups();
	}, [categoryFilter]);

	const fetchComplaintGroups = async () => {
		try {
			setLoading(true);
			const response = await api.get(`/api/complaints/groups?${categoryFilter ? `categoryId=${categoryFilter}` : ""}`);
			setGroups(response.data);
		} catch (err) {
			setError("Failed to fetch complaint groups");
			console.error("Error fetching complaint groups:", err);
		} finally {
			setLoading(false);
		}
	};

	const getPriorityLabel = (avgPriority) => {
		if (avgPriority >= 2.5) return "High";
		if (avgPriority >= 1.5) return "Medium";
		return "Low";
	};

	const getPriorityColor = (avgPriority) => {
		if (avgPriority >= 2.5) return "bg-red-100 text-red-800";
		if (avgPriority >= 1.5) return "bg-yellow-100 text-yellow-800";
		return "bg-green-100 text-green-800";
	};

    const getScoreColor = (score) => {
        if (score >= 80) return "text-red-600";
        if (score >= 50) return "text-yellow-600";
        return "text-green-600";
    };

	const formatRelativeTime = (timestamp) => {
		const now = new Date();
		const past = new Date(timestamp);
		const diffMs = now - past;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		
		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
		if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
		return past.toLocaleDateString();
	};

	const toggleGroupExpansion = (groupId) => {
		setExpandedGroup(expandedGroup === groupId ? null : groupId);
	};

	const getGroupInsights = (group) => {
		const complaints = group.complaints || [];
		if (complaints.length === 0) return null;

		// Time range
		const timestamps = complaints.map(c => new Date(c.createdAt)).sort((a, b) => a - b);
		const timeRange = {
			earliest: timestamps[0],
			latest: timestamps[timestamps.length - 1]
		};

		// Location distribution
		const locations = {};
		complaints.forEach(c => {
			const area = c.location?.address?.split(',')[0] || 'Unknown';
			locations[area] = (locations[area] || 0) + 1;
		});

		// Status distribution
		const statuses = {};
		complaints.forEach(c => {
			statuses[c.status] = (statuses[c.status] || 0) + 1;
		});

		// Priority distribution
		const priorities = {};
		complaints.forEach(c => {
			priorities[c.priority] = (priorities[c.priority] || 0) + 1;
		});

		return { timeRange, locations, statuses, priorities };
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
				{error}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h3 className="text-xl font-bold text-gray-800">Similar Complaint Groups</h3>
				<div className="flex gap-2">
					<select
						value={categoryFilter}
						onChange={(e) => setCategoryFilter(e.target.value)}
						className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">All Categories</option>
						<option value="electricity">Electricity</option>
						<option value="water">Water</option>
						<option value="roads">Roads</option>
						<option value="rail">Rail</option>
					</select>
					<button
						onClick={fetchComplaintGroups}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Refresh
					</button>
				</div>
			</div>

			{groups.length === 0 ? (
				<div className="bg-blue-50 rounded-lg p-8 text-center">
					<svg
						className="mx-auto h-12 w-12 text-blue-400"
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
					<h4 className="mt-4 text-lg font-medium text-blue-800">No complaint groups found</h4>
					<p className="mt-2 text-blue-600">
						There are currently no similar complaints grouped together.
					</p>
				</div>
			) : (
				<div className="grid gap-6">
					{groups.map((group) => {
						const insights = getGroupInsights(group);
						const isExpanded = expandedGroup === group._id;

						return (
							<div
								key={group._id}
								className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200"
							>
								<div className="p-6">
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
										<div>
											<h4 className="text-lg font-semibold text-gray-800">
												{group.complaints[0]?.title || "Grouped Complaints"}
											</h4>
											<div className="flex flex-wrap items-center gap-2 mt-2">
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
													{group.category}
												</span>
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
													{group.count} complaints
												</span>
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(group.averagePriority)}`}>
													Avg Priority: {getPriorityLabel(group.averagePriority)}
												</span>
											</div>
										</div>
										<div className="text-sm text-gray-500">
											Last reported: {new Date(group.createdAt).toLocaleDateString()}
										</div>
									</div>

									{!isExpanded && (
										<>
											<div className="border-t border-gray-100 pt-4">
												<h5 className="text-sm font-medium text-gray-700 mb-2">Sample complaints:</h5>
												<ul className="space-y-2">
													{group.complaints.slice(0, 3).map((complaint, index) => (
														<li key={complaint._id} className="text-sm text-gray-600 flex justify-between items-start">
															<span>
																<span className="font-medium">#{index + 1}:</span> {complaint.description.substring(0, 80)}...
															</span>
															{complaint.meta?.priorityScore && (
																<span className={`text-xs font-bold ${getScoreColor(complaint.meta.priorityScore)} whitespace-nowrap ml-2`}>
																	AI Score: {complaint.meta.priorityScore}
																</span>
															)}
														</li>
													))}
													{group.complaints.length > 3 && (
														<li className="text-sm text-gray-500">
															+ {group.complaints.length - 3} more complaints
														</li>
													)}
												</ul>
											</div>

											<div className="mt-4 flex justify-end">
												<button 
													onClick={() => toggleGroupExpansion(group._id)}
													className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
												>
													View all in group →
												</button>
											</div>
										</>
									)}

									{isExpanded && (
										<>
											{/* Insights Section */}
											{insights && (
												<div className="border-t border-gray-100 pt-4 mb-4">
													<h5 className="text-sm font-semibold text-gray-800 mb-3">📊 Group Insights</h5>
													<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
														{/* Time Range */}
														<div className="bg-blue-50 rounded-lg p-3">
															<div className="text-xs text-blue-600 font-medium mb-1">Time Range</div>
															<div className="text-sm text-gray-800">
																{insights.timeRange.earliest.toLocaleDateString()} - {insights.timeRange.latest.toLocaleDateString()}
															</div>
														</div>

														{/* Status Distribution */}
														<div className="bg-green-50 rounded-lg p-3">
															<div className="text-xs text-green-600 font-medium mb-1">Status</div>
															<div className="text-xs space-y-1">
																{Object.entries(insights.statuses).map(([status, count]) => (
																	<div key={status} className="capitalize">
																		{status}: <span className="font-semibold">{count}</span>
																	</div>
																))}
															</div>
														</div>

														{/* Priority Distribution */}
														<div className="bg-yellow-50 rounded-lg p-3">
															<div className="text-xs text-yellow-600 font-medium mb-1">Priority</div>
															<div className="text-xs space-y-1">
																{Object.entries(insights.priorities).map(([priority, count]) => (
																	<div key={priority} className="capitalize">
																		{priority}: <span className="font-semibold">{count}</span>
																	</div>
																))}
															</div>
														</div>

														{/* Top Locations */}
														<div className="bg-purple-50 rounded-lg p-3">
															<div className="text-xs text-purple-600 font-medium mb-1">Top Locations</div>
															<div className="text-xs space-y-1">
																{Object.entries(insights.locations).slice(0, 3).map(([location, count]) => (
																	<div key={location} className="truncate" title={location}>
																		{location}: <span className="font-semibold">{count}</span>
																	</div>
																))}
															</div>
														</div>
													</div>
												</div>
											)}

											{/* All Complaints List */}
											<div className="border-t border-gray-100 pt-4">
												<h5 className="text-sm font-semibold text-gray-800 mb-3">
													All Complaints ({group.complaints.length})
												</h5>
												<div className="space-y-3 max-h-96 overflow-y-auto">
													{group.complaints.map((complaint, index) => (
														<div key={complaint._id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
															<div className="flex justify-between items-start mb-2">
																<div className="flex-1">
																	<div className="flex items-start gap-2">
																		<span className="text-xs font-bold text-gray-500">#{index + 1}</span>
																		<div className="flex-1">
																			<h6 className="font-semibold text-gray-900 text-sm">{complaint.title}</h6>
																			<p className="text-xs text-gray-600 mt-1">{complaint.description}</p>
																		</div>
																	</div>
																</div>
																<span className={`ml-2 px-2 py-0.5 rounded text-xs capitalize font-medium ${
																	complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
																	complaint.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
																	complaint.status === 'escalated' ? 'bg-red-100 text-red-800' :
																	'bg-gray-100 text-gray-800'
																}`}>
																	{complaint.status}
																</span>
															</div>
															
															<div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-2">
																{complaint.citizen && (
																	<span className="flex items-center gap-1">
																		👤 <span className="font-medium">Citizen ID: {complaint.citizen.toString().slice(-6)}</span>
																	</span>
																)}
																<span className="flex items-center gap-1">
																	🕒 {formatRelativeTime(complaint.createdAt)}
																</span>
																<span className={`px-2 py-0.5 rounded capitalize font-medium ${
																	complaint.priority === 'high' ? 'bg-red-100 text-red-800' :
																	complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
																	'bg-green-100 text-green-800'
																}`}>
																	{complaint.priority}
																</span>
																{complaint.meta?.priorityScore && (
																	<span className={`font-bold ${getScoreColor(complaint.meta.priorityScore)}`}>
																		AI: {complaint.meta.priorityScore}
																	</span>
																)}
															</div>
														</div>
													))}
												</div>
											</div>

											<div className="mt-4 flex justify-end">
												<button 
													onClick={() => toggleGroupExpansion(group._id)}
													className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
												>
													↑ Collapse
												</button>
											</div>
										</>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default ComplaintGroups;