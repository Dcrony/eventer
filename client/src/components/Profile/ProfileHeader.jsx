import FollowButton from "./FollowButton";
import { UserAvatar } from "../ui/avatar";

export default function ProfileHeader({ user, isOwner }) {
  return (
    <div className="profile-header">
      <UserAvatar user={user} name={user?.name || user?.username} className="profile-header-avatar" />

      <h2>{user.name}</h2>
      <p>{user.bio}</p>

      {!isOwner && (
        <>
          <FollowButton userId={user._id} isFollowing={user.isFollowing} />
          <button>Message</button>
        </>
      )}

      {isOwner && <button>Edit Profile</button>}
    </div>
  );
}