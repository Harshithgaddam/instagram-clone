import "./Comments.css";
function Comments({
  comments,
  commentText,
  setCommentText,
  onAddComment,
}) {
  return (
    <div className="comments-section"> 
      <h3>Comments</h3>

      <div className="comment-list">
        {comments?.map((comment) => (
          <div
            className="comment"
            key={comment.id}
          >
            <strong>
              {comment.author}
            </strong>

            <span>
              {comment.content}
            </span>
          </div>
        ))}
      </div>

      <div className="comment-input">
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(event) =>
            setCommentText(
              event.target.value
            )
          }
        />

        <button
          type="button"
          onClick={onAddComment}
        >
          Post
        </button>
      </div>
    </div>
  );
}

export default Comments;