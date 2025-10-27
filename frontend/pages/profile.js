import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { withAuth } from "../utils/withAuth";
import api from "../utils/api";

function Profile() {
	const router = useRouter();
	const [profile, setProfile] = useState(null);
	const [complaints, setComplaints] = useState([]);
	const [isEditing, setIsEditing] = useState(false);
	const [editForm, setEditForm] = useState({
		name: "",
		phone: "",
		address: "",
		city: "",
	});

	useEffect(() => {
		const citizenData = localStorage.getItem("citizenData");
		if (citizenData) {
			const data = JSON.parse(citizenData);
			setProfile(data);
			setEditForm({
				name: data.name,
				phone: data.phone,
				address: data.address,
				city: data.city,
			});
		}
		loadComplaints();
	}, []);

	const loadComplaints = async () => {
		try {
			const response = await api.get("/api/complaints/my-complaints");
			setComplaints(response.data);
		} catch (error) {
			console.error("Error loading complaints:", error);
		}
	};

	const handleLogout = async () => {
		try {
			// Call backend to clear server-side cookies
			await api.post("/api/citizens/logout");

			// Clear local storage
			localStorage.removeItem("token");
			localStorage.removeItem("citizenId");
			localStorage.removeItem("citizenData");

			// Redirect to login
			router.push("/login");
		} catch (error) {
			console.error("Logout error:", error);
			// Still clear local storage and redirect even if API call fails
			localStorage.clear();
			router.push("/login");
		}
	};

	const handleEditSubmit = async (e) => {
		e.preventDefault();
		try {
			const response = await api.put("/api/citizens/profile", editForm);
			setProfile(response.data.citizen);
			localStorage.setItem(
				"citizenData",
				JSON.stringify(response.data.citizen)
			);
			setIsEditing(false);
			alert("Profile updated successfully!");
		} catch (error) {
			console.error("Update error:", error);
			alert(error.response?.data?.error || "Failed to update profile");
		}
	};

	if (!profile) {
		return <div>Loading...</div>;
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
			<Head>
				<title>My Profile - Sahaay</title>
				<meta name="description" content="View and edit your Sahaay profile" />
			</Head>

			<main className="container mx-auto px-4 py-12">
				<div className="max-w-4xl mx-auto">
					<div className="bg-white rounded-2xl shadow-xl p-8">
						<div className="flex justify-between items-center mb-8">
							<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
								My Profile
							</h2>
							<div className="space-x-4">
								{!isEditing && (
									<button
										onClick={() => setIsEditing(true)}
										className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
									>
										Edit Profile
									</button>
								)}
								<button
									onClick={handleLogout}
									className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
								>
									Logout
								</button>
							</div>
						</div>

						{isEditing ? (
							<form onSubmit={handleEditSubmit} className="space-y-6">
								<div className="grid md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Full Name
										</label>
										<input
											type="text"
											value={editForm.name}
											onChange={(e) =>
												setEditForm({ ...editForm, name: e.target.value })
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Phone Number
										</label>
										<input
											type="tel"
											value={editForm.phone}
											onChange={(e) =>
												setEditForm({ ...editForm, phone: e.target.value })
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Address
									</label>
									<textarea
										value={editForm.address}
										onChange={(e) =>
											setEditForm({ ...editForm, address: e.target.value })
										}
										rows={3}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										City
									</label>
									<input
										type="text"
										value={editForm.city}
										onChange={(e) =>
											setEditForm({ ...editForm, city: e.target.value })
										}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
										required
									/>
								</div>
								<div className="flex gap-4">
									<button
										type="submit"
										className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
									>
										Save Changes
									</button>
									<button
										type="button"
										onClick={() => setIsEditing(false)}
										className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
									>
										Cancel
									</button>
								</div>
							</form>
						) : (
							<div className="space-y-6">
								<div className="grid md:grid-cols-2 gap-6">
									<div>
										<h3 className="text-sm font-medium text-gray-500">
											Full Name
										</h3>
										<p className="mt-1 text-lg">{profile.name}</p>
									</div>
									<div>
										<h3 className="text-sm font-medium text-gray-500">Email</h3>
										<p className="mt-1 text-lg">{profile.email}</p>
									</div>
									<div>
										<h3 className="text-sm font-medium text-gray-500">
											Phone Number
										</h3>
										<p className="mt-1 text-lg">{profile.phone}</p>
									</div>
									<div>
										<h3 className="text-sm font-medium text-gray-500">City</h3>
										<p className="mt-1 text-lg">{profile.city}</p>
									</div>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500">Address</h3>
									<p className="mt-1 text-lg">{profile.address}</p>
								</div>
							</div>
						)}
					</div>

					{/* Recent Complaints Section */}
					<div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
						<h3 className="text-2xl font-bold mb-6">Recent Complaints</h3>
						{complaints.length > 0 ? (
							<div className="space-y-4">
								{complaints.map((complaint) => (
									<div
										key={complaint._id}
										className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
									>
										<div className="flex justify-between items-start">
											<div>
												<h4 className="font-semibold">{complaint.title}</h4>
												<p className="text-gray-600 mt-1">
													{complaint.description}
												</p>
											</div>
											<span
												className={`px-3 py-1 rounded-full text-sm font-medium ${
													complaint.status === "resolved"
														? "bg-green-100 text-green-800"
														: complaint.status === "in-progress"
														? "bg-blue-100 text-blue-800"
														: "bg-yellow-100 text-yellow-800"
												}`}
											>
												{complaint.status}
											</span>
										</div>
										<div className="mt-2 text-sm text-gray-500">
											{new Date(complaint.createdAt).toLocaleDateString()}
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-gray-500">No complaints filed yet.</p>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

export default withAuth(Profile);
