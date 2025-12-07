import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { reverseGeocode } from "../utils/locationUtils";

// Fix default marker icon issue in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
	iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
	shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
	useMapEvents({
		click(e) {
			setPosition([e.latlng.lat, e.latlng.lng]);
		},
	});

	return position ? <Marker position={position} draggable={true} eventHandlers={{
		dragend: (e) => {
			const marker = e.target;
			const newPos = marker.getLatLng();
			setPosition([newPos.lat, newPos.lng]);
		}
	}} /> : null;
}

export default function MapLocationPicker({ isOpen, onClose, onLocationSelect, initialCenter = [12.2958, 76.6394] }) {
	const [position, setPosition] = useState(null);
	const [address, setAddress] = useState("");
	const [isLoadingAddress, setIsLoadingAddress] = useState(false);

	// Reset position when modal opens
	useEffect(() => {
		if (isOpen) {
			setPosition(null);
			setAddress("");
		}
	}, [isOpen]);

	// Reverse geocode when position changes
	useEffect(() => {
		if (position) {
			const [lat, lng] = position;
			setIsLoadingAddress(true);
			reverseGeocode(lat, lng)
				.then((data) => {
					setAddress(data.address);
					setIsLoadingAddress(false);
				})
				.catch((error) => {
					console.error("Reverse geocoding error:", error);
					setAddress("Unable to fetch address");
					setIsLoadingAddress(false);
				});
		}
	}, [position]);

	const handleConfirm = () => {
		if (position) {
			const [lat, lng] = position;
			reverseGeocode(lat, lng)
				.then((data) => {
					onLocationSelect({
						latitude: lat,
						longitude: lng,
						address: data.address,
						city: data.city,
						zipcode: data.zipcode,
					});
					onClose();
				})
				.catch((error) => {
					console.error("Error confirming location:", error);
					alert("Failed to get address details. Please try again.");
				});
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			{/* Backdrop */}
			<div 
				className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={onClose}
			></div>

			{/* Modal */}
			<div className="flex min-h-full items-center justify-center p-4">
				<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
					{/* Header */}
					<div className="px-6 py-4 border-b border-gray-200">
						<div className="flex items-center justify-between">
							<h3 className="text-xl font-semibold text-gray-800">
								Select Location on Map
							</h3>
							<button
								onClick={onClose}
								className="text-gray-400 hover:text-gray-600 transition-colors"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<p className="text-sm text-gray-600 mt-1">
							Click anywhere on the map to pinpoint your complaint location
						</p>
					</div>

					{/* Map Container */}
					<div className="p-6">
						<div className="h-96 rounded-lg overflow-hidden border-2 border-gray-200">
							<MapContainer
								center={initialCenter}
								zoom={13}
								style={{ height: "100%", width: "100%" }}
								scrollWheelZoom={true}
							>
								<TileLayer
									attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
									url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
								/>
								<LocationMarker position={position} setPosition={setPosition} />
							</MapContainer>
						</div>

						{/* Location Info */}
						{position && (
							<div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm font-medium text-blue-800">Coordinates:</p>
										<p className="text-sm text-blue-600 font-mono">
											{position[0].toFixed(6)}, {position[1].toFixed(6)}
										</p>
									</div>
									<div className="col-span-2">
										<p className="text-sm font-medium text-blue-800">Address:</p>
										<p className="text-sm text-blue-600">
											{isLoadingAddress ? "Loading address..." : address}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200">
						<div className="flex justify-end gap-3">
							<button
								onClick={onClose}
								className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirm}
								disabled={!position || isLoadingAddress}
								className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Confirm Location
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
