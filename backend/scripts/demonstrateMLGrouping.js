import mongoose from "mongoose";
import dotenv from "dotenv";
import Complaint from "../models/Complaint.js";
import Citizen from "../models/Citizen.js";
import { connectMongo } from "../config/mongo.js";
import { findSimilarComplaints } from "../utils/complaintClustering.js";

// Load environment variables
dotenv.config();

async function demonstrateMLGrouping() {
  try {
    // Connect to MongoDB
    await connectMongo();
    console.log("Connected to MongoDB\n");

    console.log("=== MACHINE LEARNING-BASED COMPLAINT GROUPING DEMONSTRATION ===\n");
    
    // Get all complaints
    const complaints = await Complaint.find();
    
    console.log("Total complaints in database:", complaints.length);
    
    // Find a complaint to test grouping
    const testComplaint = complaints.find(c => c.title.includes("Power Outage"));
    
    if (!testComplaint) {
      console.log("No power outage complaint found for testing");
      process.exit(1);
    }
    
    console.log("\n--- TESTING GROUPING FOR COMPLAINT ---");
    console.log("Title:", testComplaint.title);
    console.log("Location:", testComplaint.location.address);
    console.log("Coordinates:", testComplaint.location.coordinates);
    console.log("Description:", testComplaint.description.substring(0, 100) + "...");
    
    // Find similar complaints
    console.log("\n--- RUNNING ML-BASED SIMILARITY ANALYSIS ---");
    const similarGroup = await findSimilarComplaints(testComplaint, 2, 0.6); // 2km radius, 60% similarity
    
    if (similarGroup) {
      console.log("✅ GROUPING SUCCESSFUL!");
      console.log("Group ID:", similarGroup.id);
      console.log("Number of similar complaints:", similarGroup.complaints.length);
      console.log("Average location:", similarGroup.averageLocation);
      
      console.log("\n--- GROUPED COMPLAINTS ---");
      similarGroup.complaints.forEach((complaint, index) => {
        console.log(`${index + 1}. ${complaint.title}`);
        console.log(`   Location: ${complaint.location.address}`);
        console.log(`   Coordinates: [${complaint.location.coordinates[0]}, ${complaint.location.coordinates[1]}]`);
        console.log(`   Description: ${complaint.description.substring(0, 80)}...`);
        console.log();
      });
      
      // Show how the grouping works
      console.log("--- HOW GROUPING WORKS ---");
      console.log("1. TEXT SIMILARITY ANALYSIS:");
      console.log("   - Uses string-similarity and @nlpjs/similarity libraries");
      console.log("   - Compares complaint titles, descriptions, and categories");
      console.log("   - Similarity threshold: 60%");
      
      console.log("\n2. GEOGRAPHIC PROXIMITY:");
      console.log("   - Uses Haversine formula to calculate distances");
      console.log("   - Groups complaints within 2km radius");
      console.log("   - Considers both text and location for grouping");
      
      console.log("\n3. MACHINE LEARNING BENEFITS:");
      console.log("   - Helps identify patterns in citizen complaints");
      console.log("   - Enables prioritization of widespread issues");
      console.log("   - Reduces duplicate work for authorities");
      console.log("   - Improves response times for grouped complaints");
    } else {
      console.log("❌ No similar complaints found for grouping");
    }
    
    console.log("\n=== DEMONSTRATION COMPLETED ===");
    process.exit(0);
  } catch (error) {
    console.error("Error in ML grouping demonstration:", error);
    process.exit(1);
  }
}

demonstrateMLGrouping();