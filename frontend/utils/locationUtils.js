// Utility functions for location handling

/**
 * Fetch location details by Indian pincode
 * @param {string} pincode - 6-digit Indian pincode
 * @returns {Promise<Object>} Location details including city, state, latitude, longitude
 */
export const getLocationByPincode = async (pincode) => {
	try {
		// Validate pincode format (6 digits)
		if (!pincode || !/^\d{6}$/.test(pincode)) {
			throw new Error("Invalid pincode format. Please enter a 6-digit pincode.");
		}

		// Using the free postalpincode.in API
		const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
		
		if (!response.ok) {
			throw new Error(`Failed to fetch pincode data: ${response.status}`);
		}
		
		const data = await response.json();
		
		if (data && data.length > 0 && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
			const postOffice = data[0].PostOffice[0];
			
			// Extract location details
			return {
				pincode: postOffice.Pincode,
				city: postOffice.District,
				state: postOffice.State,
				address: `${postOffice.Name}, ${postOffice.District}, ${postOffice.State}`,
				// Fix: Ensure latitude and longitude are valid numbers or null
				latitude: postOffice.Latitude ? parseFloat(postOffice.Latitude) : null,
				longitude: postOffice.Longitude ? parseFloat(postOffice.Longitude) : null
			};
		} else {
			throw new Error("Pincode not found or invalid");
		}
	} catch (error) {
		console.error("Error fetching location by pincode:", error);
		throw error;
	}
};

/**
 * Get current location using browser geolocation
 * @returns {Promise<Object>} Current location coordinates
 */
export const getCurrentLocation = () => {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error("Geolocation is not supported by this browser."));
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude
				});
			},
			(error) => {
				reject(new Error(`Unable to retrieve your location: ${error.message}`));
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 300000 // 5 minutes
			}
		);
	});
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} Address details
 */
export const reverseGeocode = async (latitude, longitude) => {
	try {
		// Using OpenStreetMap Nominatim API for reverse geocoding
		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
		);
		
		if (!response.ok) {
			throw new Error(`Failed to reverse geocode: ${response.status}`);
		}
		
		const data = await response.json();
		
		if (data && data.address) {
			return {
				address: data.display_name,
				city: data.address.city || data.address.town || data.address.village || "",
				state: data.address.state || "",
				country: data.address.country || "",
				zipcode: data.address.postcode || ""
			};
		} else {
			throw new Error("Unable to reverse geocode coordinates");
		}
	} catch (error) {
		console.error("Error in reverse geocoding:", error);
		throw error;
	}
};