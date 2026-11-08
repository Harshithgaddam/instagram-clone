import { useState } from "react";
import "./ProfileModal.css";

function ProfileModal({
  profile,
  loading,
  error,
  relationshipType,
  relationshipItems,
  relationshipLoading,
  relationshipError,
  onRelationshipClick,
  onBack,
  onUpdateProfile,
  profileIsOwn = false,
  canViewPrivateContent = true,
  posts = [],
  reposts = [],
  postsLoading = false,
  postsError = "",
  onPostClick,
  onClose,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [contentTab, setContentTab] = useState("posts");

  const startEditing = () => {
    setEditDisplayName(profile.displayName);
    setEditBio(profile.bio ?? "");
    setEditError("");
    setIsEditing(true);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setEditLoading(true);
    setEditError("");

    try {
      await onUpdateProfile({
        displayName: editDisplayName,
        bio: editBio,
        version: profile.version,
      });
      setIsEditing(false);
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Unable to update profile.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div
      className="profile-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="profile-modal-close"
          onClick={onClose}
          aria-label="Close profile"
        >
          x
        </button>

        {loading && <p>Loading profile...</p>}
        {error && <p className="profile-modal-error">{error}</p>}

        {relationshipType ? (
          <>
            <button type="button" className="profile-back" onClick={onBack}>
              Back to profile
            </button>
            <h2 className="relationship-title">
              {relationshipType === "followers"
                ? "Followers"
                : "Following"}
            </h2>
            {relationshipLoading && <p>Loading...</p>}
            {relationshipError && (
              <p className="profile-modal-error">{relationshipError}</p>
            )}
            {!relationshipLoading && !relationshipError && (
              <div className="relationship-list">
                {relationshipItems.length === 0 && <p>No users found.</p>}
                {relationshipItems.map((user) => (
                  <div className="relationship-item" key={user.id}>
                    <div className="relationship-avatar">
                      {(user.handle ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>@{user.handle}</strong>
                      <span>{user.displayName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : profile ? (
          <>
            {isEditing ? (
              <form className="profile-edit-form" onSubmit={saveProfile}>
                <h2>Edit profile</h2>
                <label>
                  Display name
                  <input
                    value={editDisplayName}
                    onChange={(event) =>
                      setEditDisplayName(event.target.value)
                    }
                    maxLength={50}
                    required
                  />
                </label>
                <label>
                  Bio
                  <textarea
                    value={editBio}
                    onChange={(event) => setEditBio(event.target.value)}
                    maxLength={160}
                    rows={4}
                  />
                </label>
                {editError && (
                  <p className="profile-modal-error">{editError}</p>
                )}
                <div className="profile-edit-actions">
                  <button type="submit" disabled={editLoading}>
                    {editLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
            <div className="profile-summary">
              <div className="profile-avatar" aria-hidden="true">
                {profile.handle.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 id="profile-modal-title">
                  @{profile.handle}
                </h2>
                <p>{profile.displayName}</p>
              </div>
            </div>

            <div className="profile-stats">
              <div>
                <strong>{profile.postCount}</strong>
                <span>Posts</span>
              </div>
              <button
                type="button"
                className="profile-stat"
                onClick={() => onRelationshipClick("followers")}
                disabled={!canViewPrivateContent}
              >
                <strong>{profile.followerCount}</strong>
                <span>Followers</span>
              </button>
              <button
                type="button"
                className="profile-stat"
                onClick={() => onRelationshipClick("following")}
                disabled={!canViewPrivateContent}
              >
                <strong>{profile.followingCount}</strong>
                <span>Following</span>
              </button>
            </div>

            {profile.bio && (
              <p className="profile-bio">{profile.bio}</p>
            )}
            {canViewPrivateContent && (
            <div className="profile-content-tabs">
              <button
                type="button"
                className={contentTab === "posts" ? "active" : ""}
                onClick={() => setContentTab("posts")}
              >
                Posts
              </button>
              <button
                type="button"
                className={contentTab === "reposts" ? "active" : ""}
                onClick={() => setContentTab("reposts")}
              >
                Reposts
              </button>
            </div>
            )}
            {canViewPrivateContent && postsLoading && <p>Loading posts...</p>}
            {canViewPrivateContent && postsError && (
              <p className="profile-modal-error">{postsError}</p>
            )}
            {canViewPrivateContent && !postsLoading && !postsError && (
              <div className="profile-post-grid">
                {(contentTab === "posts" ? posts : reposts).map((post) => (
                  <button
                    type="button"
                    className="profile-post-item"
                    key={post.id}
                    onClick={() => onPostClick(post)}
                  >
                    {post.src ? (
                      <img src={post.src} alt={post.alt} />
                    ) : (
                      <span>{post.description || "Repost"}</span>
                    )}
                  </button>
                ))}
                {(contentTab === "posts" ? posts : reposts).length === 0 && (
                  <p>No {contentTab} yet.</p>
                )}
              </div>
            )}
            {profileIsOwn && <button
              type="button"
              className="profile-edit-button"
              onClick={startEditing}
            >
              Edit profile
            </button>}
              </>
            )}
          </>
        ) : null}
      </section>
    </div>
  );
}

export default ProfileModal;
