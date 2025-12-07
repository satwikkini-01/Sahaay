import "../styles/globals.css";
import Navigation from "../components/Navigation";
import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
	return (
		<SessionProvider session={session}>
			<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
				<Navigation />
				<Component {...pageProps} />
			</div>
		</SessionProvider>
	);
}

export default MyApp;
