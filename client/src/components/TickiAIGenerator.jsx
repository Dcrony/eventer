import { useEffect, useState } from "react";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import API from "../api/axios";

const EXAMPLE_PROMPTS = [
    "Tech meetup in Lagos for 200 people, ₦3000 ticket",
    "Summer concert featuring live bands, free entry, 500 capacity",
    "Business networking breakfast in Abuja, ₦5000 per person",
    "Fitness bootcamp every weekend, ₦1500, 50 participants max",
    "Comedy show at the waterfront, ₦8000, intimate 100-person venue",
];

const TickiAIGenerator = ({ onGenerate = null }) => {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generated, setGenerated] = useState(null);
    const [editMode, setEditMode] = useState({});

    const handleGenerateEvent = async (event) => {
        event.preventDefault();
        setError(null);

        const trimmed = prompt.trim();
        if (!trimmed) {
            setError("Please describe your event");
            return;
        }

        setLoading(true);

        try {
            const response = await API.post("/ai/generate-event", { prompt: trimmed });
            setGenerated(response.data.event);

            if (onGenerate) {
                onGenerate(response.data.event);
            }

            setPrompt("");
        } catch (err) {
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Failed to generate event. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleUseExample = (example) => {
        setPrompt(example);
        setError(null);
    };

    const handleEditField = (field, value) => {
        setGenerated({ ...generated, [field]: value });
        setEditMode({ ...editMode, [field]: false });
    };

    const handleApply = () => {
        if (onGenerate) {
            onGenerate(generated);
        }
    };

    return (
        <section className="ticki-ai-generator">
  <div className="ticki-ai-card">

    {/* HEADER */}
    <div className="ticki-ai-gen-header">
      <div className="ticki-ai-gen-title">
        <Sparkles size={22} />
        <h2>AI Event Generator</h2>
      </div>
      <p>Describe your event and let TickiAI build it instantly.</p>
    </div>

    <div className="ticki-ai-gen-body">
      {!generated ? (
        <>
          {/* FORM */}
          <form onSubmit={handleGenerateEvent}>
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Tech meetup in Lagos, 200 people, ₦3000"
              disabled={loading}
            />

            {error && (
              <div className="ticki-ai-error-box">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="ticki-ai-btn-primary"
            >
              {loading ? "Generating..." : "Generate Event"}
            </button>
          </form>

          {/* EXAMPLES */}
          <div className="ticki-ai-examples">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                onClick={() => handleUseExample(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* SUCCESS */}
          <div className="ticki-ai-success">
            <CheckCircle2 size={18} />
            <span>Event generated. You can edit it below.</span>
          </div>

          {/* EDIT GRID */}
          <div className="ticki-ai-grid">
            {[
              { key: "title", label: "Title" },
              { key: "category", label: "Category" },
              { key: "location", label: "Location" },
              { key: "date", label: "Date" },
              { key: "time", label: "Time" },
              { key: "capacity", label: "Capacity" },
              { key: "ticketPrice", label: "Price" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label>{label}</label>

                {editMode[key] ? (
                  <input
                    value={generated[key]}
                    onChange={(e) =>
                      setGenerated({ ...generated, [key]: e.target.value })
                    }
                    onBlur={() =>
                      setEditMode({ ...editMode, [key]: false })
                    }
                    autoFocus
                  />
                ) : (
                  <div
                    className="ticki-ai-field"
                    onClick={() =>
                      setEditMode({ ...editMode, [key]: true })
                    }
                  >
                    {generated[key] || "—"}
                  </div>
                )}
              </div>
            ))}

            {/* DESCRIPTION */}
            <div className="full">
              <label>Description</label>
              <div
                className="ticki-ai-field big"
                onClick={() =>
                  setEditMode({ ...editMode, description: true })
                }
              >
                {generated.description}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="ticki-ai-actions">
            <button
              onClick={() => {
                setGenerated(null);
                setEditMode({});
              }}
              className="ticki-ai-btn-secondary"
            >
              Back
            </button>

            <button onClick={handleApply} className="ticki-ai-btn-primary">
              Use Event
            </button>
          </div>
        </>
      )}
    </div>
  </div>
</section>
    );
};

export default TickiAIGenerator;
