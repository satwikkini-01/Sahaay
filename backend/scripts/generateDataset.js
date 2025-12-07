import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Templates for generating realistic complaints
const templates = {
    water: {
        high: [
            "No water supply for {days} days in {area}. {people} households affected. Urgent intervention needed.",
            "Major pipeline burst causing flooding in {area}. Water wastage and property damage.",
            "Contaminated water with foul smell in {area}. Health hazard for {people} residents.",
            "Sewage overflow near {landmark}. Urgent cleaning and repair required."
        ],
        medium: [
            "Low water pressure in {area} during morning hours. Difficulty filling tanks.",
            "Pipeline leakage near {landmark} wasting water for past {days} days.",
            "Irregular water supply schedule in {area}. Request for timely supply.",
            "Water meter malfunction in {area}. Billing discrepancy issues."
        ],
        low: [
            "Request for new water connection in {area}.",
            "Minor leak in water pipe near {landmark}. Needs attention.",
            "Water meter reading correction request for {area}.",
            "Request for scheduled maintenance of water tank in {area}."
        ]
    },
    electricity: {
        high: [
            "Power outage for {hours} hours in {area}. {people} homes affected.",
            "Transformer sparking near {landmark}. Risk of fire and electric shock.",
            "Live wire hanging on road in {area}. Immediate safety hazard.",
            "Frequent short circuits causing appliance damage in {area}."
        ],
        medium: [
            "Street lights not working in {area} for {days} days. Safety concern.",
            "Voltage fluctuations damaging electronics in {area}.",
            "Power cuts {hours} times daily in {area}. Work disruption.",
            "Electric pole damaged near {landmark}. Needs repair."
        ],
        low: [
            "Request for new street light installation in {area}.",
            "Electricity bill discrepancy for {area}.",
            "Request for underground cable instead of overhead in {area}.",
            "Minor issue with meter reading in {area}."
        ]
    },
    roads: {
        high: [
            "Large pothole on {area} main road causing accidents. {people} vehicles damaged.",
            "Road completely collapsed near {landmark}. Traffic at standstill.",
            "Flooding on {area} making road unusable during rain.",
            "Bridge damage near {area}. Structural safety concern."
        ],
        medium: [
            "Multiple potholes on {area} road. Vehicle damage risk.",
            "Road surface damaged in {area}. Needs resurfacing.",
            "Waterlogging issue in {area} during monsoon.",
            "Road marking faded on {area} causing confusion."
        ],
        low: [
            "Request for speed breaker installation in {area}.",
            "Signboard missing near {landmark} in {area}.",
            "Minor road repair needed in {area}.",
            "Request for zebra crossing near school in {area}."
        ]
    }
};

const areas = [
    "Koramangala", "Indiranagar", "Whitefield", "Jayanagar", "Malleshwaram",
    "HSR Layout", "Marathahalli", "Rajajinagar", "Banashankari", "Yelahanka",
    "BTM Layout", "JP Nagar", "Electronic City", "Hebbal", "Sarjapur Road",
    "CV Raman Nagar", "RT Nagar", "Basavanagudi", "Vijayanagar", "Kammanahalli"
];

const landmarks = [
    "bus stop", "metro station", "school", "hospital", "main junction",
    "market area", "residential complex", "commercial center", "park entrance",
    "police station", "post office", "shopping mall", "temple", "church"
];

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateComplaint(id, category, priority) {
    const template = randomChoice(templates[category][priority]);
    const area = randomChoice(areas);
    const landmark = randomChoice(landmarks);
    
    const description = template
        .replace('{area}', area)
        .replace('{landmark}', landmark)
        .replace('{days}', Math.floor(Math.random() * 7) + 1)
        .replace('{hours}', Math.floor(Math.random() * 12) + 1)
        .replace('{people}', (Math.floor(Math.random() * 50) + 10) * 10);

    // Generate realistic coordinates for Bangalore
    const baseLat = 12.9716;
    const baseLng = 77.5946;
    const latitude = (baseLat + (Math.random() - 0.5) * 0.3).toFixed(4);
    const longitude = (baseLng + (Math.random() - 0.5) * 0.3).toFixed(4);

    const statusOptions = ['pending', 'in-progress', 'resolved', 'escalated'];
    const status = randomChoice(statusOptions);

    const createdDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const resolutionTime = status === 'resolved' ? Math.floor(Math.random() * 120) + 2 : null;
    const resolvedDate = resolutionTime ? new Date(createdDate.getTime() + resolutionTime * 3600000) : null;

    return {
        complaint_id: id,
        category,
        subcategory: category === 'water' ? randomChoice(['supply', 'quality', 'pressure', 'leakage']) :
                     category === 'electricity' ? randomChoice(['outage', 'streetlight', 'transformer', 'billing']) :
                     randomChoice(['pothole', 'flooding', 'repair', 'maintenance']),
        title: description.split('.')[0],
        description,
        location_address: `${area} Ward ${Math.floor(Math.random() * 200) + 1}`,
        ward_number: Math.floor(Math.random() * 200) + 1,
        latitude,
        longitude,
        priority,
        status,
        created_date: createdDate.toISOString().split('T')[0],
        resolved_date: resolvedDate ? resolvedDate.toISOString().split('T')[0] : '',
        resolution_time_hours: resolutionTime || ''
    };
}

function generateDataset(size = 1000) {
    const complaints = [];
    const categories = ['water', 'electricity', 'roads'];
    const priorities = ['low', 'medium', 'high'];
    
    // Distribution: 20% high, 50% medium, 30% low
    const priorityDistribution = [
        ...Array(Math.floor(size * 0.2)).fill('high'),
        ...Array(Math.floor(size * 0.5)).fill('medium'),
        ...Array(Math.floor(size * 0.3)).fill('low')
    ];

    for (let i = 0; i < size; i++) {
        const category = randomChoice(categories);
        const priority = priorityDistribution[i] || 'medium';
        complaints.push(generateComplaint(i + 1, category, priority));
    }

    return complaints;
}

// Generate dataset
console.log('Generating synthetic complaints dataset...');
const dataset = generateDataset(5000);

// Convert to CSV
const header = 'complaint_id,category,subcategory,title,description,location_address,ward_number,latitude,longitude,priority,status,created_date,resolved_date,resolution_time_hours\n';
const csvContent = header + dataset.map(c => 
    `${c.complaint_id},"${c.category}","${c.subcategory}","${c.title}","${c.description}","${c.location_address}",${c.ward_number},${c.latitude},${c.longitude},"${c.priority}","${c.status}",${c.created_date},${c.resolved_date},${c.resolution_time_hours}`
).join('\n');

// Write to file
const outputPath = path.join(__dirname, '../data/datasets/complaints_training.csv');
fs.writeFileSync(outputPath, csvContent);

console.log(`✓ Generated ${dataset.length} complaints`);
console.log(`✓ Saved to: ${outputPath}`);
console.log('\nDataset Statistics:');
console.log(`- High priority: ${dataset.filter(c => c.priority === 'high').length}`);
console.log(`- Medium priority: ${dataset.filter(c => c.priority === 'medium').length}`);
console.log(`- Low priority: ${dataset.filter(c => c.priority === 'low').length}`);
