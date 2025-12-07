import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import api from "../utils/api";
import { emitAuthStateChanged } from "../utils/authEvent";

export default function Login() {
	const router = useRouter();
	const { data: session } = useSession();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);

	// Handle Google Login Sync
	useEffect(() => {
		const syncGoogleLogin = async () => {
			if (session?.user && !localStorage.getItem("token")) {
				try {
                    setLoading(true);
					// Exchange Google session for App Token
					const response = await api.post("/api/citizens/google-login", {
						email: session.user.email,
						name: session.user.name,
                        googleId: session.user.id || "google_user" 
					});

					localStorage.setItem("token", response.data.token);
					localStorage.setItem("citizenId", response.data.citizen._id);
					localStorage.setItem("citizenData", JSON.stringify(response.data.citizen));
					emitAuthStateChanged();
					router.push("/");
				} catch (error) {
					console.error("Google sync failed:", error);
                    alert("Google Login Sync Failed");
				} finally {
                    setLoading(false);
                }
			}
		};
		syncGoogleLogin();
	}, [session, router]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
            setLoading(true);
			const response = await api.post("/api/citizens/login", formData);
			
            localStorage.setItem("token", response.data.token);
			localStorage.setItem("citizenId", response.data.citizen._id);
			localStorage.setItem("citizenData", JSON.stringify(response.data.citizen));
			emitAuthStateChanged();

			router.push("/");
		} catch (error) {
			console.error("Login failed:", error.response?.data || error.message);
			alert(error.response?.data?.error || "Login failed. Please try again.");
		} finally {
            setLoading(false);
        }
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
			<Head>
				<title>Login - Sahaay</title>
				<meta name="description" content="Login to your Sahaay account" />
			</Head>

			<main className="w-full max-w-md">
				<div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01] duration-300">
                    <div className="p-8 md:p-10">
						<div className="text-center mb-8">
                            <h2 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Welcome Back
                            </h2>
                            <p className="text-gray-500">Sign in to continue to Sahaay</p>
                        </div>

                        {/* Google Login Button */}
                        <button
                            onClick={() => signIn("google")}
                            disabled={loading}
                            className="w-full mb-6 flex items-center justify-center gap-3 bg-white border-2 border-gray-100 p-3 rounded-xl hover:bg-gray-50 hover:border-blue-200 transition-all duration-300 group"
                        >
                            <img 
                                src="https://www.svgrepo.com/show/475656/google-color.svg" 
                                alt="Google" 
                                className="w-6 h-6 group-hover:scale-110 transition-transform" 
                            />
                            <span className="font-semibold text-gray-700 group-hover:text-blue-600">
                                {loading ? "Connecting..." : "Continue with Google"}
                            </span>
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-gray-400 text-sm">or sign in with email</span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

						<form onSubmit={handleSubmit} className="space-y-5">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email Address</label>
								<input
									type="email"
                                    name="email"
									required
									value={formData.email}
									onChange={handleChange}
									className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
									placeholder="name@example.com"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Password</label>
								<input
									type="password"
                                    name="password"
									required
									value={formData.password}
									onChange={handleChange}
									className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
									placeholder="••••••••"
								/>
							</div>

							<button
								type="submit"
                                disabled={loading}
								className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
							>
								{loading ? "Signing In..." : "Sign In"}
							</button>
						</form>

                        <p className="mt-8 text-center text-gray-600">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-blue-600 font-bold hover:underline">
                                Create Account
                            </Link>
                        </p>
					</div>
				</div>
			</main>
		</div>
	);
}
