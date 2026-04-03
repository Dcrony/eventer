import FollowButton from "./FollowButton";

export default function ProfileHeader({ user, isOwner }) {
  return (
    <div className="profile-header">
      <img src={user.avatar} alt="" />

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