import { useEffect, useState } from "react";
import CreatorCard from "../components/CreatorCard";
import { getCreators } from "../services/api/creators";
import { Tabs, TabButton } from "../components/ui/tabs";

export default function DiscoverCreators() {
  const [creators, setCreators] = useState([]);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("trending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        const { data } = await getCreators({ category, sort });
        setCreators(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };
    fetchCreators();
  }, [category, sort]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dash-card">
          <div className="dash-card-body">
            <h2>Discover Creators</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr]">
              <aside className="dash-card">
                <div className="dash-card-body">
                  <p className="text-sm muted mb-2">Categories</p>
                  {["all", "developer", "designer", "music", "tech", "business"].map((item) => (
                    <button
                      key={item}
                      className={`block w-full text-left rounded-xl px-3 py-2 mb-1 transition-all duration-200 ${category === item ? "bg-pink-500/20 text-pink-300" : "hover:bg-slate-800"}`}
                      onClick={() => setCategory(item)}
                    >
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </button>
                  ))}
                </div>
              </aside>
              <div>
                <Tabs>
                  <TabButton active={sort === "trending"} onClick={() => setSort("trending")}>Trending</TabButton>
                  <TabButton active={sort === "events"} onClick={() => setSort("events")}>Most events</TabButton>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? <p>Loading creators...</p> : creators.map((creator) => <CreatorCard key={creator._id} creator={creator} />)}
        </div>
      </div>
    </div>
  );
}
