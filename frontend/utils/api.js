import axios from "axios";

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

// Add a request interceptor
api.interceptors.request.use(
	(config) => {
		// Add auth token from localStorage if available
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Add a response interceptor
api.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		// Handle different error cases
		if (error.response) {
			// Server responded with error status
			if (error.response.status === 401) {
				// Handle unauthorized access
				// You can redirect to login or refresh token
			}
		}
		return Promise.reject(error);
	}
);

export const api_endpoints = {
	// Auth
	login: "/auth/login",
	register: "/auth/register",
	logout: "/auth/logout",

	// Complaints
	complaints: "/complaints",
	complaintById: (id) => `/complaints/${id}`,

	// Analytics
	analytics: "/analytics",

	// Citizens
	citizens: "/citizens",
	citizenById: (id) => `/citizens/${id}`,

	// Departments
	departments: "/departments",
	departmentById: (id) => `/departments/${id}`,
};

export default api;
