import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import api from "../utils/api";

export default function Register() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		address: "",
		city: "",
		password: "",
		confirmPassword: "",
	});

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Basic validation
		if (formData.password !== formData.confirmPassword) {
			alert("Passwords do not match!");
			return;
		}

		try {
			// Remove confirmPassword before sending
			const registrationData = {
				...formData,
				confirmPassword: undefined,
			};

			console.log("Submitting registration data:", {
				...registrationData,
				password: "[REDACTED]",
			});

			// POST to the explicit register endpoint on the API
			// backend registers citizens at POST /api/citizens/register
			const response = await api.post(
				"/api/citizens/register",
				registrationData
			);
			console.log("Registration successful:", response.data);

			// TODO: Store auth token if provided
			// TODO: Redirect to dashboard or login
			alert("Registration successful! Please login.");
			// router.push('/login');
		} catch (error) {
			console.error(
				"Registration failed:",
				error.response?.data || error.message
			);

			// Prefer expressive validation messages returned by the backend
			let message = "Registration failed. Please try again.";
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

			alert(message);
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
				<title>Register - Sahaay</title>
				<meta name="description" content="Register as a citizen on Sahaay" />
			</Head>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-12">
				<div className="max-w-2xl mx-auto">
					<div className="bg-white rounded-2xl shadow-xl p-8">
						<h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							Create Your Account
						</h2>

						{/* Registration Form */}
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid md:grid-cols-2 gap-6">
								{/* Name */}
								<div>
									<label
										htmlFor="name"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Full Name
									</label>
									<input
										type="text"
										id="name"
										name="name"
										required
										value={formData.name}
										onChange={handleChange}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
										placeholder="John Doe"
									/>
								</div>

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

								{/* Phone */}
								<div>
									<label
										htmlFor="phone"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Phone Number
									</label>
									<input
										type="tel"
										id="phone"
										name="phone"
										required
										value={formData.phone}
										onChange={handleChange}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
										placeholder="1234567890"
									/>
								</div>

								{/* City */}
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
										value={formData.city}
										onChange={handleChange}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
										placeholder="Your City"
									/>
								</div>
							</div>

							{/* Address */}
							<div>
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
									value={formData.address}
									onChange={handleChange}
									rows={3}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									placeholder="Enter your full address"
								/>
							</div>

							{/* Password */}
							<div className="grid md:grid-cols-2 gap-6">
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

								<div>
									<label
										htmlFor="confirmPassword"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Confirm Password
									</label>
									<input
										type="password"
										id="confirmPassword"
										name="confirmPassword"
										required
										value={formData.confirmPassword}
										onChange={handleChange}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
										placeholder="••••••••"
									/>
								</div>
							</div>

							{/* Submit Button */}
							<div className="flex flex-col items-center gap-4">
								<button
									type="submit"
									className="w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
								>
									Create Account
								</button>
								<p className="text-gray-600">
									Already have an account?{" "}
									<Link
										href="/login"
										className="text-blue-600 hover:text-blue-700 font-medium"
									>
										Login here
									</Link>
								</p>
							</div>
						</form>
					</div>

					{/* Benefits Section */}
					<div className="mt-12 grid md:grid-cols-3 gap-8">
						{[
							{
								title: "Quick Registration",
								description:
									"Complete your registration in less than 2 minutes",
								icon: "⚡",
							},
							{
								title: "Secure Account",
								description: "Your data is encrypted and safely stored",
								icon: "🔒",
							},
							{
								title: "24/7 Support",
								description: "Get help anytime you need it",
								icon: "💬",
							},
						].map((benefit, idx) => (
							<div
								key={idx}
								className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
							>
								<div className="text-3xl mb-3">{benefit.icon}</div>
								<h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
								<p className="text-gray-600">{benefit.description}</p>
							</div>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
