import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export function withAuth(WrappedComponent) {
	return function AuthComponent(props) {
		const router = useRouter();
		const [isLoading, setIsLoading] = useState(true);

		useEffect(() => {
			// Check if user is logged in
			const token = localStorage.getItem("token");
			const citizenId = localStorage.getItem("citizenId");

			if (!token || !citizenId) {
				console.log("No auth token or citizenId found, redirecting to login");
				router.push("/login");
			} else {
				setIsLoading(false);
			}
		}, [router]);

		// Show loading state or protected component
		return isLoading ? (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
			</div>
		) : (
			<WrappedComponent {...props} />
		);
	};
}
