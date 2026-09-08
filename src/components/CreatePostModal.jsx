import "./CreatePostModal.css";
function CreatePostModal({
  show,
  onClose,
  image,
  title,
  alt,
  text,
  tags,
  setTitle,
  setAlt,
  setText,
  setTags,
  onImageChange,
  onCreatePost,
  currentUser,
}) {
  if (!show) {
    return null;
  }

  return (
    <div
      className="create-post-modal"
      onClick={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="create-post-card">
        <div className="create-post-header">
          <h2>Create Post</h2>

          <button
            type="button"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={onImageChange}
        />

        {image && (
          <img
            className="create-post-preview"
            src={image}
            alt="Post preview"
          />
        )}

        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
        />

        <input
          type="text"
          placeholder="Alt text for image"
          value={alt}
          onChange={(event) =>
            setAlt(
              event.target.value
            )
          }
        />

        <textarea
          placeholder="Description"
          value={text}
          onChange={(event) =>
            setText(
              event.target.value
            )
          }
        />

        <input
          type="text"
          placeholder="Tags (comma separated, e.g. nature, travel, mountain)"
          value={tags}
          onChange={(event) =>
            setTags(
              event.target.value
            )
          }
        />

        <div className="create-post-meta">
          <p>
            <strong>
              Author:
            </strong>{" "}
            {currentUser}
          </p>

          <p>
            <strong>
              Uploaded time:
            </strong>{" "}
            current time when you post
          </p>
        </div>

        <div className="create-post-footer">
          <button
            type="button"
            className="cancel-post-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="publish-post-button"
            onClick={onCreatePost}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreatePostModal; 