import Avatar from "./ui/avatar";
import Badge from "./ui/badge";
import Button from "./ui/button";

export default function CreatorCard({ creator }) {
  return (
    <article className="dash-card">
      <div className="dash-card-body">
        <div className="flex items-center gap-3">
          <Avatar src={creator.profilePic} name={creator.name || creator.username} className="h-12 w-12" />
          <div>
            <h3>{creator.name || creator.username}</h3>
            <p className="muted">@{creator.username}</p>
          </div>
          {creator.followersCount > 50 ? <Badge className="ml-auto">Featured</Badge> : null}
        </div>
        <div className="mt-3 flex gap-4 text-sm">
          <span>{creator.eventsCount || 0} events</span>
          <span>{creator.followersCount || 0} followers</span>
        </div>
        <Button className="mt-4 w-full" size="sm">Follow</Button>
      </div>
    </article>
  );
}
