import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../utils/api";

export default function ComplaintDetails() {
	const router = useRouter();
	const { id } = router.query;

	const [complaint, setComplaint] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!id) return;
		loadComplaint(id);
	}, [id]);

	const loadComplaint = async (complaintId) => {
		setLoading(true);
		setError(null);

		try {
			// Try single-endpoint first
			let res;
			try {
				res = await api.get(`/api/complaints/${complaintId}`);
			} catch (err) {
				// If not found, fallback to fetching all and finding locally
				if (err?.response?.status === 404 || err?.response?.status === 400) {
					const all = await api.get(`/api/complaints`);
					const found = all.data.find((c) => (c._id || c.id) === complaintId);
					if (found) {
						setComplaint(found);
						return;
					}
				}
				throw err;
			}

			setComplaint(res.data);
		} catch (err) {
			console.error("Error loading complaint:", err);
			setError("Failed to load complaint. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	const renderDepartment = (dept) => {
		if (!dept) return "—";
		if (typeof dept === "string") return dept;
		return dept.name ?? dept.pgDeptId ?? "—";
	};

	const renderLocation = (loc) => {
		if (!loc) return "—";
		if (typeof loc === "string") return loc;
		if (loc.address) return loc.address;
		if (Array.isArray(loc.coordinates)) return loc.coordinates.join(", ");
		// handle GeoJSON-like object
		if (loc.type && loc.coordinates)
			return `${loc.type} ${JSON.stringify(loc.coordinates)}`;
		return "—";
	};

	const formatDate = (d) => {
		if (!d) return "—";
		try {
			return new Date(d).toLocaleString();
		} catch (e) {
			return String(d);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading complaint...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 mb-4">{error}</p>
					<button
						className="bg-blue-600 text-white px-4 py-2 rounded-lg"
						onClick={() => loadComplaint(id)}
					>
						Try again
					</button>
				</div>
			</div>
		);
	}

	if (!complaint) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-700">Complaint not found.</p>
					<Link
						href="/complaints"
						className="text-blue-600 underline mt-4 inline-block"
					>
						Back to complaints
					</Link>
				</div>
			</div>
		);
	}

	// If backend returned wrapper { complaint, ... } (like create endpoint), try to normalize
	const data = complaint.complaint || complaint;

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
			<Head>
				<title>Complaint Details - Sahaay</title>
			</Head>

			<div className="container mx-auto px-4 py-6 flex justify-between items-center">
				<h1 className="text-2xl font-semibold">Complaint Details</h1>
				<Link href="/complaints" className="text-sm text-blue-600 underline">
					Back to complaints
				</Link>
			</div>

			<main className="container mx-auto px-4">
				<div className="bg-white rounded-xl p-6 shadow-lg">
					<div className="flex flex-col md:flex-row justify-between gap-4">
						<div className="flex-1">
							<h2 className="text-xl font-bold mb-2">{data.title ?? "—"}</h2>
							<p className="text-gray-700 mb-4">{data.description ?? "—"}</p>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								<div>
									<p className="text-gray-500">Category</p>
									<p className="font-medium">{data.category ?? "—"}</p>
								</div>
								<div>
									<p className="text-gray-500">Department</p>
									<p className="font-medium">
										{renderDepartment(data.department)}
									</p>
								</div>
								<div>
									<p className="text-gray-500">Location</p>
									<p className="font-medium">{renderLocation(data.location)}</p>
								</div>
								<div>
									<p className="text-gray-500">Priority</p>
									<p className="font-medium">{data.priority ?? "—"}</p>
								</div>
								<div>
									<p className="text-gray-500">Status</p>
									<p className="font-medium">
										{(data.status || "—").replace(/-/g, " ")}
									</p>
								</div>
								<div>
									<p className="text-gray-500">SLA Deadline</p>
									<p className="font-medium">{formatDate(data.slaDeadline)}</p>
								</div>
							</div>
						</div>

						<div className="w-full md:w-64">
							<div className="bg-gray-50 rounded-lg p-4">
								<p className="text-gray-500">Filed By</p>
								<p className="font-medium">
									{data.citizen?.name ?? data.citizen ?? "—"}
								</p>
								<p className="text-sm text-gray-600">
									{data.citizen?.email ?? ""}
								</p>

								<div className="mt-4">
									<p className="text-gray-500">Created</p>
									<p className="font-medium">{formatDate(data.createdAt)}</p>
								</div>

								<div className="mt-4">
									<p className="text-gray-500">Last Updated</p>
									<p className="font-medium">{formatDate(data.updatedAt)}</p>
								</div>
							</div>

							<div className="mt-4 bg-white rounded-lg p-4 border">
								<p className="text-gray-500">Priority Score</p>
								<p className="font-bold text-2xl text-blue-600">{data.meta?.priorityScore ?? "—"}</p>
								
								{data.meta?.mlPrediction && (
									<div className="mt-3 pt-3 border-t">
										<p className="text-xs font-semibold text-gray-700 mb-2">ML Analysis</p>
										<div className="space-y-1 text-xs">
											<div className="flex justify-between">
												<span className="text-gray-600">ML Prediction:</span>
												<span className="font-semibold capitalize">{data.meta.mlPrediction}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600">Confidence:</span>
												<span className="font-semibold">{(data.meta.mlConfidence * 100).toFixed(1)}%</span>
											</div>
											{data.meta.textScore !== undefined && (
												<div className="flex justify-between">
													<span className="text-gray-600">Text Score:</span>
													<span className="font-semibold">{data.meta.textScore}/100</span>
												</div>
											)}
											{data.meta.timeScore !== undefined && (
												<div className="flex justify-between">
													<span className="text-gray-600">Time Factor:</span>
													<span className="font-semibold">{data.meta.timeScore}/30</span>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="mt-6 flex gap-2">
					<Link
						href={`/complaints/${data._id}/edit`}
						className="bg-yellow-500 text-white px-4 py-2 rounded"
					>
						Edit
					</Link>
					<button className="bg-red-500 text-white px-4 py-2 rounded">
						Request Escalation
					</button>
				</div>
			</main>
		</div>
	);
}
