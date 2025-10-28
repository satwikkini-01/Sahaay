import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Complaint from "../models/Complaint.js";
import Citizen from "../models/Citizen.js";
import { connectMongo } from "../config/mongo.js";

// Load environment variables
dotenv.config();

// Dummy Bangalore citizen data
const dummyCitizen = {
  name: "Rajesh Kumar",
  email: "rajesh.kumar@example.com",
  phone: "9876543210",
  password: "Password@123",
  address: "123, MG Road, Bangalore",
  city: "Bangalore"
};

// Dummy Bangalore complaints data
const dummyComplaints = [
  {
    department: {
      pgDeptId: 1,
      name: "Electricity Department"
    },
    title: "Power Outage in Koramangala",
    description: "Complete power outage in Koramangala 4th Block for the past 4 hours. Multiple apartments affected.",
    category: "electricity",
    priority: "high",
    status: "pending",
    location: {
      type: "Point",
      coordinates: [77.6375, 12.9352], // Koramangala coordinates
      address: "Koramangala 4th Block, Bangalore, Karnataka",
      landmark: "Near Forum Mall",
      zipcode: "560034",
      city: "Bangalore"
    },
    slaHours: 48,
    groupSize: 1
  },
  {
    department: {
      pgDeptId: 1,
      name: "Electricity Department"
    },
    title: "Street Light Not Working",
    description: "Street lights not working in Indiranagar 1st Stage for the past week. Poor visibility at night causing safety concerns.",
    category: "electricity",
    priority: "medium",
    status: "pending",
    location: {
      type: "Point",
      coordinates: [77.6394, 12.9733], // Indiranagar coordinates
      address: "Indiranagar 1st Stage, Bangalore, Karnataka",
      landmark: "Near CMH Road",
      zipcode: "560038",
      city: "Bangalore"
    },
    slaHours: 72,
    groupSize: 1
  },
  {
    department: {
      pgDeptId: 2,
      name: "Water Department"
    },
    title: "Water Supply Issue",
    description: "Irregular water supply in HSR Layout Sector 1. Supply available only for 2 hours in the morning.",
    category: "water",
    priority: "medium",
    status: "pending",
    location: {
      type: "Point",
      coordinates: [77.6575, 12.9147], // HSR Layout coordinates
      address: "HSR Layout Sector 1, Bangalore, Karnataka",
      landmark: "Near HSR Metro Station",
      zipcode: "560102",
      city: "Bangalore"
    },
    slaHours: 72,
    groupSize: 1
  },
  {
    department: {
      pgDeptId: 3,
      name: "Roads Department"
    },
    title: "Potholes on Bannerghatta Road",
    description: "Multiple potholes on Bannerghatta Road near BTM Layout causing vehicle damage and traffic issues.",
    category: "roads",
    priority: "high",
    status: "pending",
    location: {
      type: "Point",
      coordinates: [77.6096, 12.8871], // Bannerghatta Road coordinates
      address: "Bannerghatta Road, BTM Layout, Bangalore, Karnataka",
      landmark: "Near IIM Bangalore",
      zipcode: "560076",
      city: "Bangalore"
    },
    slaHours: 48,
    groupSize: 1
  },
  {
    department: {
      pgDeptId: 3,
      name: "Roads Department"
    },
    title: "Road Construction Dust",
    description: "Excessive dust from road construction work in Whitefield affecting nearby residential areas.",
    category: "roads",
    priority: "medium",
    status: "pending",
    location: {
      type: "Point",
      coordinates: [77.7175, 12.9698], // Whitefield coordinates
      address: "Whitefield, Bangalore, Karnataka",
      landmark: "Near Prestige Tech Park",
      zipcode: "560066",
      city: "Bangalore"
    },
    slaHours: 72,
    groupSize: 1
  }
];

async function addDummyData() {
  try {
    // Connect to MongoDB
    await connectMongo();
    console.log("Connected to MongoDB");

    // Clear existing data
    await Citizen.deleteMany({});
    await Complaint.deleteMany({});
    console.log("Cleared existing data");

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dummyCitizen.password, salt);
    
    // Create a dummy citizen with hashed password
    const citizenData = {
      ...dummyCitizen,
      password: hashedPassword
    };
    
    const citizen = new Citizen(citizenData);
    await citizen.save();
    console.log(`Created citizen: ${citizen.name}`);

    // Add citizen ID to all complaints
    const complaintsToInsert = dummyComplaints.map(complaint => ({
      ...complaint,
      citizen: citizen._id
    }));

    // Add dummy complaints
    for (const complaintData of complaintsToInsert) {
      const newComplaint = new Complaint(complaintData);
      await newComplaint.save();
      console.log(`Added complaint: ${complaintData.title}`);
    }

    console.log("Dummy data added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding dummy data:", error);
    process.exit(1);
  }
}

addDummyData();