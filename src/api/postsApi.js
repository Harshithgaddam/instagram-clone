const API_PAGE_LIMIT = 10;

const API_BASE_URL =
  "https://dummyjson.com/posts";

/* =====================================
   Fetch one API page
   ===================================== */

export const fetchMockPosts = async (
  page
) => {
  const skip =
    (page - 1) * API_PAGE_LIMIT;

  const response = await fetch(
    `${API_BASE_URL}?limit=${API_PAGE_LIMIT}&skip=${skip}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch page ${page}.`
    );
  }

  return response.json();
};

/* =====================================
   Convert API post into feed post
   ===================================== */

export const convertApiPostToFeedPost = (
  post
) => {
  const imageId =
    (post.id % 1000) + 1;

  const imageUrl =
    `https://picsum.photos/id/${imageId}/600/400`;

  return {
    id: `api-${post.id}`,

    apiId: post.id,

    src: imageUrl,

    images: [imageUrl],

    alt: post.title,

    title: post.title,

    description: post.body,

    tags: Array.isArray(post.tags)
      ? post.tags
      : [],

    author: `User ${post.userId}`,

    createdAt: new Date(
      Date.now() -
        post.id *
          60 *
          60 *
          1000
    ).toISOString(),

    likes:
      post.reactions?.likes ?? 0,

    comments: [],

    isApiPost: true,
  };
};

export { API_PAGE_LIMIT };