import mongoose from "mongoose";
import dotenv from "dotenv";
import Complaint from "../models/Complaint.js";
import Citizen from "../models/Citizen.js";
import { connectMongo } from "../config/mongo.js";

// Load environment variables
dotenv.config();

async function showGroupedData() {
  try {
    // Connect to MongoDB
    await connectMongo();
    console.log("Connected to MongoDB\n");

    // Get all complaints
    const complaints = await Complaint.find();
    
    console.log("=== ALL COMPLAINTS ===");
    complaints.forEach((complaint, index) => {
      console.log(`${index + 1}. ${complaint.title}`);
      console.log(`   Category: ${complaint.category}`);
      console.log(`   Location: ${complaint.location.address}`);
      console.log(`   Coordinates: [${complaint.location.coordinates[0]}, ${complaint.location.coordinates[1]}]`);
      console.log(`   Group ID: ${complaint.groupId || 'None'}`);
      console.log(`   Group Size: ${complaint.groupSize}`);
      console.log(`   Citizen ID: ${complaint.citizen}`);
      console.log(`   Created: ${complaint.createdAt}`);
      console.log("---");
    });
    
    console.log("\n=== GROUPED COMPLAINTS ===");
    // Group complaints by groupId
    const grouped = complaints.reduce((acc, complaint) => {
      const groupId = complaint.groupId || 'ungrouped';
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(complaint);
      return acc;
    }, {});
    
    Object.keys(grouped).forEach(groupId => {
      if (groupId === 'ungrouped') {
        console.log("Ungrouped complaints:");
        grouped[groupId].forEach(complaint => {
          console.log(`  - ${complaint.title}`);
        });
      } else {
        console.log(`Group ${groupId} (${grouped[groupId].length} complaints):`);
        grouped[groupId].forEach(complaint => {
          console.log(`  - ${complaint.title} at ${complaint.location.address}`);
        });
      }
      console.log();
    });
    
    console.log("Grouping test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error showing grouped data:", error);
    process.exit(1);
  }
}

showGroupedData();