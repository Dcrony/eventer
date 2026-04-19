import { Helmet } from "react-helmet-async";

const founder = {
  name: "Ibrahim Abdulmajeed",
  role: "Founder, TickiSpot",
  bio: "I build products at the intersection of events, community, and creator growth.",
  portfolio: "https://dcrony.vercel.app",
};

export default function FounderProfile() {
  return (
    <div className="dashboard-page">
      <Helmet>
        <title>{`${founder.name} - Founder of TickiSpot`}</title>
        <meta
          name="description"
          content="Public founder profile for Ibrahim Abdulmajeed, founder of TickiSpot."
        />
      </Helmet>
      <div className="dashboard-container">
        <div className="dash-card">
          <div className="dash-card-body">
            <h1>{founder.name}</h1>
            <p className="muted">{founder.role}</p>
            <p className="mt-3">{founder.bio}</p>
            <a href={founder.portfolio} target="_blank" rel="noreferrer" className="btn btn-primary mt-3">
              View portfolio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
