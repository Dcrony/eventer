# TickiAI Event Generation – Deployment Checklist

## ✅ Pre-Deployment (Must Complete)

- [ ] **Get OpenAI API Key**
  - Visit: https://platform.openai.com/account/api-keys
  - Create new secret key
  - Copy to clipboard

- [ ] **Add API Key to Environment**
  - Open `server/.env`
  - Add: `OPENAI_API_KEY=sk-proj-xxxxx`
  - Save file
  - Do NOT commit to git

- [ ] **Restart Backend Server**
  ```bash
  cd server
  npm start
  # or: node server.js
  ```
  - Wait for "Server is running..." message
  - Verify no errors about missing OPENAI_API_KEY

## 🧪 Testing (Validation Steps)

- [ ] **Test via cURL**
  ```bash
  curl -X POST http://localhost:8080/api/ai/generate-event \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Tech conference in Lagos, 500 people, ₦5000 ticket"}'
  ```
  - Expected: JSON response with `success: true`
  - Check: Event title, date, capacity populated

- [ ] **Test via Browser Network Tab**
  - Open frontend on http://localhost:5173
  - Open DevTools (F12) → Network tab
  - Trigger any request to `/ai/generate-event`
  - Verify: Status 200, response has event object

- [ ] **Test Component Rendering**
  - Import TickiAIGenerator into a test page
  - Verify component displays (header, textarea, examples)
  - Type prompt → Click "Generate Event"
  - Verify: Result preview appears

- [ ] **Test Inline Editing**
  - Click on any field (title, date, etc.)
  - Edit value
  - Click elsewhere (blur)
  - Verify: Value persists

- [ ] **Test Apply Button**
  - Generate event
  - Click "Apply Event"
  - Verify: onGenerate callback fires
  - Check console for event data

## 📦 Integration (Pick One Path)

### Path A: Auto-Fill Existing Form (Simplest)
- [ ] Locate your event creation form component
- [ ] Add import:
  ```jsx
  import TickiAIGenerator from "../components/TickiAIGenerator";
  ```
- [ ] Add component above form:
  ```jsx
  <TickiAIGenerator 
    onGenerate={(event) => setFormData(event)} 
  />
  ```
- [ ] Test: Generate event → Verify form populates

### Path B: Modal/Dialog Integration (Recommended)
- [ ] Add state for generated event:
  ```jsx
  const [aiGenerated, setAiGenerated] = useState(null);
  ```
- [ ] Conditionally render:
  ```jsx
  {aiGenerated && <ReviewDialog event={aiGenerated} />}
  <TickiAIGenerator onGenerate={setAiGenerated} />
  ```
- [ ] In dialog, add "Use This" button:
  ```jsx
  const handleUse = () => {
    setFormData(aiGenerated);
    setAiGenerated(null);
  };
  ```

### Path C: Standalone Page (Dedicated Flow)
- [ ] Create new page: `/events/ai-create`
- [ ] Render component:
  ```jsx
  import TickiAIGenerator from "../components/TickiAIGenerator";
  
  export default function AICreateEvent() {
    return (
      <div className="container">
        <h1>Create Event with AI</h1>
        <TickiAIGenerator onGenerate={(event) => {
          // redirect to form with pre-filled data
          navigate("/events/create", { state: event });
        }} />
      </div>
    );
  }
  ```

## 🎨 Customization (Optional)

- [ ] **Update Brand Colors**
  - Open `client/src/components/TickiAIGenerator.jsx`
  - Find: `#667eea` (purple)
  - Replace with your brand color

- [ ] **Add Custom Examples**
  - Find `EXAMPLE_PROMPTS` array
  - Replace with your industry examples

- [ ] **Adjust Typography**
  - Find `fontSize:` values
  - Adjust to match your design

## 📊 Monitoring (Post-Deployment)

- [ ] **Track API Usage**
  ```bash
  # In server logs, watch for:
  # "POST /api/ai/generate-event" requests
  # Check response times (should be ~2-3s)
  ```

- [ ] **Monitor Error Rate**
  - Set up alerts for 5xx responses
  - Check error logs regularly
  - Validate OpenAI quota hasn't exceeded

- [ ] **Collect User Feedback**
  - Track how often AI generation is used
  - Monitor completion rate (generate → apply)
  - Gather user satisfaction feedback

## 🔐 Security Checklist

- [ ] **Verify API Key NOT in Git**
  ```bash
  git log --all -p server/.env | grep OPENAI_API_KEY
  # Should return nothing
  ```

- [ ] **Verify .env in .gitignore**
  ```bash
  cat .gitignore | grep "\.env"
  # Should show: .env (or .env.local)
  ```

- [ ] **Rate Limit Validation**
  - Try 11 rapid requests
  - Verify error on 11th
  - Wait 60 seconds
  - Verify 12th succeeds

- [ ] **Input Sanitization Test**
  - Send prompt with `<script>alert('xss')</script>`
  - Verify no XSS errors in response

## 📈 Performance Checklist

- [ ] **Response Time Acceptable**
  - Typical: 2-3 seconds
  - Max acceptable: 5 seconds
  - If slower: Check OpenAI API status

- [ ] **Component Load Fast**
  - TickiAIGenerator should render instantly
  - Textarea should be interactive immediately
  - No janky animations

- [ ] **No Memory Leaks**
  - Generate 50+ events
  - Watch DevTools Memory tab
  - Should not grow indefinitely

## 🚨 Rollback Plan

If issues arise:

1. **API Errors?**
   - Check OPENAI_API_KEY in `.env`
   - Verify OpenAI quota available
   - Check API key hasn't been compromised

2. **Component Not Rendering?**
   - Check browser console for errors
   - Verify import path correct
   - Check dependencies installed

3. **Rate Limit Issues?**
   - Check `rateLimitByUser` middleware in server
   - Adjust limits in `server/routes/aiRoutes.js`

4. **Full Rollback?**
   ```bash
   # Remove component from pages
   # Keep backend routes (safe to keep)
   # Users won't be affected
   ```

## ✨ Success Indicators

- [ ] ✅ Component renders without errors
- [ ] ✅ Generate button works
- [ ] ✅ AI response received in 2-5 seconds
- [ ] ✅ Event preview displays with all fields
- [ ] ✅ Inline editing works
- [ ] ✅ Apply callback fires
- [ ] ✅ Form receives generated data
- [ ] ✅ No console errors
- [ ] ✅ Rate limiting enforced

## 📞 Support Resources

| Issue | Resource |
|-------|----------|
| OpenAI API errors | Check [platform.openai.com/status](https://platform.openai.com/status) |
| Component questions | See [TICKIAI_QUICKSTART.md](./TICKIAI_QUICKSTART.md) |
| API reference | See [TICKIAI_EVENT_GENERATION.md](./TICKIAI_EVENT_GENERATION.md) |
| Implementation details | See [TICKIAI_IMPLEMENTATION_SUMMARY.md](./TICKIAI_IMPLEMENTATION_SUMMARY.md) |

---

## 📋 Completion Timeline

| Step | Time | Status |
|------|------|--------|
| Setup OpenAI API key | 5 min | ___ |
| Add to .env | 1 min | ___ |
| Restart server | 2 min | ___ |
| Test with cURL | 3 min | ___ |
| Import component | 5 min | ___ |
| Integration testing | 10 min | ___ |
| **Total** | **26 min** | ___ |

---

**🚀 Ready to deploy? Start with the "Pre-Deployment" section above.**
