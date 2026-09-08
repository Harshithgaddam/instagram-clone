import "./ProfileGrid.css";

function ProfileGrid({ posts, onPostClick }) {
  return (
    <div className="profile-grid">
      {posts.map((post) => (
        <article
          className="profile-grid-item"
          key={post.id}
        >
          <img
            src={post.src}
            alt={post.alt}
            loading="lazy"
            decoding="async"
            onClick={() => onPostClick(post)}
          />
        </article>
      ))}
    </div>
  );
}

export default ProfileGrid;