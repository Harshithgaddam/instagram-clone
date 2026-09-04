import { useState, useEffect, useRef } from "react";
import "./App.css";
import { Tweet, Retweet } from "./models/Post";
import { Comment } from "./models/Comment";

const posts = [
  {
    images: [
      "https://picsum.photos/id/1015/600/600",
      "https://picsum.photos/id/1016/600/600",
      "https://picsum.photos/id/1018/600/600",
    ],
  },
  {
    images: ["https://picsum.photos/id/1016/600/600"],
  },
  {
    images: [
      "https://picsum.photos/id/1018/600/600",
      "https://picsum.photos/id/1020/600/600",
    ],
  },
  {
    images: ["https://picsum.photos/id/1020/600/600"],
  },
  {
    images: [
      "https://picsum.photos/id/1024/600/600",
      "https://picsum.photos/id/1025/600/600",
      "https://picsum.photos/id/1035/600/600",
    ],
  },
  {
    images: ["https://picsum.photos/id/1025/600/600"],
  },
  {
    images: ["https://picsum.photos/id/1035/600/600"],
  },
  {
    images: [
      "https://picsum.photos/id/1036/600/600",
      "https://picsum.photos/id/1039/600/600",
    ],
  },
  {
    images: ["https://picsum.photos/id/1039/600/600"],
  },
];

const CURRENT_USER = "Harshith";

const profileImages = [
  {
    id: 0,
    src: "https://picsum.photos/id/1015/600/600",
    alt: "Mountain lake landscape",
    title: "Mountain Lake",
    description: "Beautiful mountain landscape with a blue lake",
    tags: ["mountain", "lake", "nature", "travel"],
    author: "Harshith",
    createdAt: "2026-09-03T18:00:00",
  },
  {
    id: 1,
    src: "https://picsum.photos/id/1016/600/600",
    alt: "Red mountain landscape",
    title: "Red Mountains",
    description: "Beautiful red mountain and rocky landscape",
    tags: ["mountain", "rocks", "nature", "travel"],
    author: "Priya",
    createdAt: "2026-09-03T17:00:00",
  },
  {
    id: 2,
    src: "https://picsum.photos/id/1018/600/600",
    alt: "Green mountain valley",
    title: "Green Valley",
    description: "Green mountains with a beautiful road",
    tags: ["mountain", "valley", "road", "nature"],
    author: "Rahul",
    createdAt: "2026-09-03T16:00:00",
  },
  {
    id: 3,
    src: "https://picsum.photos/id/1020/600/600",
    alt: "Bear in the wild",
    title: "Wild Bear",
    description: "Bear walking through a natural wilderness",
    tags: ["bear", "animal", "wildlife", "nature"],
    author: "Harshith",
    createdAt: "2026-09-03T15:00:00",
  },
  {
    id: 4,
    src: "https://picsum.photos/id/1024/600/600",
    alt: "Bird flying",
    title: "Flying Bird",
    description: "Bird flying freely in the sky",
    tags: ["bird", "animal", "wildlife", "sky"],
    author: "Priya",
    createdAt: "2026-09-03T14:00:00",
  },
  {
    id: 5,
    src: "https://picsum.photos/id/1025/600/600",
    alt: "Dog in nature",
    title: "Cute Dog",
    description: "Cute dog sitting outside in nature",
    tags: ["dog", "animal", "pet", "nature"],
    author: "Rahul",
    createdAt: "2026-09-03T13:00:00",
  },
  {
    id: 6,
    src: "https://picsum.photos/id/1035/600/600",
    alt: "Waterfall",
    title: "Waterfall",
    description: "Beautiful waterfall surrounded by nature",
    tags: ["waterfall", "water", "nature", "travel"],
    author: "Harshith",
    createdAt: "2026-09-03T12:00:00",
  },
  {
    id: 7,
    src: "https://picsum.photos/id/1036/600/600",
    alt: "Blue mountain scenery",
    title: "Blue Mountains",
    description: "Beautiful blue mountains and forest",
    tags: ["mountain", "forest", "nature", "travel"],
    author: "Priya",
    createdAt: "2026-09-03T11:00:00",
  },
  {
    id: 8,
    src: "https://picsum.photos/id/1039/600/600",
    alt: "Forest landscape",
    title: "Green Forest",
    description: "Green forest landscape surrounded by mountains",
    tags: ["forest", "mountain", "nature", "travel"],
    author: "Rahul",
    createdAt: "2026-09-03T10:00:00",
  },
];// =====================================
// Feed Data
// =====================================
// Add the data required by the feed pipeline.
// The original UI data above is kept unchanged.

const feedSeedPosts = profileImages.map((post, index) => ({
  ...post,
  images: posts[index].images,
}));

const getResponsiveSrcSet = (src) => {
  if (!src) return undefined;

  const match = src.match(
    /https:\/\/picsum\.photos\/id\/(\d+)\/\d+\/\d+/
  );

  if (!match) return undefined;

  const id = match[1];

  return `
    https://picsum.photos/id/${id}/200/200 200w,
    https://picsum.photos/id/${id}/300/300 300w,
    https://picsum.photos/id/${id}/400/400 400w
  `;
};

// =====================================
// Functional Programming - Feed Pipeline
// =====================================

const pipe = (...functions) => (value) =>
  functions.reduce(
    (result, currentFunction) => currentFunction(result),
    value
  );

const filterByFollowing = (following) => (posts) =>
  posts.filter((post) => following.has(post.author));

const sortByRecency = (posts) =>
  [...posts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

const dedupe = (posts) =>
  posts.reduce((uniquePosts, post) => {
    const alreadyExists = uniquePosts.some(
      (existingPost) => existingPost.id === post.id
    );

    if (!alreadyExists) {
      uniquePosts.push(post);
    }

    return uniquePosts;
  }, []);

// The following Set is supplied at runtime so Follow/Unfollow
// immediately changes which posts enter the feed.
const buildFeed = (following) =>
  pipe(
    filterByFollowing(following),
    sortByRecency,
    dedupe
  );

const loadStoredPosts = () => {
  try {
    const savedPosts = localStorage.getItem("customPosts");
    return savedPosts ? JSON.parse(savedPosts) : [];
  } catch (error) {
    console.error("Could not load saved posts:", error);
    return [];
  }
};



function App() {

  // =====================================
  // Current User
  // =====================================

  const currentUser = CURRENT_USER;

  // =====================================
  // Following Users - Set
  // =====================================

  const [followingUsers, setFollowingUsers] = useState(() => {
    try {
      const savedFollowing = localStorage.getItem("followingUsers");

      if (savedFollowing) {
        return new Set(JSON.parse(savedFollowing));
      }
    } catch (error) {
      console.error("Could not load following users:", error);
    }

    return new Set(["Harshith", "Priya", "Rahul"]);
  });

  useEffect(() => {
    localStorage.setItem(
      "followingUsers",
      JSON.stringify([...followingUsers])
    );
  }, [followingUsers]);

  const toggleFollow = (username) => {
    if (!username || username === currentUser) return;

    setFollowingUsers((previousFollowing) => {
      const nextFollowing = new Set(previousFollowing);

      if (nextFollowing.has(username)) {
        nextFollowing.delete(username);
      } else {
        nextFollowing.add(username);
      }

      return nextFollowing;
    });
  };

  const [repostedPosts, setRepostedPosts] = useState({});
  // =====================================
  // Modal State
  // =====================================

  const [selectedPost, setSelectedPost] = useState(null);

  // =====================================
  // Carousel State
  // =====================================

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // =====================================
  // Like State
  // =====================================

  const [likedPosts, setLikedPosts] = useState(() => {
    const savedLikes = localStorage.getItem("likedPosts");

    return savedLikes ? JSON.parse(savedLikes) : {};
  });

  useEffect(() => {
    localStorage.setItem(
      "likedPosts",
      JSON.stringify(likedPosts)
    );
  }, [likedPosts]);

  // =====================================
  // Search State
  // =====================================

  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // =====================================
  // Tweet State
  // =====================================

  const [displayPosts, setDisplayPosts] = useState(() => {
    return [...loadStoredPosts(), ...feedSeedPosts];
  });

  const [tweets, setTweets] = useState(() => {
    const initialPosts = [...loadStoredPosts(), ...feedSeedPosts];

    return initialPosts.map((post) => {
      const tweet = new Tweet(
        post.id,
        post.author,
        post.description
      );

      tweet.postId = post.id;

      return tweet;
    });
  });

  // =====================================
  // Create Post State
  // =====================================

  const [showCreatePost, setShowCreatePost] = useState(false);

  const [newPostImage, setNewPostImage] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostAlt, setNewPostAlt] = useState("");
  const [newPostText, setNewPostText] = useState("");
  const [newPostTags, setNewPostTags] = useState("");

  // =====================================
  // Comment State
  // =====================================

  const [commentText, setCommentText] = useState("");

  const [showComments, setShowComments] = useState(false);

  // =====================================
  // Persist User-Created Posts
  // =====================================

  useEffect(() => {
    const customPosts = displayPosts.filter(
      (post) => post.isUserCreated
    );

    localStorage.setItem(
      "customPosts",
      JSON.stringify(customPosts)
    );
  }, [displayPosts]);

  // =====================================
  // Post Images Reference
  // =====================================

  const postImagesRef = useRef(null);

  // =====================================
  // Debounce Search
  // =====================================

  useEffect(() => {
    const timerId = setTimeout(() => {
      setSearchQuery(searchText);
    }, 400);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchText]);

  // =====================================
  // Search Results
  // =====================================

// =====================================
// Build Feed
// =====================================

const feedPosts = buildFeed(followingUsers)(displayPosts);


// =====================================
// Search Results
// =====================================

const filteredPosts = feedPosts.filter((post) => {
  const query = searchQuery.toLowerCase().trim();

  if (query === "") {
    return false;
  }

  return (
    post.title.toLowerCase().includes(query) ||
    post.description.toLowerCase().includes(query) ||
    post.tags.some((tag) =>
      tag.toLowerCase().includes(query)
    )
  );
});


// =====================================
// Posts Displayed On Grid
// =====================================

const displayedPosts =
  searchQuery.trim() === ""
    ? feedPosts
    : filteredPosts;
  // =====================================
  // Open Post
  // =====================================

  const openPost = (postIndex) => {
    setSelectedPost(postIndex);
    setCurrentImageIndex(0);
    setShowComments(false);
    setCommentText("");
  };

  // =====================================
  // Close Post
  // =====================================

  const closePost = () => {
    setSelectedPost(null);
    setCurrentImageIndex(0);
    setShowComments(false);
    setCommentText("");
  };

  // =====================================
  // Next Image
  // =====================================

  const nextImage = () => {
    if (selectedPost === null) {
      return;
    }

    const totalImages =displayPosts[selectedPost].images.length;

    if (currentImageIndex < totalImages - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  // =====================================
  // Previous Image
  // =====================================

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  // =====================================
  // Scroll To Current Image
  // =====================================

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

  // =====================================
  // Create Tweet
  // =====================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setNewPostImage(reader.result);
    };

    reader.onerror = () => {
      alert("Could not read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  // =====================================
  // Create Tweet / Post
  // =====================================

  const createTweet = () => {
    const title = newPostTitle.trim();
    const alt = newPostAlt.trim();
    const description = newPostText.trim();

    const tags = newPostTags
      .split(",")
      .map((tag) => tag.trim().replace(/^#/, ""))
      .filter(Boolean);

    if (!newPostImage) {
      alert("Please upload an image.");
      return;
    }

    if (!title || !alt || !description) {
      alert("Please fill in title, alt text, and description.");
      return;
    }

    if (tags.length === 0) {
      alert("Please add at least one tag.");
      return;
    }

    const newId = Date.now();
    const createdAt = new Date().toISOString();

    // OOP Tweet object.
    const newTweet = new Tweet(
      newId,
      currentUser,
      description
    );

    newTweet.postId = newId;

    setTweets((previousTweets) => [
      newTweet,
      ...previousTweets,
    ]);

    // Complete feed/grid post object.
    const newGridPost = {
      id: newId,
      src: newPostImage,
      alt,
      title,
      description,
      tags,
      author: currentUser,
      createdAt,
      images: [newPostImage],
      isUserCreated: true,
    };

    setDisplayPosts((previousPosts) => [
      newGridPost,
      ...previousPosts,
    ]);

    // Reset form.
    setNewPostImage("");
    setNewPostTitle("");
    setNewPostAlt("");
    setNewPostText("");
    setNewPostTags("");
    setShowCreatePost(false);

    console.log("Tweet created:", newTweet);
  };

  // =====================================
  // Add Comment
  // =====================================

  const addComment = () => {
    const content = commentText.trim();

    if (!content || selectedPost === null) {
      return;
    }

    const postId = displayPosts[selectedPost]?.id;

    const tweet = tweets.find(
      (post) => post.postId === postId
    );

    if (!tweet) {
      return;
    }

    const comment = new Comment(
      Date.now(),
      currentUser,
      content
    );

    tweet.addComment(comment);

    setTweets((prev) => [...prev]);

    setCommentText("");

    console.log("Comment added:", comment);
  };

  // =====================================
  // Repost
  // =====================================

const repostPost = () => {
  if (selectedPost === null) {
    return;
  }

  const postId = displayPosts[selectedPost].id;

  // =====================================
  // Undo Repost
  // =====================================

  if (repostedPosts[postId]) {

    setTweets((prev) =>
      prev.filter(
        (post) =>
          !(
            post instanceof Retweet &&
            post.originalPost?.postId === postId
          )
      )
    );

    setRepostedPosts((prev) => ({
      ...prev,
      [postId]: false,
    }));

    console.log("Repost undone");

    return;
  }


  // =====================================
  // Create Repost
  // =====================================

  const originalPost = tweets.find(
    (post) => post.postId === postId
  );

  if (!originalPost) {
    return;
  }

  const repost = new Retweet(
    Date.now(),
    currentUser,
    originalPost
  );

  setTweets((prev) => [
    repost,
    ...prev,
  ]);

  setRepostedPosts((prev) => ({
    ...prev,
    [postId]: true,
  }));

  console.log("Repost created:", repost);
};

  // =====================================
  // Keyboard Escape
  // =====================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closePost();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <main className="container">

        <h1>Instagram</h1>

        {/* =========================
            Search
            ========================= */}

        <section className="search-section">

          <button
            className="create-post-button"
            type="button"
            onClick={() => setShowCreatePost(true)}
          >
            + Create Post
          </button>

          <input
            type="text"
            id="searchInput"
            placeholder="Search posts..."
            autoComplete="on"
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
          />

          {searchQuery.trim() !== "" &&
            filteredPosts.length === 0 && (
              <div className="no-results">
                No posts found
              </div>
            )}

        </section>


        {/* =========================
            Profile Grid
            ========================= */}

        <section>

          <div className="profile-grid">

           {displayedPosts.map((image, index) => (
  <img
    key={image.id}
    src={image.src}
    srcSet={getResponsiveSrcSet(image.src)}
    sizes="(max-width: 600px) 33.33vw, 150px"
    alt={image.alt}
    width="200"
    height="200"
    loading={index === 0 ? "eager" : "lazy"}
    fetchPriority={index === 0 ? "high" : "auto"}
    decoding="async"
    onClick={() =>
      openPost(
        displayPosts.findIndex(
          (post) => post.id === image.id
        )
      )
    }
  />
))}

          </div>

        </section>

      </main>


      {/* =========================
          Create Post Modal
          ========================= */}

      {showCreatePost && (

        <div
          className="create-post-modal"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCreatePost(false);
            }
          }}
        >

          <div className="create-post-card">

            <div className="create-post-header">

              <h2>Create Post</h2>

              <button
                type="button"
                onClick={() =>
                  setShowCreatePost(false)
                }
              >
                &times;
              </button>

            </div>


            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            {newPostImage && (
              <img
                className="create-post-preview"
                src={newPostImage}
                alt="Post preview"
              />
            )}

            <input
              type="text"
              placeholder="Post title"
              value={newPostTitle}
              onChange={(event) =>
                setNewPostTitle(event.target.value)
              }
            />

            <input
              type="text"
              placeholder="Alt text for image"
              value={newPostAlt}
              onChange={(event) =>
                setNewPostAlt(event.target.value)
              }
            />

            <textarea
              placeholder="Description"
              value={newPostText}
              onChange={(event) =>
                setNewPostText(event.target.value)
              }
            />

            <input
              type="text"
              placeholder="Tags (comma separated, e.g. nature, travel, mountain)"
              value={newPostTags}
              onChange={(event) =>
                setNewPostTags(event.target.value)
              }
            />

            <div className="create-post-meta">
              <p><strong>Author:</strong> {currentUser}</p>
              <p><strong>Uploaded time:</strong> current time when you post</p>
            </div>


            <div className="create-post-footer">

              <button
                type="button"
                className="cancel-post-button"
                onClick={() =>
                  setShowCreatePost(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="publish-post-button"
                onClick={createTweet}
              >
                Post
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =========================
          Post Modal
          ========================= */}

      {selectedPost !== null && (

        <div
          className="post-modal active"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePost();
            }
          }}
        >

          {/* Close button */}

          <button
            className="close-button"
            type="button"
            onClick={closePost}
          >
            &times;
          </button>


          {/* =========================
              Post Modal Card
              ========================= */}

          <div className="post-content">

            {/* =========================
                Image Section
                ========================= */}

            <div className="post-viewer">

              {/* Previous */}

              {displayPosts[selectedPost].images.length > 1 && (

                <button
                  className="carousel-button left-button"
                  type="button"
                  onClick={previousImage}
                  disabled={
                    currentImageIndex === 0
                  }
                >
                  &#10094;
                </button>

              )}


              {/* Images */}

              <div
                className="post-images"
                ref={postImagesRef}
              >

                {displayPosts[selectedPost].images.map(
  (imageURL, index) => (
    <img
      key={index}
      src={imageURL}
      srcSet={getResponsiveSrcSet(imageURL)}
      sizes="(max-width: 600px) 90vw, 600px"
      width="600"
      height="600"
      loading={index === 0 ? "eager" : "lazy"}
      decoding="async"
      alt={displayPosts[selectedPost].alt}
    />
  )
)}

              </div>


              {/* Next */}

              {displayPosts[selectedPost].images.length > 1 && (

                <button
                  className="carousel-button right-button"
                  type="button"
                  onClick={nextImage}
                  disabled={
                    currentImageIndex ===
                    displayPosts[selectedPost].images.length - 1
                  }
                >
                  &#10095;
                </button>

              )}


              {/* Image counter */}

              {displayPosts[selectedPost].images.length > 1 && (

                <div className="image-counter">
                  {currentImageIndex + 1} /{" "}
                  {displayPosts[selectedPost].images.length}
                </div>

              )}


              {/* Thumbnails */}

              {displayPosts[selectedPost].images.length > 1 && (

                <div className="image-thumbnails">

                  {displayPosts[selectedPost].images.map(
                    (imageURL, index) => (

                      <button
                        key={index}
                        type="button"
                        className={
                          currentImageIndex === index
                            ? "thumbnail active-thumbnail"
                            : "thumbnail"
                        }
                        onClick={() =>
                          setCurrentImageIndex(index)
                        }
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

                    )
                  )}

                </div>

              )}

            </div>


            {/* =========================
                Post Information
                ========================= */}

            <div className="post-info">

              {/* Close button inside card */}

              <button
                className="info-close-button"
                type="button"
                onClick={closePost}
              >
                &times;
              </button>


              {/* Post Header */}

              <div className="post-header">

                <img
                  className="post-avatar"
                  src={displayPosts[selectedPost].src}
                  srcSet={getResponsiveSrcSet(
                    displayPosts[selectedPost].src
                  )}
                  sizes="50px"
                  width="50"
                  height="50"
                  loading="lazy"
                  decoding="async"
                  alt={displayPosts[selectedPost].alt}
                />

                <div>
                  <h2>
                    {displayPosts[selectedPost].author}
                  </h2>

                  <p>
                    {displayPosts[selectedPost].title}
                    &nbsp; • &nbsp;
                    {new Date(
                      displayPosts[selectedPost].createdAt
                    ).toLocaleString()}
                  </p>
                </div>

                {displayPosts[selectedPost].author !== currentUser && (
                  <button
                    type="button"
                    className="follow-button"
                    onClick={() =>
                      toggleFollow(
                        displayPosts[selectedPost].author
                      )
                    }
                  >
                    {followingUsers.has(
                      displayPosts[selectedPost].author
                    )
                      ? "Following"
                      : "Follow"}
                  </button>
                )}

              </div>

              {/* Description */}

              <div className="post-description">

                <p>
                  {displayPosts[selectedPost].description}
                </p>

              </div>


              {/* Tags */}

              <div className="post-tags">

                {displayPosts[selectedPost].tags.map(
                  (tag) => (

                    <span key={tag}>
                      #{tag}
                    </span>

                  )
                )}

              </div>


              {/* =========================
                  Comments
                  ========================= */}

              {showComments && (

                <div className="comments-section">

                  <h3>Comments</h3>

                  <div className="comment-list">

                    {tweets
                      .find(
                        (post) =>
                          post.postId ===
                          displayPosts[selectedPost].id
                      )
                      ?.comments.map(
                        (comment) => (

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

                        )
                      )}

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
                      onClick={addComment}
                    >
                      Post
                    </button>

                  </div>

                </div>

              )}


              {/* Divider */}

              <div className="info-divider"></div>


              {/* =========================
                  Actions
                  ========================= */}

              <div className="post-actions">

                {/* Like */}

                <button
                  id="likeButton"
                  type="button"
                  aria-label="Like"
                  className={
                    likedPosts[displayPosts[selectedPost].id]
                      ? "liked"
                      : ""
                  }
                  onClick={() => {

                    setLikedPosts((prev) => ({
                      ...prev,
                      [displayPosts[selectedPost].id]:
                        !prev[displayPosts[selectedPost].id],
                    }));

                  }}
                >

                  <svg viewBox="0 0 24 24">

                    <path
                      d="M20.8 8.6c0-2.4-1.9-4.3-4.3-4.3-1.4 0-2.7.7-3.5 1.8-.8-1.1-2.1-1.8-3.5-1.8C7.1 4.3 5.2 6.2 5.2 8.6c0 4.1 4.2 7.4 7.8 10.3 3.6-2.9 7.8-6.2 7.8-10.3z"
                    />

                  </svg>

                  <span>Like</span>

                </button>


                {/* Comment */}

                <button
                  type="button"
                  aria-label="Comment"
                  onClick={() =>
                    setShowComments(
                      (prev) => !prev
                    )
                  }
                >

                  <svg viewBox="0 0 24 24">

                    <path
                      d="M20 11.5a8 8 0 0 1-8 8H7l-4 2 1.5-4A8 8 0 1 1 20 11.5z"
                    />

                  </svg>

                  <span>Comment</span>

                </button>


                {/* Repost */}

                <button
  type="button"
  aria-label="Repost"
  className={
    repostedPosts[
      displayPosts[selectedPost].id
    ]
      ? "reposted"
      : ""
  }
  onClick={repostPost}
>

                  <svg viewBox="0 0 24 24">

                    <path
                      d="M7 7h10l-2-2 1.5-1.5L21 8l-4.5 4.5L15 11l2-2H7v4H5V7z"
                    />

                    <path
                      d="M17 17H7l2 2-1.5 1.5L3 16l4.5-4.5L9 13l-2 2h10v-4h2v6z"
                    />

                  </svg>

                  <span>Repost</span>

                </button>

              </div>


              {/* Time */}

              <p className="post-time">
                {new Date(
                  displayPosts[selectedPost].createdAt
                ).toLocaleString()}
              </p>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default App;