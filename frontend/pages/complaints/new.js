import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import dynamic from "next/dynamic";
import api from "../../utils/api";
import {
	getLocationByPincode,
	getCurrentLocation,
	reverseGeocode,
} from "../../utils/locationUtils";
import { withAuth } from "../../utils/withAuth";

// Dynamically import MapLocationPicker to avoid SSR issues with Leaflet
const MapLocationPicker = dynamic(() => import("../../components/MapLocationPicker"), {
	ssr: false,
});

function FileComplaint() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		category: "",
		subcategory: "",
		title: "",
		description: "",
		location: {
			address: "",
			landmark: "",
			pincode: "",
			city: "",
			coordinates: [0, 0],
		},
		attachments: [],
	});

	const [isFetchingLocation, setIsFetchingLocation] = useState(false);
	const [locationError, setLocationError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionResult, setSubmissionResult] = useState(null);
	const [showMapModal, setShowMapModal] = useState(false);

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

			// Enhanced validation with better error messages
			if (!formData.category) {
				throw new Error("Please select a category");
			}

			if (!formData.title) {
				throw new Error("Please enter a complaint title");
			}

			if (!formData.description) {
				throw new Error("Please enter a detailed description");
			}

			// Enforce backend's description length rule (20-1000 chars)
			if (formData.description.trim().length < 20) {
				throw new Error(
					"Description is too short. Please provide at least 20 characters."
				);
			}

			// Validate location is provided with all required fields
			if (!formData.location.address) {
				throw new Error("Please provide a valid address");
			}

			if (!formData.location.pincode) {
				throw new Error("Please provide a pincode");
			}

			if (!formData.location.city) {
				throw new Error("Please provide a city");
			}

			// Debug: Log the location data being sent
			console.log("Location data being sent:", {
				coordinates: formData.location.coordinates,
				address: formData.location.address,
				pincode: formData.location.pincode,
				city: formData.location.city,
			});

			// Fix: Check if coordinates are valid numbers (allow zeros but not null/undefined)
			if (
				!formData.location.coordinates ||
				formData.location.coordinates.length !== 2 ||
				isNaN(formData.location.coordinates[0]) ||
				isNaN(formData.location.coordinates[1])
			) {
				throw new Error(
					"Please provide valid coordinates. Use 'Get Current Location' or 'Fetch by Pincode' to set location."
				);
			}

			// Prepare complaint data - Fix: send zipcode instead of pincode
			const complaintData = {
				category: formData.category,
				title: formData.title,
				description: formData.description,
				location: {
					type: "Point",
					coordinates: formData.location.coordinates,
					address: formData.location.address,
					landmark: formData.location.landmark,
					// Fix: send zipcode instead of pincode to match backend expectation
					zipcode: formData.location.pincode,
					city: formData.location.city,
				},
				citizenId: citizenId,
			};

			console.log("Submitting complaint:", complaintData);

			setIsSubmitting(true);
			const response = await api.post("/api/complaints", complaintData);
			console.log("Complaint submitted successfully:", response.data);

			setSubmissionResult(response.data);

			// Show success message
			setTimeout(() => {
				router.push("/complaints");
			}, 5000);
		} catch (error) {
			console.error(
				"Error submitting complaint:",
				error.response?.data || error.message
			);

			// Prefer expressive validation messages returned by the backend
			let message = "Failed to submit complaint. Please try again.";
			if (error.response?.data) {
				const data = error.response.data;
				if (Array.isArray(data.errors) && data.errors.length > 0) {
					message = data.errors
						.map((e) => e.msg || e.message || JSON.stringify(e))
						.join("; ");
				} else if (data.error) {
					message = data.error;
				}
			} else if (error.message) {
				message = error.message;
			}

			// Show specific error message to user
			alert(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleLocationChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			location: {
				...prev.location,
				[name]: value,
			},
		}));
	};

	const handleFileChange = (e) => {
		const files = Array.from(e.target.files);
		setFormData((prev) => ({
			...prev,
			attachments: files,
		}));
	};

	const handleFetchLocationByPincode = async () => {
		setLocationError("");
		if (!formData.location.pincode) {
			setLocationError("Please enter a pincode");
			return;
		}

		try {
			setIsFetchingLocation(true);
			const locationData = await getLocationByPincode(
				formData.location.pincode
			);

			setFormData((prev) => ({
				...prev,
				location: {
					...prev.location,
					address: locationData.address,
					city: locationData.city,
					// Fix: properly set coordinates as [longitude, latitude] array, handle null values
					coordinates: [
						locationData.longitude !== null &&
						locationData.longitude !== undefined
							? locationData.longitude
							: 0,
						locationData.latitude !== null &&
						locationData.latitude !== undefined
							? locationData.latitude
							: 0,
					],
				},
			}));
		} catch (error) {
			setLocationError(error.message);
		} finally {
			setIsFetchingLocation(false);
		}
	};

	const handleGetCurrentLocation = async () => {
		setLocationError("");
		try {
			setIsFetchingLocation(true);
			const position = await getCurrentLocation();

			// Reverse geocode to get address details
			const addressData = await reverseGeocode(
				position.latitude,
				position.longitude
			);

			setFormData((prev) => ({
				...prev,
				location: {
					...prev.location,
					address: addressData.address,
					city: addressData.city,
					pincode: addressData.zipcode,
					// Fix: properly set coordinates as [longitude, latitude] array
					coordinates: [position.longitude, position.latitude],
				},
			}));
		} catch (error) {
			setLocationError(error.message);
		} finally {
			setIsFetchingLocation(false);
		}
	};

	const handleMapLocationSelect = (locationData) => {
		setFormData((prev) => ({
			...prev,
			location: {
				...prev.location,
				address: locationData.address,
				city: locationData.city,
				pincode: locationData.zipcode,
				coordinates: [locationData.longitude, locationData.latitude],
			},
		}));
		setLocationError("");
	};

	if (submissionResult) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
				<Head>
					<title>Complaint Submitted - Sahaay</title>
					<meta name="description" content="Complaint submitted successfully" />
				</Head>

				<main className="container mx-auto px-4 py-12">
					<div className="max-w-2xl mx-auto">
						<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
								<svg
									className="w-8 h-8 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M5 13l4 4L19 7"
									></path>
								</svg>
							</div>

							<h2 className="text-2xl font-bold text-gray-800 mb-4">
								Complaint Submitted Successfully!
							</h2>
							<p className="text-gray-600 mb-6">
								Your complaint has been registered with ID:{" "}
								<span className="font-mono font-bold">
									{submissionResult.complaint._id}
								</span>
							</p>

							{submissionResult.groupInfo &&
							submissionResult.groupInfo.isPartOfExistingGroup ? (
								<div className="bg-blue-50 rounded-lg p-4 mb-6">
									<h3 className="font-semibold text-blue-800 mb-2">
										Similar Complaints Detected
									</h3>
									<p className="text-blue-700">
										We found {submissionResult.groupInfo.groupSize - 1} other
										similar complaints in your area. This helps us prioritize
										and resolve issues faster!
									</p>
								</div>
							) : (
								<div className="bg-purple-50 rounded-lg p-4 mb-6">
									<h3 className="font-semibold text-purple-800 mb-2">
										New Issue Reported
									</h3>
									<p className="text-purple-700">
										Your complaint has been registered as a new issue. Thank you
										for helping us improve our services.
									</p>
								</div>
							)}

							<div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
								<h4 className="font-semibold text-gray-800 mb-2">
									Complaint Details:
								</h4>
								<ul className="text-gray-600 space-y-1">
									<li>
										<span className="font-medium">Title:</span>{" "}
										{submissionResult.complaint.title}
									</li>
									<li>
										<span className="font-medium">Category:</span>{" "}
										{submissionResult.complaint.category}
									</li>
									<li>
										<span className="font-medium">Priority:</span>{" "}
										<span className="capitalize">
											{submissionResult.complaint.priority}
										</span>
									</li>
									<li>
										<span className="font-medium">Location:</span>{" "}
										{submissionResult.complaint.location.address}
									</li>
								</ul>
							</div>

							<p className="text-gray-500 text-sm mb-6">
								You will be redirected to your complaints page in 5 seconds...
							</p>

							<Link
								href="/complaints"
								className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								View All Complaints
							</Link>
						</div>
					</div>
				</main>
			</div>
		);
	}

	return (
		<>
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
										Subcategory (Optional)
									</label>
									<select
										id="subcategory"
										name="subcategory"
										// Fix: Remove required attribute as subcategory is not required by backend
										value={formData.subcategory}
										onChange={handleChange}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									>
										<option value="">Select Subcategory (Optional)</option>
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

							{/* Location Section */}
							<div className="border-t border-gray-200 pt-6">
								<h3 className="text-lg font-semibold mb-4 text-gray-800">
									Location Details
								</h3>

								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
									<p className="text-blue-800 text-sm">
										<strong>Important:</strong> Please use either "Get Current
										Location" or "Fetch by Pincode" to automatically populate
										all location fields including coordinates.
									</p>
								</div>

								{locationError && (
									<div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
										{locationError}
									</div>
								)}

								<div className="grid md:grid-cols-2 gap-4 mb-4">
									<div>
										<label
											htmlFor="pincode"
											className="block text-sm font-medium text-gray-700 mb-2"
										>
											Pincode
										</label>
										<div className="flex gap-2">
											<input
												type="text"
												id="pincode"
												name="pincode"
												value={formData.location.pincode}
												onChange={handleLocationChange}
												className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
												placeholder="Enter 6-digit pincode"
												maxLength="6"
											/>
											<button
												type="button"
												onClick={handleFetchLocationByPincode}
												disabled={isFetchingLocation}
												className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
											>
												{isFetchingLocation ? "Fetching..." : "Fetch"}
											</button>
										</div>
									</div>

									<div>
										<label
											htmlFor="city"
											className="block text-sm font-medium text-gray-700 mb-2"
										>
											City
										</label>
										<input
											type="text"
											id="city"
											name="city"
											required
											value={formData.location.city}
											onChange={handleLocationChange}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
											placeholder="City"
										/>
									</div>
								</div>

								<div className="mb-4">
									<label
										htmlFor="address"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Address
									</label>
									<textarea
										id="address"
										name="address"
										required
										value={formData.location.address}
										onChange={handleLocationChange}
										rows={3}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
										placeholder="Full address of the issue location"
									/>
								</div>

								<div className="mb-4">
									<label
										htmlFor="landmark"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Nearby Landmark (Optional)
									</label>
									<input
										type="text"
										id="landmark"
										name="landmark"
										value={formData.location.landmark}
										onChange={handleLocationChange}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
										placeholder="Any nearby landmark for easy identification"
									/>
								</div>

								<div className="flex flex-wrap gap-3">
									<button
										type="button"
										onClick={handleGetCurrentLocation}
										disabled={isFetchingLocation}
										className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5 mr-2"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
												clipRule="evenodd"
											/>
										</svg>
										Get Current Location
									</button>

									<button
										type="button"
										onClick={handleFetchLocationByPincode}
										disabled={isFetchingLocation || !formData.location.pincode}
										className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5 mr-2"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 10-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l-1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
												clipRule="evenodd"
											/>
										</svg>
										Fetch by Pincode
									</button>

									<button
										type="button"
										onClick={() => setShowMapModal(true)}
										className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all flex items-center"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5 mr-2"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
												clipRule="evenodd"
											/>
										</svg>
										Select on Map
									</button>
								</div>
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
									disabled={isSubmitting}
									className="w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
								>
									{isSubmitting ? "Submitting..." : "Submit Complaint"}
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

			{/* Map Location Picker Modal - Centered on Mysore, India */}
			<MapLocationPicker
				isOpen={showMapModal}
				onClose={() => setShowMapModal(false)}
				onLocationSelect={handleMapLocationSelect}
				initialCenter={[12.2958, 76.6394]}
			/>
		</>
	);
}

export default withAuth(FileComplaint);
