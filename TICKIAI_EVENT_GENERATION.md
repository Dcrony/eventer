# TickiAI Event Generation System

## 🎯 Overview

TickiAI Event Generator converts plain-text event descriptions into structured event objects and auto-fills event creation forms. Powered by OpenAI, it intelligently infers missing fields and generates engaging content.

---

## 📋 Backend Implementation

### New Route: `POST /api/ai/generate-event`

**Endpoint:** `/api/ai/generate-event`  
**Rate Limit:** 10 requests per 60 seconds per user  
**Auth:** Optional (works with or without auth)

### Request Body

```json
{
  "prompt": "Tech meetup in Lagos for 200 people, ₦3000 ticket"
}
```

### Response (Success)

```json
{
  "success": true,
  "event": {
    "title": "Tech Meetup Lagos",
    "description": "Join us for an exclusive tech meetup in Lagos! Connect with over 200 tech enthusiasts, innovators, and industry professionals. Share insights, network, and explore the latest trends in technology.",
    "category": "Tech",
    "location": "Lagos",
    "capacity": 200,
    "ticketPrice": 3000,
    "tags": ["tech", "networking", "lagos", "meetup", "innovation"],
    "date": "2026-05-15",
    "time": "14:00"
  }
}
```

### Response (Error)

```json
{
  "message": "Event generation error: Invalid prompt"
}
```

### Key Features

- **Smart Inference:** Infers missing fields (date defaults to 5 days out, time to 2 PM, capacity to 100)
- **Context-Aware:** Generates appropriate descriptions based on event type and category
- **Nigerian Focus:** Uses ₦ (Naira) as default currency
- **Validation:** Sanitizes all text inputs, validates numbers, and ensures proper JSON structure
- **Error Handling:** Gracefully handles OpenAI API failures and malformed responses

---

## 🎨 Frontend Component

### Component: `TickiAIGenerator`

**Location:** `client/src/components/TickiAIGenerator.jsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onGenerate` | `function` | `null` | Callback fired with generated event data |

#### Usage

```jsx
import TickiAIGenerator from "../components/TickiAIGenerator";

export default function CreateEventPage() {
  const handleEventGenerated = (eventData) => {
    console.log("Generated event:", eventData);
    // Update your form with eventData
    setFormData(eventData);
  };

  return (
    <div>
      <TickiAIGenerator onGenerate={handleEventGenerated} />
    </div>
  );
}
```

#### Features

✅ **Textarea Input:** Prompt field with placeholder guidance  
✅ **Example Prompts:** 5 curated examples users can click to auto-fill  
✅ **Real-time Validation:** Error display below textarea  
✅ **Loading State:** Disabled button + "Generating..." label during API call  
✅ **Result Preview:** Editable grid of generated fields  
✅ **Inline Editing:** Click any field to edit before applying  
✅ **Tag Display:** Shows generated tags as pills  
✅ **Apply/Back:** Users can accept or discard generated data  

---

## 🔌 API Integration Example

### Using Axios (Already configured in your app)

```javascript
import API from "../api/axios";

const generateEvent = async (prompt) => {
  try {
    const response = await API.post("/ai/generate-event", {
      prompt: prompt,
    });
    
    return response.data.event; // Returns structured event object
  } catch (error) {
    console.error("Generation failed:", error.response?.data?.message);
    throw error;
  }
};

// Usage
const eventData = await generateEvent(
  "Summer festival in Abuja, free entry, 1000 people"
);
```

### Using cURL

```bash
curl -X POST http://localhost:8080/api/ai/generate-event \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Tech meetup in Lagos for 200 people, ₦3000 ticket"}'
```

---

## 📦 Generated Event Object Structure

```javascript
{
  // Required fields
  title: string,           // Event name (max 100 chars)
  category: string,        // Tech, Music, Sports, Business, etc.
  location: string,        // Physical location or "Virtual"
  
  // Optional but populated
  description: string,     // Engaging sales copy
  date: string,           // YYYY-MM-DD format
  time: string,           // HH:MM (24-hour format)
  
  // Capacity & Pricing
  capacity: number,       // Expected attendees
  ticketPrice: number,    // Price in Nigerian Naira (₦)
  
  // Metadata
  tags: string[],         // 3-5 lowercase, hyphenated tags
}
```

---

## ⚙️ Environment Setup

### Backend (.env)

```env
# Required
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo-16k  # Optional, defaults to this

# Existing configs
MONGO_URI=mongodb+srv://...
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8080/api  # Or your production API URL
```

---

## 🚀 Integration Examples

### Example 1: Embed in Event Creation Form

```jsx
import { useState } from "react";
import TickiAIGenerator from "../components/TickiAIGenerator";

export default function CreateEventPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    capacity: 100,
    ticketPrice: 0,
    tags: [],
    date: "",
    time: "",
  });

  const handleAIGenerate = (generatedEvent) => {
    // Merge AI-generated data with form, preserving user edits
    setFormData((prev) => ({
      ...prev,
      ...generatedEvent,
      // Preserve any manually edited fields here if needed
    }));
  };

  return (
    <div className="create-event-page">
      <div className="ai-section">
        <h2>Quick Create with TickiAI</h2>
        <TickiAIGenerator onGenerate={handleAIGenerate} />
      </div>

      <div className="form-section">
        <h2>Review & Edit Details</h2>
        {/* Your existing form fields here */}
        <input
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="Event title"
        />
        {/* ... more fields */}
      </div>
    </div>
  );
}
```

### Example 2: Modal Workflow

```jsx
import { useState } from "react";
import TickiAIGenerator from "../components/TickiAIGenerator";

export default function EventModal() {
  const [step, setStep] = useState("input"); // "input", "preview", "editing"
  const [eventData, setEventData] = useState(null);

  const handleGenerate = (data) => {
    setEventData(data);
    setStep("preview");
  };

  return (
    <div className="modal">
      {step === "input" && (
        <TickiAIGenerator onGenerate={handleGenerate} />
      )}

      {step === "preview" && (
        <div>
          <h3>{eventData.title}</h3>
          <p>{eventData.description}</p>
          <button onClick={() => setStep("editing")}>Edit</button>
          <button onClick={() => submitEvent(eventData)}>Create</button>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Standalone Landing Page

```jsx
import TickiAIGenerator from "../components/TickiAIGenerator";
import { useNavigate } from "react-router-dom";

export default function AIEventCreatorPage() {
  const navigate = useNavigate();

  const handleGenerate = (eventData) => {
    // Pass data to creation form via URL state
    navigate("/create-event", { state: { aiGenerated: eventData } });
  };

  return (
    <div className="ai-creator-page">
      <header>
        <h1>Create an Event in Seconds</h1>
        <p>Powered by TickiAI, your intelligent event assistant</p>
      </header>
      <TickiAIGenerator onGenerate={handleGenerate} />
    </div>
  );
}
```

---

## 💡 Usage Tips & Best Practices

### ✅ Good Prompts

- ✓ "Tech summit in Abuja, ₦5000, 500 attendees, March 15"
- ✓ "Free yoga class in Lekki, Sundays 6am, 30 people max"
- ✓ "Wedding reception afterparty, ₦10000 per person, 100 guests"

### ❌ Vague Prompts

- ✗ "Event" (Too vague, will generate generic result)
- ✗ "Something fun" (Lacks specifics)
- ✗ "My party" (No category/location hints)

### 📝 Prompt Structure

Best results when including:
1. **What:** Event type/category
2. **Where:** Location or "Virtual"
3. **When:** Date or time hint (optional, AI infers if missing)
4. **Who:** Expected attendee count
5. **Cost:** Price or "free"

Example: **"[What] [Where] for [Who], [Cost]"**

---

## 🧪 Testing

### Test with cURL

```bash
# Test basic generation
curl -X POST http://localhost:8080/api/ai/generate-event \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Comedy night in Lagos, ₦2000, 100 people"}' \
  | jq '.event'

# Test with minimal info
curl -X POST http://localhost:8080/api/ai/generate-event \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Virtual webinar"}' \
  | jq '.event'

# Test error handling
curl -X POST http://localhost:8080/api/ai/generate-event \
  -H "Content-Type: application/json" \
  -d '{"prompt": ""}' \
  | jq '.message'
```

### Test in React DevTools

```javascript
// Open browser console and run:
const testPrompt = "Music festival in Ibadan, free entry, 500 capacity";
fetch("http://localhost:8080/api/ai/generate-event", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: testPrompt }),
})
  .then((r) => r.json())
  .then((data) => console.log(data.event))
  .catch((e) => console.error(e));
```

---

## 🔒 Security & Rate Limiting

| Endpoint | Rate Limit | Notes |
|----------|------------|-------|
| `/ai/chat` | 8 req/30s | For interactive chat |
| `/ai/generate-event` | 10 req/60s | For form generation |

Rate limits are per user/IP and reset automatically.

---

## 📊 Monitoring & Debugging

### View API Logs

```bash
# Backend console shows AI requests:
# [TickiAI] Event generation: "Tech meetup..." → Generated title: "Tech Meetup Lagos"
# [TickiAI] AI response: 2.3s latency
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Missing OPENAI_API_KEY" | Add `OPENAI_API_KEY` to `.env` |
| "AI service unavailable" | Check OpenAI API status & key validity |
| "Too many requests" | Wait 60s, then retry |
| Malformed JSON response | AI may need retry; check OpenAI quota |

---

## 📝 File Manifest

```
server/
  routes/aiRoutes.js              [UPDATED] Added /generate-event endpoint
  controllers/aiController.js     [UPDATED] Added generateEvent handler
  services/aiService.js           [UPDATED] Added generateEventFromPrompt logic

client/src/components/
  TickiAIGenerator.jsx            [NEW] Event generation React component
  TickiAIChat.jsx                 [EXISTING] Chat interface component
```

---

## 🎯 Next Steps

1. **Set OpenAI API Key:** Add `OPENAI_API_KEY` to your `.env`
2. **Test the endpoint:** Use the cURL examples above
3. **Integrate component:** Import `TickiAIGenerator` into your event creation page
4. **Customize styling:** Adjust colors/spacing to match your design system
5. **Monitor usage:** Track API calls and AI latency in production

---

## 📚 Related Documentation

- [TickiAI Chat Component](./TICKIAI_CHAT.md) – Conversation interface
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Event Model Schema](../server/models/Event.js)
