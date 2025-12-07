import "../styles/globals.css";
import Navigation from "../components/Navigation";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "../contexts/LanguageContext";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
	return (
		<SessionProvider session={session}>
			<LanguageProvider>
				<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
					<Navigation />
					<Component {...pageProps} />
				</div>
			</LanguageProvider>
		</SessionProvider>
	);
}

export default MyApp;
