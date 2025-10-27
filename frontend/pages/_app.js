import "../styles/globals.css";
import Navigation from "../components/Navigation";

function MyApp({ Component, pageProps }) {
	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
			<Navigation />
			<Component {...pageProps} />
		</div>
	);
}

export default MyApp;
