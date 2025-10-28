// Simple test script to POST a new citizen registration to the backend
// Usage: node scripts/testRegisterBackend.js

const http = require("http");

const data = JSON.stringify({
	name: "Test User",
	email: `testuser+${Date.now()}@example.com`,
	phone: "9999999999",
	address: "123 Test Street",
	city: "Testville",
	// password must meet backend validation (include a special character)
	password: "TestPassword123!",
});

const options = {
	hostname: "localhost",
	port: 5000,
	path: "/api/citizens/register",
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		"Content-Length": Buffer.byteLength(data),
	},
	timeout: 5000,
};

const req = http.request(options, (res) => {
	console.log(`STATUS: ${res.statusCode}`);
	console.log("HEADERS:", res.headers);
	let body = "";
	res.setEncoding("utf8");
	res.on("data", (chunk) => {
		body += chunk;
	});
	res.on("end", () => {
		console.log("BODY:", body);
	});
});

req.on("error", (e) => {
	console.error("Request error:", e.message);
});

req.on("timeout", () => {
	console.error("Request timed out");
	req.abort();
});

req.write(data);
req.end();
