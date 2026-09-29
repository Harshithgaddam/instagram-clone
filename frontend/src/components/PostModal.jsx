import { useEffect, useRef } from "react";
import { getResponsiveSrcSet } from "../utils/image";
import Comments from "./Comments";
import "./PostModal.css";

function PostModal({
  post,
  currentUser,
  currentImageIndex,
  setCurrentImageIndex,
  onClose,
  onNextImage,
  onPreviousImage,
  followingUsers,
  onToggleFollow,
  showComments,
  setShowComments,
  comments,
  commentText,
  setCommentText,
  onAddComment,
  isLiked,
  onToggleLike,
  isReposted,
  onRepost,
}) {
  const postImagesRef = useRef(null);

  // -----------------------------------------
  // Scroll carousel to current image
  // -----------------------------------------
  useEffect(() => {
    if (!postImagesRef.current) {
      return;
    }

    const container = postImagesRef.current;

    container.scrollTo({
      left: currentImageIndex * container.clientWidth,
      behavior: "smooth",
    });
  }, [currentImageIndex]);

  // -----------------------------------------
  // Escape key closes modal
  // -----------------------------------------
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // -----------------------------------------
  // No post selected
  // -----------------------------------------
  if (!post) {
    return null;
  }

  // -----------------------------------------
  // Safe values for normal/API posts
  // -----------------------------------------
  const images =
  Array.isArray(post.images)
    ? post.images
    : [];

const tags =
  Array.isArray(post.tags)
    ? post.tags
    : [];

const authorName =
  post.author ??
  post.authorDisplayName ??
  "";

const description =
  post.description ??
  post.text ??
  "";

const avatar =
  post.avatarLargeUrl ??
  post.avatarSmallUrl ??
  "";

const likeCount =
  post.likeCount ??
  post.likes ??
  0;

const replyCount =
  post.replyCount ??
  post.comments?.length ??
  0;

  const hasMultipleImages = images.length > 1;

  return (
    <div
      className="post-modal active"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      

      <div className="post-content">
        <div className="post-viewer">

          {hasMultipleImages && (
            <button
              className="carousel-button left-button"
              type="button"
              onClick={onPreviousImage}
              disabled={currentImageIndex === 0}
              aria-label="Previous image"
            >
              &#10094;
            </button>
          )}


          <div
            className="post-images"
            ref={postImagesRef}
          >
            {images.map((imageURL, index) => (
              <img
                key={`${post.id}-${index}`}
                src={imageURL}
                srcSet={getResponsiveSrcSet(imageURL)}
                sizes="(max-width: 600px) 90vw, 600px"
                width="600"
                height="600"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                alt={post.alt || post.title || "Post image"}
              />
            ))}
          </div>

          {hasMultipleImages && (
            <button
              className="carousel-button right-button"
              type="button"
              onClick={onNextImage}
              disabled={
                currentImageIndex === images.length - 1
              }
              aria-label="Next image"
            >
              &#10095;
            </button>
          )}

          {hasMultipleImages && (
            <div className="image-counter">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}

          {hasMultipleImages && (
            <div className="image-thumbnails">
              {images.map((imageURL, index) => (
                <button
                  key={`${post.id}-thumbnail-${index}`}
                  type="button"
                  className={
                    currentImageIndex === index
                      ? "thumbnail active-thumbnail"
                      : "thumbnail"
                  }
                  onClick={() => {
                    setCurrentImageIndex(index);
                  }}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={imageURL}
                    srcSet={getResponsiveSrcSet(imageURL)}
                    sizes="80px"
                    width="80"
                    height="80"
                    loading="lazy"
                    decoding="async"
                    alt={`Thumbnail ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="post-info">

  
          <button
            className="info-close-button"
            type="button"
            onClick={onClose}
            aria-label="Close post"
          >
            &times;
          </button>

          <div className="post-header">

            <img
              className="post-avatar"
              src={avatar}
              srcSet={getResponsiveSrcSet(post.src)}
              sizes="50px"
              width="50"
              height="50"
              loading="lazy"
              decoding="async"
              alt=""
            />

            <div>
              <h2>
  {post.authorDisplayName ||
    post.author ||
    ""}
</h2>

              <p>
                {post.title}
                &nbsp; • &nbsp;
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>

           
            {post.author !== currentUser && (
              <button
                type="button"
                className="follow-button"
                onClick={() => {
                  onToggleFollow(post.author);
                }}
              >
                {followingUsers.has(post.author)
                  ? "Following"
                  : "Follow"}
              </button>
            )}
          </div>

         
          <div className="post-description">
            <p>{description}</p>
          </div>

         
          {tags.length > 0 && (
            <div className="post-tags">
              {tags.map((tag) => (
                <span key={tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          
          {showComments && (
            <Comments
              comments={comments}
              commentText={commentText}
              setCommentText={setCommentText}
              onAddComment={onAddComment}
            />
          )}

          <div className="info-divider" />

          {/* =========================================
              ACTIONS
              ========================================= */}
          <div className="post-actions">

            {/* ---------------------------------------
                LIKE
                --------------------------------------- */}
            <button
              id="likeButton"
              type="button"
              aria-label={isLiked ? "Unlike" : "Like"}
              className={isLiked ? "liked" : ""}
              onClick={onToggleLike}
            >
              <svg viewBox="0 0 24 24">
                <path d="M20.8 8.6c0-2.4-1.9-4.3-4.3-4.3-1.4 0-2.7.7-3.5 1.8-.8-1.1-2.1-1.8-3.5-1.8C7.1 4.3 5.2 6.2 5.2 8.6c0 4.1 4.2 7.4 7.8 10.3 3.6-2.9 7.8-6.2 7.8-10.3z" />
              </svg>

              <span>
                {isLiked ? "Unlike" : "Like"}
              </span>

              <span className="post-action-count">
                {likeCount}
              </span>
            </button>

            {/* ---------------------------------------
                COMMENT
                --------------------------------------- */}
            <button
              type="button"
              aria-label="Comment"
              onClick={() => {
                setShowComments((previous) => !previous);
              }}
            >
              <svg viewBox="0 0 24 24">
                <path d="M20 11.5a8 8 0 0 1-8 8H7l-4 2 1.5-4A8 8 0 1 1 20 11.5z" />
              </svg>

              <span>
                {showComments ? "Hide Comments" : "Comment"}
              </span>

              <span className="post-action-count">
                {replyCount}
              </span>
            </button>

            {/* ---------------------------------------
                REPOST
                --------------------------------------- */}
            <button
              type="button"
              aria-label={isReposted ? "Undo repost" : "Repost"}
              className={isReposted ? "reposted" : ""}
              onClick={onRepost}
            >
              <svg viewBox="0 0 24 24">
                <path d="M7 7h10l-2-2 1.5-1.5L21 8l-4.5 4.5L15 11l2-2H7v4H5V7z" />

                <path d="M17 17H7l2 2-1.5 1.5L3 16l4.5-4.5L9 13l-2 2h10v-4h2v6z" />
              </svg>

              <span>
                {isReposted ? "Reposted" : "Repost"}
              </span>
            </button>

          </div>

          {/* -----------------------------------------
              Post time
              ----------------------------------------- */}
          <p className="post-time">
            {new Date(post.createdAt).toLocaleString()}
          </p>

        </div>
      </div>
    </div>
  );
}

export default PostModal;