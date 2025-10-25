export const classifyComplaint = (text) => {
  if (!text) return { category: "General", priority: "Normal" };
  const t = text.toLowerCase();

  if (t.match(/\b(pothole|road|asphalt|pavement|crack|traffic)\b/)) return { category: "Roads", priority: "High" };
  if (t.match(/\b(water|pipe|leak|sewage|tap|drain)\b/)) return { category: "Water Supply", priority: "Medium" };
  if (t.match(/\b(power|electric|meter|outage|loadshedding|transformer)\b/)) return { category: "Electricity", priority: "High" };
  if (t.match(/\b(garbage|trash|waste|clean|bin|sweep)\b/)) return { category: "Sanitation", priority: "Low" };
  if (t.match(/\b(health|hospital|clinic|ambulance)\b/)) return { category: "Health", priority: "High" };
  return { category: "General", priority: "Normal" };
};
