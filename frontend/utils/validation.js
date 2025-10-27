import * as Yup from "yup";

export const registerValidationSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Name is too short")
		.max(50, "Name is too long")
		.required("Name is required"),
	email: Yup.string()
		.email("Invalid email address")
		.required("Email is required"),
	password: Yup.string()
		.min(8, "Password must be at least 8 characters")
		.matches(/[0-9]/, "Password must contain at least one number")
		.matches(/[a-z]/, "Password must contain at least one lowercase letter")
		.matches(/[A-Z]/, "Password must contain at least one uppercase letter")
		.matches(/[^\w]/, "Password must contain at least one special character")
		.required("Password is required"),
	phone: Yup.string()
		.matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
		.required("Phone number is required"),
	address: Yup.string()
		.min(10, "Address is too short")
		.max(200, "Address is too long")
		.required("Address is required"),
});

export const complaintValidationSchema = Yup.object().shape({
	title: Yup.string()
		.min(5, "Title is too short")
		.max(100, "Title is too long")
		.required("Title is required"),
	description: Yup.string()
		.min(20, "Description is too short")
		.max(1000, "Description is too long")
		.required("Description is required"),
	category: Yup.string().required("Category is required"),
	location: Yup.string()
		.min(5, "Location is too short")
		.max(200, "Location is too long")
		.required("Location is required"),
	attachments: Yup.array().of(
		Yup.mixed()
			.test("fileSize", "File is too large", (value) => {
				if (!value) return true;
				return value.size <= 5000000; // 5MB
			})
			.test("fileType", "Unsupported file type", (value) => {
				if (!value) return true;
				return [
					"image/jpeg",
					"image/png",
					"image/jpg",
					"application/pdf",
				].includes(value.type);
			})
	),
});

export const loginValidationSchema = Yup.object().shape({
	email: Yup.string()
		.email("Invalid email address")
		.required("Email is required"),
	password: Yup.string().required("Password is required"),
});
