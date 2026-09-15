/* =====================================
   Load user-created posts
   ===================================== */

export const loadStoredPosts = () => {
  try {
    const savedPosts =
      localStorage.getItem("customPosts");

    return savedPosts
      ? JSON.parse(savedPosts)
      : [];
  } catch (error) {
    console.error(
      "Could not load saved posts:",
      error
    );

    return [];
  }
};

/* =====================================
   Save user-created posts
   ===================================== */

export const saveStoredPosts = (posts) => {
  try {
    localStorage.setItem(
      "customPosts",
      JSON.stringify(posts)
    );
  } catch (error) {
    console.error(
      "Could not save posts:",
      error
    );
  }
};

/* =====================================
   Load following users
   ===================================== */

export const loadFollowingUsers = () => {
  try {
    const savedFollowing =
      localStorage.getItem("followingUsers");

    if (savedFollowing) {
      return new Set(
        JSON.parse(savedFollowing)
      );
    }
  } catch (error) {
    console.error(
      "Could not load following users:",
      error
    );
  }

  return new Set([
    "Harshith",
    "Priya",
    "Rahul",
  ]);
};

/* =====================================
   Save following users
   ===================================== */

export const saveFollowingUsers = (
  followingUsers
) => {
  try {
    localStorage.setItem(
      "followingUsers",
      JSON.stringify([...followingUsers])
    );
  } catch (error) {
    console.error(
      "Could not save following users:",
      error
    );
  }
};

/* =====================================
   Load liked posts
   ===================================== */

export const loadLikedPosts = () => {
  try {
    const savedLikes =
      localStorage.getItem("likedPosts");

    return savedLikes
      ? JSON.parse(savedLikes)
      : {};
  } catch (error) {
    console.error(
      "Could not load liked posts:",
      error
    );

    return {};
  }
};

/* =====================================
   Save liked posts
   ===================================== */

export const saveLikedPosts = (
  likedPosts
) => {
  try {
    localStorage.setItem(
      "likedPosts",
      JSON.stringify(likedPosts)
    );
  } catch (error) {
    console.error(
      "Could not save liked posts:",
      error
    );
  }
};