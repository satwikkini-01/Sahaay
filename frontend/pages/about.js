import Head from "next/head";
import Link from "next/link";

export default function About() {
	const features = [
		{
			title: "Smart Complaint Routing",
			description:
				"AI-powered system that automatically routes complaints to the right department",
			icon: "🎯",
		},
		{
			title: "Real-time Updates",
			description:
				"Get instant notifications about your complaint status and progress",
			icon: "⚡",
		},
		{
			title: "Data Analytics",
			description:
				"Advanced analytics to improve service delivery and response times",
			icon: "📊",
		},
		{
			title: "SLA Monitoring",
			description:
				"Automated tracking of service level agreements for timely resolution",
			icon: "⏱️",
		},
	];

	const team = [
		{
			name: "Alex Johnson",
			role: "Project Lead",
			image: "https://i.pravatar.cc/150?img=1",
		},
		{
			name: "Sarah Chen",
			role: "Technical Architect",
			image: "https://i.pravatar.cc/150?img=2",
		},
		{
			name: "Michael Brown",
			role: "ML Engineer",
			image: "https://i.pravatar.cc/150?img=3",
		},
		{
			name: "Priya Sharma",
			role: "UX Designer",
			image: "https://i.pravatar.cc/150?img=4",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
			<Head>
				<title>About Sahaay - Your Citizen Portal</title>
				<meta
					name="description"
					content="Learn more about Sahaay - A smart citizen complaint management system"
				/>
			</Head>

			{/* Hero Section */}
			<section className="py-20 text-center">
				<div className="container mx-auto px-6">
					<h2 className="text-4xl md:text-5xl font-bold mb-6">
						Empowering Citizens Through
						<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							{" "}
							Technology
						</span>
					</h2>
					<p className="text-xl text-gray-600 max-w-3xl mx-auto">
						Sahaay is a next-generation citizen complaint management system that
						leverages AI and data analytics to streamline public service
						delivery.
					</p>
				</div>
			</section>

			{/* Features */}
			<section className="py-16 bg-white">
				<div className="container mx-auto px-6">
					<h3 className="text-3xl font-bold text-center mb-12">
						What Makes Us Different
					</h3>
					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{features.map((feature, idx) => (
							<div
								key={idx}
								className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl hover:shadow-lg transition-shadow"
							>
								<div className="text-4xl mb-4">{feature.icon}</div>
								<h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
								<p className="text-gray-600">{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Mission */}
			<section className="py-16">
				<div className="container mx-auto px-6">
					<div className="max-w-4xl mx-auto text-center">
						<h3 className="text-3xl font-bold mb-6">Our Mission</h3>
						<p className="text-xl text-gray-600 mb-8">
							To create a transparent, efficient, and citizen-centric platform
							that bridges the gap between citizens and public services,
							ensuring timely resolution of civic issues through innovative
							technology solutions.
						</p>
						<div className="grid md:grid-cols-3 gap-8 text-center">
							{[
								{ value: "50k+", label: "Citizens Served" },
								{ value: "98%", label: "Resolution Rate" },
								{ value: "4.8/5", label: "User Rating" },
							].map((stat, idx) => (
								<div key={idx}>
									<div className="text-3xl font-bold text-blue-600 mb-2">
										{stat.value}
									</div>
									<div className="text-gray-600">{stat.label}</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Team */}
			<section className="py-16 bg-white">
				<div className="container mx-auto px-6">
					<h3 className="text-3xl font-bold text-center mb-12">
						Meet Our Team
					</h3>
					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{team.map((member, idx) => (
							<div key={idx} className="text-center">
								<div className="w-32 h-32 mx-auto mb-4">
									<img
										src={member.image}
										alt={member.name}
										className="w-full h-full object-cover rounded-full shadow-lg"
									/>
								</div>
								<h4 className="text-xl font-semibold mb-1">{member.name}</h4>
								<p className="text-gray-600">{member.role}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Contact */}
			<section className="py-16">
				<div className="container mx-auto px-6">
					<div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-8 text-center">
						<h3 className="text-3xl font-bold mb-4">Get in Touch</h3>
						<p className="text-lg mb-6">
							Have questions or suggestions? We'd love to hear from you.
						</p>
						<div className="flex flex-col md:flex-row justify-center gap-4">
							<div className="flex items-center justify-center gap-2">
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
								<span>support@sahaay.com</span>
							</div>
							<div className="flex items-center justify-center gap-2">
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
									/>
								</svg>
								<span>1800-SAHAAY</span>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
