import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { onAuthStateChanged } from "../utils/authEvent";

// Dynamic import for Map component to avoid SSR issues with Leaflet
const HotspotMap = dynamic(() => import("../components/HotspotMap"), {
  ssr: false,
  loading: () => <div className="h-96 w-full animate-pulse bg-gray-200 rounded-xl"></div>
});

export default function Home() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		// Check if user is logged in
		const token = localStorage.getItem("token");
		const citizenId = localStorage.getItem("citizenId");
		setIsLoggedIn(!!token && !!citizenId);

		// Listen for auth state changes
		const unsubscribe = onAuthStateChanged(() => {
			const newToken = localStorage.getItem("token");
			const newCitizenId = localStorage.getItem("citizenId");
			setIsLoggedIn(!!newToken && !!newCitizenId);
		});

		// Cleanup listener
		return () => unsubscribe();
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
			<Head>
				<title>Sahaay - Your Citizen Portal</title>
				<meta
					name="description"
					content="Sahaay - Empowering citizens through seamless complaint management"
				/>
			</Head>

			{/* Hero Section with Animation */}
			<main className="relative">
				{/* Hero Section */}
				<section className="relative pt-20 pb-32 overflow-hidden">
					<div className="container mx-auto px-6">
						<div className="flex flex-col lg:flex-row items-center gap-12">
							<div className="flex-1 text-center lg:text-left">
								<h2 className="text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
									Your Voice Matters:
									<br />
									We're Here to Help
								</h2>
								<p className="text-xl text-gray-600 mb-8 max-w-2xl">
									Sahaay empowers citizens by providing a seamless platform to
									register, track, and resolve complaints for city services
									including electricity, water, roads, and rail infrastructure.
								</p>
								<div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
									{isLoggedIn ? (
										<>
											<Link
												href="/complaints"
												className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
											>
												My Complaints
											</Link>
											<Link
												href="/complaints/new"
												className="btn-secondary bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
											>
												File a Complaint
											</Link>
										</>
									) : (
										<>
											<Link
												href="/register"
												className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
											>
												Get Started
											</Link>
											<Link
												href="/complaints/new"
												className="btn-secondary bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
											>
												File Complaint
											</Link>
										</>
									)}
								</div>
							</div>
							<div className="flex-1 relative">
								<div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
								<div className="relative bg-white p-8 rounded-2xl shadow-xl">
									<div className="grid grid-cols-2 gap-6">
										{[
											{
												title: "Quick Response",
												icon: "⚡",
												desc: "24/7 complaint monitoring",
											},
											{
												title: "Track Progress",
												icon: "📊",
												desc: "Real-time updates",
											},
											{
												title: "Smart Routing",
												icon: "🎯",
												desc: "AI-powered assignment",
											},
											{
												title: "Analytics",
												icon: "📈",
												desc: "Data-driven insights",
											},
										].map((feature, idx) => (
											<div
												key={idx}
												className="p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors"
											>
												<div className="text-3xl mb-2">{feature.icon}</div>
												<h3 className="font-semibold text-gray-800">
													{feature.title}
												</h3>
												<p className="text-sm text-gray-600">{feature.desc}</p>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* How It Works Section */}
				<section className="py-20 bg-gradient-to-b from-white to-blue-50">
					<div className="container mx-auto px-6">
						<h3 className="text-3xl font-bold text-center mb-12 text-gray-800">
							How Sahaay Works
						</h3>
						<div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
							{[
								{
									step: "1",
									title: "Register & Submit",
									desc: "Create your account and submit complaints with detailed information",
									color: "blue",
								},
								{
									step: "2",
									title: "Track Progress",
									desc: "Monitor real-time updates and status changes of your complaints",
									color: "purple",
								},
								{
									step: "3",
									title: "Resolution & Feedback",
									desc: "Receive resolution updates and provide feedback on services",
									color: "indigo",
								},
							].map((item, idx) => (
								<div key={idx} className="relative group">
									<div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl transform transition-transform group-hover:scale-105 duration-300"></div>
									<div className="relative p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
										<div
											className={`w-12 h-12 rounded-full bg-${item.color}-100 text-${item.color}-600 flex items-center justify-center text-xl font-bold mb-4`}
										>
											{item.step}
										</div>
										<h4 className="text-xl font-semibold mb-2">{item.title}</h4>
										<p className="text-gray-600">{item.desc}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Complaint Hotspots Map */}
				<section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
					<div className="container mx-auto px-6">
						<div className="text-center mb-12">
							<h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
								Real-Time Geospatial Intelligence
							</h3>
							<p className="text-gray-600 max-w-3xl mx-auto text-lg">
								Our advanced machine learning system identifies complaint hotspots using <strong>DBSCAN clustering</strong> and 
								<strong> Kernel Density Estimation</strong>. Visualize high-priority zones and optimize resource allocation in real-time.
							</p>
						</div>
						<div className="max-w-7xl mx-auto">
							<HotspotMap />
						</div>
					</div>
				</section>

				{/* Statistics Section */}
				<section className="py-20 bg-gradient-to-b from-blue-50 to-white">
					<div className="container mx-auto px-6">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
							{[
								{ value: "98%", label: "Resolution Rate" },
								{ value: "24/7", label: "Support" },
								{ value: "15min", label: "Avg Response" },
								{ value: "50k+", label: "Citizens Served" },
							].map((stat, idx) => (
								<div key={idx} className="text-center">
									<div className="text-3xl font-bold text-blue-600 mb-2">
										{stat.value}
									</div>
									<div className="text-gray-600">{stat.label}</div>
								</div>
							))}
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="bg-gray-900 text-white py-12">
				<div className="container mx-auto px-6">
					<div className="grid md:grid-cols-3 gap-8">
						<div>
							<h4 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
								Sahaay
							</h4>
							<p className="text-gray-400">
								Empowering citizens through efficient complaint resolution and
								transparent governance.
							</p>
						</div>
						<div>
							<h5 className="font-semibold mb-4 text-gray-300">Quick Links</h5>
							<ul className="space-y-2 text-gray-400">
								<li>
									<Link
										href="/register"
										className="hover:text-blue-400 transition-colors"
									>
										Register
									</Link>
								</li>
								<li>
									<Link
										href="/complaints/new"
										className="hover:text-blue-400 transition-colors"
									>
										File Complaint
									</Link>
								</li>
								<li>
									<Link
										href="/analytics"
										className="hover:text-blue-400 transition-colors"
									>
										Analytics
									</Link>
								</li>
								<li>
									<Link
										href="/about"
										className="hover:text-blue-400 transition-colors"
									>
										About Us
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h5 className="font-semibold mb-4 text-gray-300">Contact</h5>
							<ul className="space-y-2 text-gray-400">
								<li>Email: support@sahaay.com</li>
								<li>Phone: 1800-SAHAAY</li>
								<li>24/7 Support Available</li>
							</ul>
						</div>
					</div>
					<div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
						<p>
							&copy; {new Date().getFullYear()} Sahaay. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}