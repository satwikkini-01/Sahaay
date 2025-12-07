import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { loadDataset } from '../utils/dataLoader.js';
import Citizen from '../models/Citizen.js';
import Department from '../models/Department.js';
import Complaint from '../models/Complaint.js';
import bcrypt from 'bcryptjs';

dotenv.config();

console.log('\n🌱 FAST SEEDING - Mysore Sample Data\n');

async function fastSeed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Clear old demo data
        await Complaint.deleteMany({});
        await Citizen.deleteMany({ email: { $regex: /demo.*@mysore/ } });
        console.log('✓ Cleared previous data');

        // Create departments
        const depts = await Promise.all([
            Department.findOneAndUpdate(
                { email: 'water@mysore.gov.in' },
                { name: 'Water Supply', categories: ['water'], city: 'Mysore', phone: '0821-2422155' },
                { upsert: true, new: true }
            ),
            Department.findOneAndUpdate(
                { email: 'electricity@mysore.gov.in' },
                { name: 'Electricity (CESC)', categories: ['electricity'], city: 'Mysore', phone: '0821-2424000' },
                { upsert: true, new: true }
            ),
            Department.findOneAndUpdate(
                { email: 'pwd@mysore.gov.in' },
                { name: 'Public Works', categories: ['roads'], city: 'Mysore', phone: '0821-2425100' },
                { upsert: true, new: true }
            )
        ]);
        console.log('✓ Created/Updated 3 departments');

        // Create citizens (reusable password hash)
        const hashedPwd = await bcrypt.hash('demo123', 10);
        const citizens = [];
        
        for (let i = 1; i <= 15; i++) {
            const citizen = await Citizen.findOneAndUpdate(
                { email: `demo${i}@mysore.gov.in` },
                {
                    name: `Demo User ${i}`,
                    email: `demo${i}@mysore.gov.in`,
                    phone: `98765${String(i).padStart(5, '0')}`,
                    password: hashedPwd,
                    address: `Ward ${i}, Mysore`,
                    city: 'Mysore'
                },
                { upsert: true, new: true }
            );
            citizens.push(citizen);
        }
        console.log(`✓ Created ${citizens.length} demo citizens`);

        // Load CSV
        const data = await loadDataset('mysore_test_cases.csv');
        console.log(`✓ Loaded ${data.length} complaints from CSV`);

        // Simple priority score mapping (skip ML analysis for speed)
        const getPriorityScore = (priority) => {
            return priority === 'high' ? 85 : priority === 'medium' ? 50 : 20;
        };

        const getSlaHours = (priority) => {
            return priority === 'high' ? 4 : priority === 'medium' ? 12 : 48;
        };

        // Batch prepare complaints
        const complaints = [];
        
        for (const row of data) {
            const citizen = citizens[Math.floor(Math.random() * citizens.length)];
            const dept = depts.find(d => d.categories.includes(row.category.toLowerCase()));
            
            if (!dept) continue;

            complaints.push({
                citizen: citizen._id,
                department: dept._id,
                title: row.title,
                description: row.description,
                category: row.category,
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)]
                },
                address: row.location_address,
                priority: row.priority,
                status: row.status || 'pending',
                slaHours: getSlaHours(row.priority),
                escalationLevel: 0,
                meta: {
                    priorityScore: getPriorityScore(row.priority),
                    priorityFactors: {
                        mlPrediction: row.priority,
                        mlConfidence: 0.85,
                        textScore: getPriorityScore(row.priority) * 0.6,
                        timeScore: 20
                    }
                },
                createdAt: new Date(row.created_date),
                resolvedAt: row.resolved_date ? new Date(row.resolved_date) : null,
                resolutionTime: row.resolution_time_hours ? parseFloat(row.resolution_time_hours) : null
            });
        }

        // Batch insert
        console.log(`\n💾 Inserting ${complaints.length} complaints...`);
        const inserted = await Complaint.insertMany(complaints, { ordered: false });
        console.log(`✓ Inserted ${inserted.length} complaints successfully`);

        // Show stats
        const stats = await Complaint.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);
        
        console.log('\n📊 Stats:');
        stats.forEach(s => console.log(`  ${s._id.toUpperCase()}: ${s.count}`));

        console.log('\n🎉 Database ready! Open the portal to see complaints.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fastSeed();
