import {useCallback,useEffect,useRef,useState} from "react";
import "./App.css";

/* =====================================
   Models
   ===================================== */

import {
  Tweet,
  Retweet,
} from "./models/Post";

import { Comment } from "./models/Comment";

/* =====================================
   Data
   ===================================== */

import { feedSeedPosts } from "./data/posts";

/* =====================================
   API
   ===================================== */

import {
  API_PAGE_LIMIT,
  fetchMockPosts,
  convertApiPostToFeedPost,
} from "./api/postsApi";

/* =====================================
   Utilities
   ===================================== */

import {
  loadStoredPosts,
  saveStoredPosts,
  loadFollowingUsers,
  saveFollowingUsers,
  loadLikedPosts,
  saveLikedPosts,
} from "./utils/storage";

import { buildFeed } from "./utils/feed";

import { preloadImage } from "./utils/image";

import { promiseAllInBatches } from "./utils/promiseBatch";

import { notificationEmitter } from "./utils/EventEmitter";

/* =====================================
   Components
   ===================================== */

import SearchSection from "./components/SearchSection";
import ProfileGrid from "./components/ProfileGrid";
import InfiniteFeed from "./components/InfiniteFeed";
import CreatePostModal from "./components/CreatePostModal";
import PostModal from "./components/PostModal";
import NotificationToast from "./components/NotificationToast";

/* =====================================
   Constants
   ===================================== */

const CURRENT_USER = "Harshith";

/* =====================================
   App
   ===================================== */

function App() {
  const currentUser = CURRENT_USER;

  /* =====================================
     Following Users
     ===================================== */

  const [followingUsers, setFollowingUsers] =
    useState(() => loadFollowingUsers());

  useEffect(() => {
    saveFollowingUsers(followingUsers);
  }, [followingUsers]);

  /* =====================================
     Follow / Unfollow
     ===================================== */

  const toggleFollow = useCallback(
    (username) => {
      if (!username || username === currentUser) {
        return;
      }

      setFollowingUsers((previousFollowing) => {
        const nextFollowing = new Set(previousFollowing);

        const wasFollowing =
          nextFollowing.has(username);

        if (wasFollowing) {
          nextFollowing.delete(username);

          notificationEmitter.emit("unfollow", {
            type: "unfollow",
            message: `You unfollowed ${username}.`,
          });
        } else {
          nextFollowing.add(username);

          notificationEmitter.emit("new-follower", {
            type: "new-follower",
            message: `You are now following ${username}.`,
          });
        }

        return nextFollowing;
      });
    },
    [currentUser]
  );

  /* =====================================
     Main Post State
     ===================================== */

  const [displayPosts, setDisplayPosts] =
    useState(() => [
      ...loadStoredPosts(),
      ...feedSeedPosts,
    ]);

  /* =====================================
     Tweet Model State
     ===================================== */

  const [tweets, setTweets] = useState(() => {
    const initialPosts = [
      ...loadStoredPosts(),
      ...feedSeedPosts,
    ];

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

  /* =====================================
     Repost State
     ===================================== */

  const [repostedPosts, setRepostedPosts] =
    useState({});

  /* =====================================
     Like State
     ===================================== */

  const [likedPosts, setLikedPosts] =
    useState(() => loadLikedPosts());

  useEffect(() => {
    saveLikedPosts(likedPosts);
  }, [likedPosts]);

  /* =====================================
     Save User-Created Posts
     ===================================== */

  useEffect(() => {
    const customPosts = displayPosts.filter(
      (post) => post.isUserCreated
    );

    saveStoredPosts(customPosts);
  }, [displayPosts]);

  /* =====================================
     Search
     ===================================== */

  const [searchText, setSearchText] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");

  useEffect(() => {
    const timerId = setTimeout(() => {
      setSearchQuery(searchText);
    }, 400);

    return () => clearTimeout(timerId);
  }, [searchText]);

  /* =====================================
     Build Feed
     ===================================== */

  const feedPosts =
    buildFeed(followingUsers)(displayPosts);

  /* =====================================
     Search Filtering
     ===================================== */

  const filteredPosts = feedPosts.filter((post) => {
    const query = searchQuery
      .toLowerCase()
      .trim();

    if (!query) {
      return false;
    }

    return (
      post.title
        .toLowerCase()
        .includes(query) ||
      post.description
        .toLowerCase()
        .includes(query) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(query)
      )
    );
  });
  /* =====================================
     API Infinite Scroll State
     ===================================== */

  const [apiPosts, setApiPosts] =
    useState([]);

  const [apiLoading, setApiLoading] =
    useState(false);

  const [apiError, setApiError] =
    useState("");

  const [apiHasMore, setApiHasMore] =
    useState(true);

  const apiPageRef =
    useRef(1);

  const apiFetchingRef =
    useRef(false);

  const apiInitialFetchRef =
    useRef(false);

  const apiLoadedIdsRef =
    useRef(new Set());
  const filteredApiPosts = apiPosts.filter((post) => {
  const query = searchQuery
    .toLowerCase()
    .trim();

  if (!query) {
    return true;
  }

  const title =
    post.title?.toLowerCase() ?? "";

  const description =
    post.description?.toLowerCase() ?? "";

  const tags = Array.isArray(post.tags)
    ? post.tags
        .map((tag) => tag.toLowerCase())
        .join(" ")
    : "";

  return (
    title.includes(query) ||
    description.includes(query) ||
    tags.includes(query)
  );
});

  const displayedPosts =
    searchQuery.trim() === ""
      ? feedPosts
      : filteredPosts;

  /* =====================================
     Post Modal State
     ===================================== */

  /*
    IMPORTANT:
    selectedPost stores the COMPLETE post object.

    Example:

    selectedPost = {
      id: 1,
      src: "...",
      author: "Priya",
      ...
    }

    It is NOT an array index.
  */

  const [selectedPost, setSelectedPost] =
    useState(null);

  const [
    currentImageIndex,
    setCurrentImageIndex,
  ] = useState(0);

  /* =====================================
     Comments State
     ===================================== */

  const [commentText, setCommentText] =
    useState("");

  const [showComments, setShowComments] =
    useState(false);

  /* =====================================
     Open Post
     ===================================== */

  const openPost = useCallback((post) => {
    if (!post) {
      return;
    }

    setSelectedPost(post);
    setCurrentImageIndex(0);
    setShowComments(false);
    setCommentText("");
  }, []);

  /* =====================================
     Close Post
     ===================================== */

  const closePost = useCallback(() => {
    setSelectedPost(null);
    setCurrentImageIndex(0);
    setShowComments(false);
    setCommentText("");
  }, []);

  /* =====================================
     Selected Post Data
     ===================================== */

  const selectedPostData = selectedPost;

  /* =====================================
     Next Image
     ===================================== */

  const nextImage = useCallback(() => {
    if (!selectedPost) {
      return;
    }

    /*
      FIX:
      selectedPost is an object.
      Do NOT use:

      displayedPosts[selectedPost]
    */

    const totalImages =
      selectedPost.images?.length ?? 0;

    if (
      currentImageIndex <
      totalImages - 1
    ) {
      setCurrentImageIndex(
        (previous) => previous + 1
      );
    }
  }, [
    selectedPost,
    currentImageIndex,
  ]);

  /* =====================================
     Previous Image
     ===================================== */

  const previousImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(
        (previous) => previous - 1
      );
    }
  }, [currentImageIndex]);

  /* =====================================
     Create Post State
     ===================================== */

  const [
    showCreatePost,
    setShowCreatePost,
  ] = useState(false);

  const [
    newPostImage,
    setNewPostImage,
  ] = useState("");

  const [
    newPostTitle,
    setNewPostTitle,
  ] = useState("");

  const [
    newPostAlt,
    setNewPostAlt,
  ] = useState("");

  const [
    newPostText,
    setNewPostText,
  ] = useState("");

  const [
    newPostTags,
    setNewPostTags,
  ] = useState("");

  /* =====================================
     Handle Image Upload
     ===================================== */

  const handleImageChange = useCallback(
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert(
          "Please select an image file."
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        setNewPostImage(reader.result);
      };

      reader.onerror = () => {
        alert(
          "Could not read the selected image."
        );
      };

      reader.readAsDataURL(file);
    },
    []
  );

  /* =====================================
     Create Tweet / Post
     ===================================== */

  const createTweet = useCallback(() => {
    const title = newPostTitle.trim();
    const alt = newPostAlt.trim();
    const description = newPostText.trim();

    const tags = newPostTags
      .split(",")
      .map((tag) =>
        tag.trim().replace(/^#/, "")
      )
      .filter(Boolean);

    if (!newPostImage) {
      alert("Please upload an image.");
      return;
    }

    if (!title || !alt || !description) {
      alert(
        "Please fill in title, alt text, and description."
      );
      return;
    }

    if (tags.length === 0) {
      alert(
        "Please add at least one tag."
      );
      return;
    }

    const newId = Date.now();
    const createdAt =
      new Date().toISOString();

    const newTweet = new Tweet(
      newId,
      currentUser,
      description
    );

    newTweet.postId = newId;

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

    setTweets((previousTweets) => [
      newTweet,
      ...previousTweets,
    ]);

    setDisplayPosts((previousPosts) => [
      newGridPost,
      ...previousPosts,
    ]);

    setNewPostImage("");
    setNewPostTitle("");
    setNewPostAlt("");
    setNewPostText("");
    setNewPostTags("");
    setShowCreatePost(false);
  }, [
    newPostImage,
    newPostTitle,
    newPostAlt,
    newPostText,
    newPostTags,
    currentUser,
  ]);

  /* =====================================
     Add Comment
     ===================================== */

  const addComment = useCallback(() => {
    const content = commentText.trim();

    if (!content || !selectedPost) {
      return;
    }

    const postId = selectedPost.id;

    let tweet = tweets.find(
      (item) => item.postId === postId
    );

    /*
      API posts do not initially have
      a Tweet model.

      Create one when necessary.
    */

    if (!tweet) {
      tweet = new Tweet(
        postId,
        selectedPost.author,
        selectedPost.description
      );

      tweet.postId = postId;

      setTweets((previousTweets) => [
        ...previousTweets,
        tweet,
      ]);
    }

    const comment = new Comment(
      Date.now(),
      currentUser,
      content
    );

    tweet.addComment(comment);

    setTweets((previousTweets) => [
      ...previousTweets,
    ]);

    setCommentText("");

    notificationEmitter.emit(
      "comment",
      {
        type: "comment",
        message: `You commented on ${selectedPost.author}'s post.`,
      }
    );
  }, [
    commentText,
    selectedPost,
    tweets,
    currentUser,
  ]);

  /* =====================================
     Like / Unlike
     ===================================== */

  const toggleLike = useCallback(() => {
    if (!selectedPost) {
      return;
    }

    const postId = selectedPost.id;
    const author = selectedPost.author;

    const wasLiked =
      Boolean(likedPosts[postId]);

    setLikedPosts((previousLikes) => ({
      ...previousLikes,
      [postId]:
        !previousLikes[postId],
    }));

    if (wasLiked) {
      notificationEmitter.emit(
        "unlike",
        {
          type: "unlike",
          message: `You unliked ${author}'s post.`,
        }
      );
    } else {
      notificationEmitter.emit(
        "like",
        {
          type: "like",
          message: `You liked ${author}'s post.`,
        }
      );
    }
  }, [
    selectedPost,
    likedPosts,
  ]);

  /* =====================================
     Repost / Undo Repost
     ===================================== */

  const repostPost = useCallback(() => {
    if (!selectedPost) {
      return;
    }

    /*
      FIX:
      selectedPost is already the post object.

      OLD WRONG CODE:

      const post =
        displayedPosts[selectedPost];

      NEW CORRECT CODE:
    */

    const post = selectedPost;

    const postId = post.id;

    console.log(
      "Repost clicked:",
      postId
    );

    /* ---------------------------------
       Undo Repost
       --------------------------------- */

    if (repostedPosts[postId]) {
      setTweets((previousTweets) =>
        previousTweets.filter(
          (tweet) =>
            !(
              tweet instanceof Retweet &&
              tweet.originalPost?.postId ===
                postId
            )
        )
      );

      setRepostedPosts(
        (previousPosts) => ({
          ...previousPosts,
          [postId]: false,
        })
      );

      notificationEmitter.emit(
        "unrepost",
        {
          type: "unrepost",
          message: `You removed your repost of ${post.author}'s post.`,
        }
      );

      return;
    }

    /* ---------------------------------
       Find Original Tweet
       --------------------------------- */

    let originalPost = tweets.find(
      (tweet) =>
        tweet.postId === postId
    );

    /*
      FIX FOR API POSTS:

      API posts don't initially exist
      inside tweets.

      Create a Tweet model for them.
    */

    if (!originalPost) {
      originalPost = new Tweet(
        post.id,
        post.author,
        post.description
      );

      originalPost.postId = post.id;

      setTweets((previousTweets) => [
        ...previousTweets,
        originalPost,
      ]);
    }

    /* ---------------------------------
       Create Retweet
       --------------------------------- */

    const repost = new Retweet(
      Date.now(),
      currentUser,
      originalPost
    );

    setTweets((previousTweets) => [
      repost,
      ...previousTweets,
    ]);

    /* ---------------------------------
       Update Repost State
       --------------------------------- */

    setRepostedPosts(
      (previousPosts) => ({
        ...previousPosts,
        [postId]: true,
      })
    );

    /* ---------------------------------
       Notification
       --------------------------------- */

    notificationEmitter.emit(
      "repost",
      {
        type: "repost",
        message: `You reposted ${post.author}'s post.`,
      }
    );
  }, [
    selectedPost,
    repostedPosts,
    tweets,
    currentUser,
  ]);

  /* =====================================
     API Image Loading State
     ===================================== */

  const [
    apiImageStatus,
    setApiImageStatus,
  ] = useState({});

  const apiImageQueueRunningRef =
    useRef(false);

  

  /* =====================================
     Fetch Next API Page
     ===================================== */

  const fetchNextApiPage =
    useCallback(async () => {
      if (
        apiFetchingRef.current ||
        !apiHasMore
      ) {
        return;
      }

      apiFetchingRef.current = true;

      setApiLoading(true);
      setApiError("");

      const page =
        apiPageRef.current;

      try {
        const data =
          await fetchMockPosts(page);

        const incomingPosts =
          Array.isArray(data.posts)
            ? data.posts.map(
                convertApiPostToFeedPost
              )
            : [];

        const uniquePosts =
          incomingPosts.filter(
            (post) => {
              if (
                apiLoadedIdsRef.current.has(
                  post.apiId
                )
              ) {
                return false;
              }

              apiLoadedIdsRef.current.add(
                post.apiId
              );

              return true;
            }
          );

        setApiPosts(
          (previousPosts) => [
            ...previousPosts,
            ...uniquePosts,
          ]
        );

        const nextSkip =
          page * API_PAGE_LIMIT;

        const total =
          Number(data.total ?? 0);

        setApiHasMore(
          uniquePosts.length > 0 &&
            nextSkip < total
        );

        if (uniquePosts.length > 0) {
          apiPageRef.current =
            page + 1;
        } else {
          setApiHasMore(false);
        }
      } catch (error) {
        console.error(
          "Infinite feed error:",
          error
        );

        setApiError(
          error instanceof Error
            ? error.message
            : "Unable to load the feed."
        );
      } finally {
        apiFetchingRef.current = false;
        setApiLoading(false);
      }
    }, [apiHasMore]);

  /* =====================================
     Initial API Fetch
     ===================================== */

  useEffect(() => {
    if (
      apiInitialFetchRef.current
    ) {
      return;
    }

    apiInitialFetchRef.current = true;

    fetchNextApiPage();
  }, [fetchNextApiPage]);

  /* =====================================
     Progressive Image Queue
     Maximum 3 at a time
     ===================================== */

  useEffect(() => {
    const pendingPosts =
      apiPosts.filter(
        (post) =>
          post.src &&
          !apiImageStatus[post.id]
      );

    if (
      pendingPosts.length === 0 ||
      apiImageQueueRunningRef.current
    ) {
      return;
    }

    apiImageQueueRunningRef.current =
      true;

    const tasks =
      pendingPosts.map(
        (post) => () =>
          preloadImage(post.src)
      );

    promiseAllInBatches(
      tasks,
      3,
      async (batchResults) => {
        setApiImageStatus(
          (previousStatus) => {
            const nextStatus = {
              ...previousStatus,
            };

            batchResults.forEach(
              (result) => {
                const matchingPost =
                  pendingPosts.find(
                    (post) =>
                      post.src ===
                      result.src
                  );

                if (matchingPost) {
                  nextStatus[
                    matchingPost.id
                  ] = result.status;
                }
              }
            );

            return nextStatus;
          }
        );
      }
    )
      .catch((error) => {
        console.error(
          "Image queue error:",
          error
        );
      })
      .finally(() => {
        apiImageQueueRunningRef.current =
          false;
      });
  }, [
    apiPosts,
    apiImageStatus,
  ]);

  /* =====================================
     Notification Queue
     ===================================== */

  const [
    notificationQueue,
    setNotificationQueue,
  ] = useState([]);

  const notificationIdRef =
    useRef(0);

  useEffect(() => {
    const addToast = ({
      message,
      type,
    }) => {
      const id =
        ++notificationIdRef.current;

      setNotificationQueue(
        (previousQueue) => [
          ...previousQueue,
          {
            id,
            message,
            type,
          },
        ]
      );

      window.setTimeout(() => {
        setNotificationQueue(
          (previousQueue) =>
            previousQueue.filter(
              (toast) =>
                toast.id !== id
            )
        );
      }, 3500);
    };

    const unsubscribeFollower =
      notificationEmitter.on(
        "new-follower",
        addToast
      );

    const unsubscribeUnfollow =
      notificationEmitter.on(
        "unfollow",
        addToast
      );

    const unsubscribeLike =
      notificationEmitter.on(
        "like",
        addToast
      );

    const unsubscribeUnlike =
      notificationEmitter.on(
        "unlike",
        addToast
      );

    const unsubscribeComment =
      notificationEmitter.on(
        "comment",
        addToast
      );

    const unsubscribeRepost =
      notificationEmitter.on(
        "repost",
        addToast
      );

    const unsubscribeUnrepost =
      notificationEmitter.on(
        "unrepost",
        addToast
      );

    return () => {
      unsubscribeFollower();
      unsubscribeUnfollow();
      unsubscribeLike();
      unsubscribeUnlike();
      unsubscribeComment();
      unsubscribeRepost();
      unsubscribeUnrepost();
    };
  }, []);

  /* =====================================
     Selected Tweet / Comments
     ===================================== */

  const selectedTweet =
    selectedPostData
      ? tweets.find(
          (tweet) =>
            tweet.postId ===
            selectedPostData.id
        )
      : null;

  const selectedComments =
    selectedTweet?.comments ?? [];

  /* =====================================
     Render
     ===================================== */

  return (
    <>
      <main className="container">

        <h1>Instagram</h1>

        {/* =================================
            Search
            ================================= */}

       <SearchSection
  searchText={searchText}
  setSearchText={setSearchText}
  searchQuery={searchQuery}
  filteredPosts={filteredPosts}
  filteredApiPosts={filteredApiPosts}
  onCreatePost={() =>
    setShowCreatePost(true)
  }
/>

        {/* =================================
            Combined Feed
            ================================= */}

        <div className="combined-feed-grid">

          {/* Profile Posts */}

          <ProfileGrid
            posts={displayedPosts}
            onPostClick={openPost}
          />

          {/* API Posts */}

          <InfiniteFeed
            apiPosts={filteredApiPosts}
            apiImageStatus={
              apiImageStatus
            }
            apiLoading={apiLoading}
            apiError={apiError}
            apiHasMore={apiHasMore}
            fetchNextApiPage={
              fetchNextApiPage
            }
            onPostClick={openPost}
          />

        </div>
      </main>

      {/* =====================================
          Notification Toasts
          ===================================== */}

      <NotificationToast
        notificationQueue={
          notificationQueue
        }
      />

      {/* =====================================
          Create Post Modal
          ===================================== */}

      <CreatePostModal
        show={showCreatePost}
        onClose={() =>
          setShowCreatePost(false)
        }
        image={newPostImage}
        title={newPostTitle}
        alt={newPostAlt}
        text={newPostText}
        tags={newPostTags}
        setTitle={setNewPostTitle}
        setAlt={setNewPostAlt}
        setText={setNewPostText}
        setTags={setNewPostTags}
        onImageChange={
          handleImageChange
        }
        onCreatePost={createTweet}
        currentUser={currentUser}
      />

      {/* =====================================
          Post Modal
          ===================================== */}

      {selectedPost && (
        <PostModal
          post={selectedPost}

          currentUser={currentUser}

          currentImageIndex={
            currentImageIndex
          }

          setCurrentImageIndex={
            setCurrentImageIndex
          }

          onClose={closePost}

          onNextImage={nextImage}

          onPreviousImage={
            previousImage
          }

          followingUsers={
            followingUsers
          }

          onToggleFollow={
            toggleFollow
          }

          showComments={
            showComments
          }

          setShowComments={
            setShowComments
          }

          comments={
            selectedComments
          }

          commentText={
            commentText
          }

          setCommentText={
            setCommentText
          }

          onAddComment={
            addComment
          }

          isLiked={
            Boolean(
              likedPosts[
                selectedPost.id
              ]
            )
          }

          onToggleLike={
            toggleLike
          }

          isReposted={
            Boolean(
              repostedPosts[
                selectedPost.id
              ]
            )
          }

          onRepost={
            repostPost
          }
        />
      )}
    </>
  );
}

export default App;