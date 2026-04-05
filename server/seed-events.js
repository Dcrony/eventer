/**
 * Database Seeding Script for Demo Events
 * Run: node seed-events.js
 * Make sure .env is configured with MONGO_URI
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Event = require("./models/Event");
const User = require("./models/User");

const DEMO_EVENTS_DATA = [
  {
    title: "Afrobeats Fest 2024",
    description: "Biggest celebration of Afrobeats music. Experience live performances from top Nigerian and international artists. Two days of pure music magic!",
    category: "Music",
    startDate: "2024-06-15",
    startTime: "18:00",
    endDate: "2024-06-16",
    endTime: "23:59",
    location: "Eko Convention Centre, Lagos",
    eventType: "In-person",
    pricing: [
      { type: "Early Bird", price: 15000 },
      { type: "General", price: 25000 },
      { type: "VIP", price: 50000 },
    ],
    totalTickets: 5000,
    ticketsSold: 1200,
    image: null,
  },
  {
    title: "Jazz Nights at Lekki",
    description: "An intimate jazz experience with world-class musicians. Enjoy smooth melodies and great vibes while networking with music enthusiasts.",
    category: "Music",
    startDate: "2024-06-22",
    startTime: "20:00",
    endDate: "2024-06-22",
    endTime: "23:00",
    location: "The Pavilion, Lekki, Lagos",
    eventType: "In-person",
    pricing: [
      { type: "General", price: 8000 },
      { type: "Premium", price: 15000 },
    ],
    totalTickets: 500,
    ticketsSold: 320,
    image: null,
  },
  {
    title: "Live Reggae Concert - Abuja Edition",
    description: "Feel the rhythm and energy of live reggae music. A celebration of positive vibes and great performances.",
    category: "Music",
    startDate: "2024-07-01",
    startTime: "17:00",
    endDate: "2024-07-01",
    endTime: "22:00",
    location: "Jabi Lake, Abuja",
    eventType: "In-person",
    pricing: [
      { type: "Standard", price: 10000 },
      { type: "VIP", price: 25000 },
    ],
    totalTickets: 3000,
    ticketsSold: 850,
    image: null,
  },
  {
    title: "Tech Summit Nigeria 2024",
    description: "The largest tech conference in West Africa. Network with founders, investors, and tech leaders. Workshops, keynotes, and venture pitches.",
    category: "Tech",
    startDate: "2024-05-20",
    startTime: "08:00",
    endDate: "2024-05-22",
    endTime: "18:00",
    location: "Landmark Centre, Lagos",
    eventType: "Hybrid",
    pricing: [
      { type: "Early Bird", price: 50000 },
      { type: "Regular", price: 75000 },
      { type: "Premium", price: 150000 },
    ],
    totalTickets: 2000,
    ticketsSold: 1650,
    image: null,
  },
  {
    title: "Web3 & Blockchain Bootcamp",
    description: "Learn blockchain development from industry experts. Hands-on sessions, real projects, and connections with crypto founders.",
    category: "Tech",
    startDate: "2024-06-10",
    startTime: "09:00",
    endDate: "2024-06-12",
    endTime: "17:00",
    location: "Co-creation Hub, Yaba, Lagos",
    eventType: "In-person",
    pricing: [
      { type: "Student", price: 25000 },
      { type: "Professional", price: 45000 },
    ],
    totalTickets: 150,
    ticketsSold: 120,
    image: null,
  },
  {
    title: "AI & Machine Learning Workshop",
    description: "Discover the power of AI. Learn practical ML applications, deep learning, and how to build AI-powered products.",
    category: "Tech",
    startDate: "2024-07-15",
    startTime: "10:00",
    endDate: "2024-07-15",
    endTime: "16:00",
    location: "Abuja Innovation Hub, Abuja",
    eventType: "In-person",
    pricing: [
      { type: "Basic", price: 20000 },
      { type: "Advanced", price: 35000 },
    ],
    totalTickets: 100,
    ticketsSold: 75,
    image: null,
  },
  {
    title: "Lagos Food Festival 2024",
    description: "Celebrate Nigerian cuisine! Taste authentic dishes, meet celebrity chefs, attend cooking workshops, and enjoy street food.",
    category: "Food",
    startDate: "2024-06-08",
    startTime: "11:00",
    endDate: "2024-06-09",
    endTime: "22:00",
    location: "Victoria Island, Lagos",
    eventType: "In-person",
    pricing: [
      { type: "Day Pass", price: 5000 },
      { type: "2-Day Pass", price: 8000 },
      { type: "VIP", price: 20000 },
    ],
    totalTickets: 8000,
    ticketsSold: 4200,
    image: null,
  },
  {
    title: "Wine Tasting Night - Abuja",
    description: "Experience premium wines from around the world. Expert sommeliers guide you through tastings and food pairings.",
    category: "Food",
    startDate: "2024-06-28",
    startTime: "19:00",
    endDate: "2024-06-28",
    endTime: "23:00",
    location: "Hilton Abuja, Abuja",
    eventType: "In-person",
    pricing: [
      { type: "General", price: 12000 },
      { type: "Premium", price: 20000 },
    ],
    totalTickets: 200,
    ticketsSold: 165,
    image: null,
  },
  {
    title: "Jollof Cook-Off Championship",
    description: "Cook your best jollof and compete for ultimate bragging rights! Watch professional chefs battle it out.",
    category: "Food",
    startDate: "2024-07-05",
    startTime: "12:00",
    endDate: "2024-07-05",
    endTime: "19:00",
    location: "Ibadan Racecourse, Ibadan",
    eventType: "In-person",
    pricing: [
      { type: "Spectator", price: 2000 },
      { type: "Competitor", price: 15000 },
    ],
    totalTickets: 1000,
    ticketsSold: 450,
    image: null,
  },
  {
    title: "Summer Vibes Party - Lekki",
    description: "The hottest party of the season! Top DJs, dancing, VIP lounges, and unforgettable memories.",
    category: "Nightlife",
    startDate: "2024-06-17",
    startTime: "22:00",
    endDate: "2024-06-18",
    endTime: "06:00",
    location: "Cubana Nightclub, Lekki, Lagos",
    eventType: "In-person",
    pricing: [
      { type: "Regular Entry", price: 10000 },
      { type: "Skip Queue", price: 15000 },
      { type: "VIP Table", price: 100000 },
    ],
    totalTickets: 2000,
    ticketsSold: 1500,
    image: null,
  },
  {
    title: "Paint & Sip Event",
    description: "Create art while sipping wine! No experience needed. Fun, creative, and socially vibrant.",
    category: "Nightlife",
    startDate: "2024-06-21",
    startTime: "18:00",
    endDate: "2024-06-21",
    endTime: "21:00",
    location: "Coliseum Art Space, VI, Lagos",
    eventType: "In-person",
    pricing: [
      { type: "Entry", price: 8000 },
    ],
    totalTickets: 150,
    ticketsSold: 120,
    image: null,
  },
  {
    title: "Karaoke Night Extravaganza",
    description: "Sing your heart out! Join us for an unforgettable karaoke night with great music and company.",
    category: "Nightlife",
    startDate: "2024-07-06",
    startTime: "20:00",
    endDate: "2024-07-06",
    endTime: "23:00",
    location: "The Stadium Bar, Ibadan",
    eventType: "In-person",
    pricing: [
      { type: "Entry", price: 3000 },
    ],
    totalTickets: 300,
    ticketsSold: 200,
    image: null,
  },
  {
    title: "Lagos Marathon 2024",
    description: "Run for fitness and charity! 5K, 10K, and 21K options. Join thousands of runners across Lagos.",
    category: "Sports",
    startDate: "2024-05-25",
    startTime: "06:00",
    endDate: "2024-05-25",
    endTime: "12:00",
    location: "Lekki Conservation Centre, Lagos",
    eventType: "In-person",
    pricing: [
      { type: "5K", price: 3000 },
      { type: "10K", price: 5000 },
      { type: "21K", price: 8000 },
    ],
    totalTickets: 5000,
    ticketsSold: 3800,
    image: null,
  },
  {
    title: "Basketball Tournament - Abuja",
    description: "High-energy basketball tournament with semi-professional teams. Watch intense matches and root for your favorite team.",
    category: "Sports",
    startDate: "2024-06-24",
    startTime: "14:00",
    endDate: "2024-06-26",
    endTime: "20:00",
    location: "Abuja National Stadium, Abuja",
    eventType: "In-person",
    pricing: [
      { type: "Day Pass", price: 5000 },
      { type: "VIP Seat", price: 15000 },
    ],
    totalTickets: 3000,
    ticketsSold: 2100,
    image: null,
  },
  {
    title: "Yoga & Wellness Retreat",
    description: "Find inner peace! Full-day yoga sessions, meditation, healthy meals, and wellness workshops.",
    category: "Sports",
    startDate: "2024-07-13",
    startTime: "06:00",
    endDate: "2024-07-13",
    endTime: "18:00",
    location: "Ibadan Wellness Centre, Ibadan",
    eventType: "In-person",
    pricing: [
      { type: "Entry", price: 10000 },
    ],
    totalTickets: 200,
    ticketsSold: 135,
    image: null,
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB Atlas using MONGO_URI from .env
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tickispotDB";
    
    await mongoose.connect(mongoUri);

    console.log("✅ Connected to MongoDB");

    // Find or create a demo admin user if needed
    let adminUser = await User.findOne({ username: "tickispot_admin" });
    
    if (!adminUser) {
      adminUser = new User({
        name: "TickiSpot Admin",
        username: "tickispot_admin",
        email: "admin@tickispot.com",
        password: "demo-password-123", // In real app, hash this
        profilePic: null,
        role: "admin",
      });
      await adminUser.save();
      console.log("✅ Created admin user");
    }

    // Clear existing events (optional - comment out if you want to keep them)
    // await Event.deleteMany({});
    // console.log("🗑️  Cleared existing events");

    // Seed events
    const eventsWithCreator = DEMO_EVENTS_DATA.map((event) => ({
      ...event,
      createdBy: adminUser._id,
    }));

    const createdEvents = await Event.insertMany(eventsWithCreator);
    console.log(`✅ Created ${createdEvents.length} demo events`);

    console.log("\n📊 Event Summary:");
    console.log(`   - Music: 3 events`);
    console.log(`   - Tech: 3 events`);
    console.log(`   - Food: 3 events`);
    console.log(`   - Nightlife: 3 events`);
    console.log(`   - Sports: 3 events`);
    console.log(`   - Total: 15 events`);

    console.log("\n✅ Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
