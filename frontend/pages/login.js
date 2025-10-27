import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import api from "../utils/api";
import { emitAuthStateChanged } from "../utils/authEvent";

export default function Login() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			console.log("Attempting login...");
			const response = await api.post("/api/citizens/login", formData);
			console.log("Login successful:", response.data);

			// Store the JWT token and citizen data
			localStorage.setItem("token", response.data.token);
			localStorage.setItem("citizenId", response.data.citizen._id);
			localStorage.setItem(
				"citizenData",
				JSON.stringify(response.data.citizen)
			);

			// Emit auth state changed event
			emitAuthStateChanged();

			// Redirect to home page
			router.push("/");
		} catch (error) {
			console.error("Login failed:", error.response?.data || error.message);
			alert(error.response?.data?.error || "Login failed. Please try again.");
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
			<Head>
				<title>Login - Sahaay</title>
				<meta name="description" content="Login to your Sahaay account" />
			</Head>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-12">
				<div className="max-w-md mx-auto">
					<div className="bg-white rounded-2xl shadow-xl p-8">
						<h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							Welcome Back
						</h2>

						{/* Login Form */}
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Email */}
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Email Address
								</label>
								<input
									type="email"
									id="email"
									name="email"
									required
									value={formData.email}
									onChange={handleChange}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									placeholder="john@example.com"
								/>
							</div>

							{/* Password */}
							<div>
								<label
									htmlFor="password"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Password
								</label>
								<input
									type="password"
									id="password"
									name="password"
									required
									value={formData.password}
									onChange={handleChange}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									placeholder="••••••••"
								/>
							</div>

							{/* Submit Button */}
							<div className="flex flex-col items-center gap-4">
								<button
									type="submit"
									className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
								>
									Login
								</button>
								<p className="text-gray-600">
									Don&apos;t have an account?{" "}
									<Link
										href="/register"
										className="text-blue-600 hover:text-blue-700 font-medium"
									>
										Register here
									</Link>
								</p>
							</div>
						</form>
					</div>
				</div>
			</main>
		</div>
	);
}
