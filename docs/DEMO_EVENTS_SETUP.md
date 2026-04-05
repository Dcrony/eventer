# Demo Events Setup Guide

## 📋 Overview
TickiSpot includes 15 realistic demo events across Nigerian cities to showcase the platform's capabilities.

---

## 🎯 Quick Start Options

### Option A: Database Seeding (Recommended)
Permanently seed the database with demo events.

**Steps:**
```bash
cd server
node seed-events.js
```

**What it does:**
- Connects to MongoDB
- Creates a demo admin user (`tickispot_admin`)
- Adds 15 pre-configured events
- Events persist in database

**Events Created:**
- 🎵 Music: 3 events (Afrobeats, Jazz, Reggae)
- 💻 Tech: 3 events (Summit, Web3, AI/ML)
- 🍽️ Food: 3 events (Festival, Wine Tasting, Jollof Cook-Off)
- 🌙 Nightlife: 3 events (Party, Paint & Sip, Karaoke)
- ⚽ Sports: 3 events (Marathon, Basketball, Yoga)

### Option B: Fallback Demo Data (Automatic)
Demo events display automatically if API returns no events.

**How it works:**
- If API call fails or returns empty array, Home page shows demo events
- Shows message: "Showing demo events instead"
- No database seeding required
- Useful for development/testing

---

## 🔄 How Demo Events Are Integrated

### Client-Side Hook
**File:** `src/hooks/useDemoEvents.js`

```javascript
import useDemoEvents from "../hooks/useDemoEvents";

// In component
const demoEvents = useDemoEvents(events, hasError);
```

### Home Page Integration
**File:** `src/pages/Home.jsx`

```javascript
// Automatically uses demo events as fallback
useEffect(() => {
  try {
    // Fetch from API
    setEvents(data);
  } catch (err) {
    // If error, use demo events
    setFilteredEvents(demoEvents);
  }
}, []);
```

---

## 📊 Demo Events Data

### Structure
Each event includes:
```javascript
{
  title: string,
  description: string,
  category: "Music" | "Tech" | "Food" | "Nightlife" | "Sports",
  startDate: "YYYY-MM-DD",
  startTime: "HH:MM",
  location: "City, State",
  eventType: "In-person" | "Virtual" | "Hybrid",
  pricing: [
    { type: "Ticket Type", price: number },
    ...
  ],
  totalTickets: number,
  ticketsSold: number,
  banner: "https://unsplash.com/...",  // High-quality images
  isLive: boolean,
}
```

### Sample Locations
- **Lagos:** Eko Convention Centre, The Pavilion Lekki, Victoria Island
- **Abuja:** Jabi Lake, Hilton Abuja, Abuja National Stadium
- **Ibadan:** Ibadan Racecourse, The Stadium Bar, Ibadan Wellness Centre

### Sample Categories & Pricing
- **Music Events:** ₦8,000 - ₦50,000
- **Tech Events:** ₦20,000 - ₦150,000
- **Food Events:** ₦2,000 - ₦20,000
- **Nightlife Events:** ₦3,000 - ₦100,000
- **Sports Events:** ₦3,000 - ₦15,000

---

## 🛠️ Customization

### Add More Demo Events
**File:** `src/utils/demoEvents.js` or `server/seed-events.js`

Add a new event object to the array:
```javascript
{
  title: "Your Event Title",
  description: "Event description...",
  category: "Music",
  startDate: "2024-07-20",
  startTime: "19:00",
  endDate: "2024-07-20",
  endTime: "23:00",
  location: "Lagos, Nigeria",
  eventType: "In-person",
  pricing: [
    { type: "Regular", price: 10000 },
    { type: "VIP", price: 25000 },
  ],
  totalTickets: 1000,
  ticketsSold: 500,
  banner: "https://images.unsplash.com/...",
  isLive: false,
}
```

### Change Demo Data
If using database seeding:
1. Edit `server/seed-events.js`
2. Run `node seed-events.js` again

If using fallback:
1. Edit `src/utils/demoEvents.js`
2. Component automatically updates

---

## 🎨 Using Real Images

All demo events use **Unsplash URLs** for high-quality images. No image storage needed.

**To use your own images:**
1. Upload to Unsplash or another CDN
2. Update the `banner` URL in demo events
3. Images auto-responsive with proper aspect ratio

---

## ⚠️ Important Notes

### Production Deployment
- Demo events are for **development/testing only**
- Remove or comment out fallback in production
- Use real database events instead
- Remove test data before going live

### Database vs Fallback
| Feature | Database | Fallback |
|---------|----------|----------|
| Persistence | ✅ Yes | ❌ No |
| Admin Link | ✅ Yes | ❌ No |
| Editing | ✅ Yes | ❌ No |
| Live Updates | ✅ Yes | ❌ No |
| Performance | ⚡ Good | ⚡ Excellent |
| Setup | 🔧 Manual | ✅ Automatic |

### Test Events Labels
Consider marking demo events with a label:
- Badge: "Demo Event"
- Footer note: "This is a sample event"
- Subtitle: "Part of demo data"

---

## 🐛 Troubleshooting

**Q: Demo events not showing?**
- A: Check if API is returning data. If yes, fallback won't activate
- Try clearing browser cache
- Check browser console for errors

**Q: Database seeding failed?**
- A: Ensure MongoDB is running
- Check `.env` has valid `MONGODB_URI`
- Try: `mongod` in terminal

**Q: Events have placeholder images?**
- A: Banner URLs may be invalid. Update with valid Unsplash links

**Q: Want to remove demo events?**
- A: Delete `src/utils/demoEvents.js` and remove `useDemoEvents` import

---

## 📚 Related Files

- Client Demo Data: `src/utils/demoEvents.js`
- Client Hook: `src/hooks/useDemoEvents.js`
- Server Seeds: `server/seed-events.js`
- Home Page: `src/pages/Home.jsx`
- Event Controller: `server/controllers/eventController.js`

---

## 🚀 Next Steps

1. Run `node server/seed-events.js` to populate database (optional)
2. Start client and server
3. Visit Home page to see demo events
4. Test empty state by clearing events
5. Test search filtering
6. Verify dark mode displays events correctly

---

## 📞 Questions?

Refer to the CSS_ARCHITECTURE.md for styling guidance or implementation details found in the component files.
