import React, { useState, useEffect } from "react";
import api from "../utils/api";

const ComplaintGroups = () => {
	const [groups, setGroups] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");

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
					{groups.map((group) => (
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

								<div className="border-t border-gray-100 pt-4">
									<h5 className="text-sm font-medium text-gray-700 mb-2">Sample complaints:</h5>
									<ul className="space-y-2">
										{group.complaints.slice(0, 3).map((complaint, index) => (
											<li key={complaint._id} className="text-sm text-gray-600">
												<span className="font-medium">#{index + 1}:</span> {complaint.description.substring(0, 100)}...
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
									<button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
										View all in group →
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default ComplaintGroups;