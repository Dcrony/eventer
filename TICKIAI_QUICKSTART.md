# TickiAI Event Generator – Quick Start

## 🚀 5-Minute Setup

### Step 1: Environment Variable
Add to your `server/.env`:
```
OPENAI_API_KEY=sk-proj-your-key-here
```

### Step 2: Import Component
```jsx
import TickiAIGenerator from "../components/TickiAIGenerator";
```

### Step 3: Add to Your Page
```jsx
<TickiAIGenerator onGenerate={(eventData) => {
  console.log("Generated:", eventData);
  // Update your form or state here
}} />
```

---

## 📤 Generated Event Object

```javascript
{
  title: "Tech Meetup Lagos",
  description: "Join us for an exclusive tech meetup...",
  category: "Tech",
  location: "Lagos",
  date: "2026-05-15",
  time: "14:00",
  capacity: 200,
  ticketPrice: 3000,
  tags: ["tech", "networking", "lagos", "meetup", "innovation"]
}
```

---

## 🎯 Common Integration Patterns

### Pattern 1: Auto-Fill Event Form
```jsx
const [formData, setFormData] = useState({
  title: "", category: "", location: "", ...
});

<TickiAIGenerator 
  onGenerate={(event) => setFormData(event)} 
/>
```

### Pattern 2: Preview Before Submit
```jsx
const [generatedEvent, setGeneratedEvent] = useState(null);

{generatedEvent && (
  <div>
    <h3>{generatedEvent.title}</h3>
    <button onClick={() => submitEvent(generatedEvent)}>
      Create Event
    </button>
  </div>
)}

<TickiAIGenerator onGenerate={setGeneratedEvent} />
```

### Pattern 3: Modal Workflow
```jsx
const [showGenerator, setShowGenerator] = useState(false);

{showGenerator && (
  <Modal onClose={() => setShowGenerator(false)}>
    <TickiAIGenerator 
      onGenerate={(event) => {
        handleSubmit(event);
        setShowGenerator(false);
      }} 
    />
  </Modal>
)}
```

---

## ✅ Testing

```bash
# Test backend endpoint
curl -X POST http://localhost:8080/api/ai/generate-event \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Tech meetup in Lagos for 200 people, ₦3000 ticket"}'
```

Expected response:
```json
{
  "success": true,
  "event": {
    "title": "Tech Meetup Lagos",
    "description": "...",
    ...
  }
}
```

---

## 🎨 Styling Customization

The component uses inline styles. To customize:

1. **Colors:** Change `#667eea` (purple) to your brand color
2. **Typography:** Adjust font sizes in style objects
3. **Spacing:** Modify `padding` and `gap` values
4. **Shadows:** Update `boxShadow` values

Example:
```jsx
// In TickiAIGenerator.jsx, change:
background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
// To your brand gradient
```

---

## 📝 Example Prompts Users Will See

- "Tech meetup in Lagos for 200 people, ₦3000 ticket"
- "Summer concert featuring live bands, free entry, 500 capacity"
- "Business networking breakfast in Abuja, ₦5000 per person"
- "Fitness bootcamp every weekend, ₦1500, 50 participants max"
- "Comedy show at the waterfront, ₦8000, intimate 100-person venue"

---

## 🔧 Troubleshooting

| Error | Fix |
|-------|-----|
| "Cannot find module TickiAIGenerator" | Check import path matches your file structure |
| "AI service unavailable" | Verify `OPENAI_API_KEY` in `.env` |
| "Too many requests" | Rate limit hit; wait 60 seconds |
| Component not rendering | Check browser console for React errors |

---

## 📖 For More Details
See [TICKIAI_EVENT_GENERATION.md](./TICKIAI_EVENT_GENERATION.md)
