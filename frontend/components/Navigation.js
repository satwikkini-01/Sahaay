import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../utils/api";
import { onAuthStateChanged, emitAuthStateChanged } from "../utils/authEvent";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../contexts/LanguageContext";

export default function Navigation() {
	const router = useRouter();
	const { t } = useLanguage();
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [citizenData, setCitizenData] = useState(null);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const checkAuth = () => {
		const token = localStorage.getItem("token");
		const citizenData = localStorage.getItem("citizenData");
		setIsLoggedIn(!!token);
		setCitizenData(citizenData ? JSON.parse(citizenData) : null);
	};

	useEffect(() => {
		// Check auth status on mount and when localStorage changes
		checkAuth();

		// Listen for storage events (for multi-tab sync)
		window.addEventListener("storage", checkAuth);

		// Listen for our custom auth state change events
		const unsubscribe = onAuthStateChanged(checkAuth);

		return () => {
			window.removeEventListener("storage", checkAuth);
			unsubscribe();
		};
	}, []);

	const handleLogout = async () => {
		try {
			await api.post("/api/citizens/logout");
			localStorage.removeItem("token");
			localStorage.removeItem("citizenId");
			localStorage.removeItem("citizenData");
			setIsLoggedIn(false);
			setCitizenData(null);
			emitAuthStateChanged();
			router.push("/login");
		} catch (error) {
			console.error("Logout failed:", error);
			// Still clear local storage and redirect even if the API call fails
			localStorage.removeItem("token");
			localStorage.removeItem("citizenId");
			localStorage.removeItem("citizenData");
			setIsLoggedIn(false);
			setCitizenData(null);
			emitAuthStateChanged();
			router.push("/login");
		}
	};

	// Navigation items based on auth status - NOW WITH TRANSLATIONS
	const navItems = isLoggedIn
		? [
				{ href: "/complaints/new", label: t('nav.fileComplaint') },
				{ href: "/complaints", label: t('nav.myComplaints') },
				{ href: "/analytics", label: t('nav.analytics') },
				{ href: "/profile", label: t('nav.profile') },
				{ href: "/about", label: t('nav.about') },
		  ]
		: [
				{ href: "/login", label: t('auth.login') },
				{ href: "/register", label: t('auth.signup') },
				{ href: "/analytics", label: t('nav.analytics') },
				{ href: "/about", label: t('nav.about') },
		  ];

	return (
		<header className="sticky top-0 z-50 bg-white bg-opacity-80 backdrop-blur-md border-b border-blue-100">
			<div className="container mx-auto px-4">
				<div className="flex justify-between items-center py-4">
					{/* Logo */}
					<Link href="/" className="flex-shrink-0">
						<h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							Sahaay
						</h1>
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center space-x-6">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`text-gray-600 hover:text-blue-600 transition-colors ${
									router.pathname === item.href
										? "text-blue-600 font-medium"
										: ""
								}`}
							>
								{item.label}
							</Link>
						))}
						{isLoggedIn && (
							<button
								onClick={handleLogout}
								className="text-red-600 hover:text-red-700 font-medium transition-colors"
							>
								{t('auth.logout')}
							</button>
						)}
						<LanguageSwitcher />
					</nav>

					{/* Mobile menu button */}
					<button
						className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
						onClick={() => setIsMenuOpen(!isMenuOpen)}
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							{isMenuOpen ? (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							) : (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							)}
						</svg>
					</button>
				</div>

				{/* Mobile Navigation */}
				<div className={`md:hidden ${isMenuOpen ? "block" : "hidden"} pb-4`}>
					<nav className="flex flex-col space-y-4">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`text-gray-600 hover:text-blue-600 transition-colors ${
									router.pathname === item.href
										? "text-blue-600 font-medium"
										: ""
								}`}
								onClick={() => setIsMenuOpen(false)}
							>
								{item.label}
							</Link>
						))}
						{isLoggedIn && (
							<button
								onClick={() => {
									handleLogout();
									setIsMenuOpen(false);
								}}
								className="text-red-600 hover:text-red-700 font-medium transition-colors text-left"
							>
								{t('auth.logout')}
							</button>
						)}
						<div className="pt-2 border-t border-gray-200">
							<LanguageSwitcher />
						</div>
					</nav>
				</div>
			</div>
		</header>
	);
}
