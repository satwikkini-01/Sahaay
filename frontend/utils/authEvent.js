// Custom event for auth state changes
const AUTH_STATE_CHANGED = "authStateChanged";

export const emitAuthStateChanged = () => {
	// Create and dispatch a custom event
	const event = new Event(AUTH_STATE_CHANGED);
	window.dispatchEvent(event);
};

export const onAuthStateChanged = (callback) => {
	window.addEventListener(AUTH_STATE_CHANGED, callback);
	return () => window.removeEventListener(AUTH_STATE_CHANGED, callback);
};
