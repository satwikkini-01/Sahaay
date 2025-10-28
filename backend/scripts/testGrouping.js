import mongoose from "mongoose";
import dotenv from "dotenv";
import Complaint from "../models/Complaint.js";
import Citizen from "../models/Citizen.js";
import { connectMongo } from "../config/mongo.js";
import { findSimilarComplaints, updateComplaintWithGroup } from "../utils/complaintClustering.js";

// Load environment variables
dotenv.config();

// Similar complaints to test grouping
const similarComplaints = [
  {
    department: {
      pgDeptId: 1,
      name: "Electricity Department"
    },
    title: "Power Outage in Koramangala",
    description: "Complete power outage in Koramangala 4th Block for the past 6 hours. Multiple apartments affected.",
    category: "electricity",
    priority: "high",
    status: "pending",
    location: {
      type: "Point",
      coordinates: [77.6376, 12.9353], // Slightly different coordinates
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
    title: "Power Outage in Koramangala Area",
    description: "Power outage affecting Koramangala 4th Block for the past 5 hours. Residents experiencing inconvenience.",
    category: "electricity",
    priority: "high",
    status: "pending",
    location: {
      type: "Point",
      coordinates: [77.6374, 12.9351], // Slightly different coordinates
      address: "Koramangala 4th Block, Bangalore, Karnataka",
      landmark: "Near Forum Mall",
      zipcode: "560034",
      city: "Bangalore"
    },
    slaHours: 48,
    groupSize: 1
  }
];

async function testGrouping() {
  try {
    // Connect to MongoDB
    await connectMongo();
    console.log("Connected to MongoDB");

    // Get the citizen
    const citizen = await Citizen.findOne({ email: "rajesh.kumar@example.com" });
    if (!citizen) {
      console.error("Citizen not found");
      process.exit(1);
    }
    console.log(`Found citizen: ${citizen.name}`);

    // Add citizen ID to all complaints
    const complaintsToInsert = similarComplaints.map(complaint => ({
      ...complaint,
      citizen: citizen._id
    }));

    // Add similar complaints
    const createdComplaints = [];
    for (const complaintData of complaintsToInsert) {
      const newComplaint = new Complaint(complaintData);
      await newComplaint.save();
      console.log(`Added complaint: ${complaintData.title}`);
      createdComplaints.push(newComplaint);
    }

    // Test grouping functionality
    console.log("\nTesting grouping functionality...");
    
    // Test with the first new complaint
    const testComplaint = createdComplaints[0];
    const similarGroup = await findSimilarComplaints(testComplaint);
    
    if (similarGroup) {
      console.log(`Found group with ${similarGroup.complaints.length} similar complaints`);
      
      // Update all complaints in the group
      for (const similarComplaint of similarGroup.complaints) {
        await updateComplaintWithGroup(similarComplaint, similarGroup);
      }
      
      console.log("Updated complaints with group information");
    } else {
      console.log("No similar complaints found");
    }

    console.log("Grouping test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error testing grouping:", error);
    process.exit(1);
  }
}

testGrouping();