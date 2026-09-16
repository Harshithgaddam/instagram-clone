const API_PAGE_LIMIT = 10;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

/* =====================================
   Fetch one feed page
   ===================================== */

export const fetchFeedPage = async ({
  cursor = null,
  limit = API_PAGE_LIMIT,
} = {}) => {
  const params = new URLSearchParams();

  params.set("limit", String(limit));

  if (cursor) {
    params.set("cursor", cursor);
  }

  const response = await fetch(
    `${API_BASE_URL}/feed?${params.toString()}`
  );

  if (!response.ok) {
    const errorBody =
      await response.json().catch(() => null);

    throw new Error(
      errorBody?.error?.message ??
        "Failed to fetch feed."
    );
  }

  return response.json();
};

/* =====================================
   Convert API post into existing
   frontend feed-post shape
   ===================================== */

export const convertApiPostToFeedPost = (
  post
) => {
  const firstMedia =
    post.media?.[0];

  const imageUrl =
    firstMedia?.largeUrl ??
    firstMedia?.smallUrl ??
    "";

  return {
    id: post.id,

    apiId: post.id,

    src: imageUrl,

    images:
      post.media?.map(
        (media) =>
          media.largeUrl ||
          media.smallUrl
      ) ?? [],

    alt:
      firstMedia?.altText ??
      post.text ??
      "",

    title:
      post.author?.displayName ??
      "",

    description:
      post.text ?? "",

    tags: [],

    author:
      post.author?.handle ??
      "",

    createdAt:
      post.createdAt,

    likes:
      post.likeCount ?? 0,

    comments: [],

    isApiPost: true,
  };
};

export { API_PAGE_LIMIT };