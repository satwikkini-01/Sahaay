import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import api from "../../utils/api";

import { withAuth } from "../../utils/withAuth";

function FileComplaint() {
	const [formData, setFormData] = useState({
		category: "",
		subcategory: "",
		title: "",
		description: "",
		location: "",
		attachments: [],
	});

	const categories = {
		electricity: [
			"Power Outage",
			"Voltage Issues",
			"Street Light",
			"Meter Problems",
		],
		water: [
			"Supply Disruption",
			"Water Quality",
			"Pipe Leakage",
			"Billing Issues",
		],
		roads: ["Potholes", "Traffic Signals", "Road Damage", "Street Signs"],
		rail: [
			"Track Issues",
			"Station Problems",
			"Schedule Delays",
			"Safety Concerns",
		],
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const citizenId = localStorage.getItem("citizenId");
			if (!citizenId) {
				throw new Error("Not authenticated");
			}

			// Format location data
			const locationData = {
				type: "Point",
				coordinates: [0, 0], // TODO: Get actual coordinates
				address: formData.location,
				landmark: "",
				zipcode: "",
			};

			// Prepare complaint data
			const complaintData = {
				category: formData.category,
				subcategory: formData.subcategory,
				title: formData.title,
				description: formData.description,
				location: locationData,
				citizenId: citizenId,
			};

			console.log("Submitting complaint:", complaintData);

			const response = await api.post("/api/complaints", complaintData);
			console.log("Complaint submitted successfully:", response.data);

			// TODO: Show success message and redirect
			alert("Complaint submitted successfully!");
			// router.push('/complaints');
		} catch (error) {
			console.error(
				"Error submitting complaint:",
				error.response?.data || error.message
			);
			alert("Failed to submit complaint. Please try again.");
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleFileChange = (e) => {
		const files = Array.from(e.target.files);
		setFormData((prev) => ({
			...prev,
			attachments: files,
		}));
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
			<Head>
				<title>File Complaint - Sahaay</title>
				<meta name="description" content="File a new complaint on Sahaay" />
			</Head>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-12">
				<div className="max-w-4xl mx-auto">
					<div className="bg-white rounded-2xl shadow-xl p-8">
						<h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							File a New Complaint
						</h2>

						{/* Progress Indicator */}
						<div className="mb-8">
							<div className="h-2 bg-gray-200 rounded-full">
								<div
									className="h-2 bg-blue-600 rounded-full"
									style={{ width: "25%" }}
								></div>
							</div>
							<div className="flex justify-between mt-2 text-sm text-gray-600">
								<span>Category</span>
								<span>Details</span>
								<span>Location</span>
								<span>Review</span>
							</div>
						</div>

						{/* Complaint Form */}
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Category Selection */}
							<div className="grid md:grid-cols-2 gap-6">
								<div>
									<label
										htmlFor="category"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Category
									</label>
									<select
										id="category"
										name="category"
										required
										value={formData.category}
										onChange={handleChange}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									>
										<option value="">Select Category</option>
										{Object.keys(categories).map((cat) => (
											<option key={cat} value={cat}>
												{cat.charAt(0).toUpperCase() + cat.slice(1)}
											</option>
										))}
									</select>
								</div>

								<div>
									<label
										htmlFor="subcategory"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Subcategory
									</label>
									<select
										id="subcategory"
										name="subcategory"
										required
										value={formData.subcategory}
										onChange={handleChange}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									>
										<option value="">Select Subcategory</option>
										{formData.category &&
											categories[formData.category].map((sub) => (
												<option key={sub} value={sub}>
													{sub}
												</option>
											))}
									</select>
								</div>
							</div>

							{/* Complaint Title */}
							<div>
								<label
									htmlFor="title"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Complaint Title
								</label>
								<input
									type="text"
									id="title"
									name="title"
									required
									value={formData.title}
									onChange={handleChange}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									placeholder="Brief title of your complaint"
								/>
							</div>

							{/* Description */}
							<div>
								<label
									htmlFor="description"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Description
								</label>
								<textarea
									id="description"
									name="description"
									required
									value={formData.description}
									onChange={handleChange}
									rows={4}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									placeholder="Provide detailed description of the issue..."
								/>
							</div>

							{/* Location */}
							<div>
								<label
									htmlFor="location"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Location
								</label>
								<textarea
									id="location"
									name="location"
									required
									value={formData.location}
									onChange={handleChange}
									rows={2}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									placeholder="Enter the location of the issue"
								/>
							</div>

							{/* File Attachments */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Attachments (Optional)
								</label>
								<div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
									<div className="space-y-1 text-center">
										<svg
											className="mx-auto h-12 w-12 text-gray-400"
											stroke="currentColor"
											fill="none"
											viewBox="0 0 48 48"
											aria-hidden="true"
										>
											<path
												d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
												strokeWidth={2}
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										<div className="flex text-sm text-gray-600">
											<label
												htmlFor="file-upload"
												className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
											>
												<span>Upload files</span>
												<input
													id="file-upload"
													name="file-upload"
													type="file"
													className="sr-only"
													multiple
													onChange={handleFileChange}
												/>
											</label>
											<p className="pl-1">or drag and drop</p>
										</div>
										<p className="text-xs text-gray-500">
											PNG, JPG, PDF up to 10MB
										</p>
									</div>
								</div>
								{formData.attachments.length > 0 && (
									<div className="mt-2">
										<p className="text-sm text-gray-600">
											{formData.attachments.length} file(s) selected
										</p>
									</div>
								)}
							</div>

							{/* Submit Button */}
							<div className="flex flex-col items-center gap-4">
								<button
									type="submit"
									className="w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
								>
									Submit Complaint
								</button>
								<p className="text-sm text-gray-600">
									Your complaint will be processed and assigned to relevant
									authorities
								</p>
							</div>
						</form>
					</div>

					{/* Tips Section */}
					<div className="mt-8 bg-blue-50 rounded-xl p-6">
						<h3 className="text-lg font-semibold mb-4 text-blue-800">
							Tips for Filing a Complaint:
						</h3>
						<ul className="space-y-2 text-blue-700">
							<li className="flex items-center">
								<span className="mr-2">✓</span>
								Be specific about the issue and location
							</li>
							<li className="flex items-center">
								<span className="mr-2">✓</span>
								Add clear photos or videos if possible
							</li>
							<li className="flex items-center">
								<span className="mr-2">✓</span>
								Provide accurate contact information
							</li>
							<li className="flex items-center">
								<span className="mr-2">✓</span>
								Check complaint status regularly for updates
							</li>
						</ul>
					</div>
				</div>
			</main>
		</div>
	);
}

export default withAuth(FileComplaint);
