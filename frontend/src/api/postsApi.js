const API_PAGE_LIMIT = 10;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const resolveMediaUrl = (url) =>
  url?.startsWith("/")
    ? `${API_BASE_URL}${url}`
    : url;

const request = async (
  path,
  options = {},
) => {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      credentials: "include",
      headers:
        options.body instanceof FormData
          ? { ...(options.headers ?? {}) }
          : {
              "Content-Type": "application/json",
              ...(options.headers ?? {}),
            },
    },
  );

  const body =
    await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body?.message ??
      body?.error?.message ??
      "Request failed.";

    const error = new Error(message);

    error.status = response.status;
    error.body = body;

    throw error;
  }

  return body;
};

export const createPost = async ({
  authorId,
  kind,
  text,
  replyToId,
  repostOfId,
  image,
  altText,
}) => {
  if (image) {
    const formData = new FormData();
    formData.append("authorId", authorId);
    formData.append("kind", kind);
    if (text !== undefined) formData.append("text", text);
    if (replyToId !== undefined) formData.append("replyToId", replyToId);
    if (repostOfId !== undefined) formData.append("repostOfId", repostOfId);
    formData.append("altText", altText ?? "");
    formData.append("image", image);

    return request("/posts", {
      method: "POST",
      body: formData,
    });
  }

  return request("/posts", {
    method: "POST",
    body: JSON.stringify({
      authorId,
      kind,
      ...(text !== undefined ? { text } : {}),
      ...(replyToId !== undefined ? { replyToId } : {}),
      ...(repostOfId !== undefined ? { repostOfId } : {}),
    }),
  });
};

/* =====================================
   Feed
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

  return request(
    `/feed?${params.toString()}`,
  );
};

/* =====================================
   Post detail
   ===================================== */

export const fetchPostDetail = async (
  postId,
) => {
  return request(`/posts/${postId}`);
};

export const fetchPostReplies = async (
  postId,
) => {
  return request(`/posts/${postId}/replies`);
};

/* =====================================
   Profile
   ===================================== */

export const fetchUserProfile = async (
  userId,
) => {
  return request(`/users/${userId}`);
};

export const fetchUserPosts = async (
  userId,
  kind,
  { cursor = null, limit = API_PAGE_LIMIT } = {},
) => {
  const params = new URLSearchParams();
  params.set("kind", kind);
  params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  return request(`/users/${userId}/posts?${params.toString()}`);
};

export const updateUserProfile = async ({
  displayName,
  bio,
  version,
}) =>
  request("/users/me", {
    method: "PATCH",
    body: JSON.stringify({ displayName, bio, version }),
  });

export const fetchUserFollowers = async (
  userId,
  { cursor = null, limit = API_PAGE_LIMIT } = {},
) => {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  return request(`/users/${userId}/followers?${params.toString()}`);
};

export const fetchUserFollowing = async (
  userId,
  { cursor = null, limit = API_PAGE_LIMIT } = {},
) => {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  return request(`/users/${userId}/following?${params.toString()}`);
};

export const followUser = async (userId) =>
  request(`/users/${userId}/follow`, {
    method: "POST",
  });

export const unfollowUser = async (userId) =>
  request(`/users/${userId}/follow`, {
    method: "DELETE",
  });

/* =====================================
   Profile media
   ===================================== */

export const fetchProfileMediaPage = async ({
  userId,
  cursor = null,
  limit = API_PAGE_LIMIT,
}) => {
  const params = new URLSearchParams();

  params.set("limit", String(limit));

  if (cursor) {
    params.set("cursor", cursor);
  }

  return request(
    `/users/${userId}/media?${params.toString()}`,
  );
};

/* =====================================
   Search
   ===================================== */

export const searchPosts = async ({
  query,
  cursor = null,
  limit = API_PAGE_LIMIT,
}) => {
  const params = new URLSearchParams();

  params.set("q", query);
  params.set("limit", String(limit));

  if (cursor) {
    params.set("cursor", cursor);
  }

  return request(
    `/search?${params.toString()}`,
  );
};

/* =====================================
   Likes
   ===================================== */

export const likePost = async (
  postId,
) => {
  return request(
    `/posts/${postId}/like`,
    {
      method: "PUT",
    },
  );
};

export const unlikePost = async (
  postId,
) => {
  return request(
    `/posts/${postId}/like`,
    {
      method: "DELETE",
    },
  );
};

/* =====================================
   Convert API post
   ===================================== */

export const convertApiPostToFeedPost = (
  post,
) => {
  /*
   * The backend currently returns media as
   * either:
   *
   * 1. null
   * 2. one media object containing images[]
   *
   * Normalize both cases into one frontend array.
   */

  let mediaItems = [];

  if (Array.isArray(post.media)) {
    // Supports an array response too.
    mediaItems = post.media;
  } else if (
    post.media &&
    Array.isArray(post.media.images)
  ) {
    // Current backend shape.
    mediaItems =
      post.media.images.map(
        (image) => ({
          id: post.media.id,

          altText:
            image.altText ??
            image.alt_text ??
            "",

          smallUrl: resolveMediaUrl(
            image.smallUrl ?? image.small_url ?? "",
          ),

          largeUrl: resolveMediaUrl(
            image.largeUrl ?? image.large_url ?? "",
          ),
        }),
      );
  }

  const firstMedia =
    mediaItems[0];

  const imageUrls =
    mediaItems
      .map(
        (media) =>
          media.largeUrl ||
          media.smallUrl ||
          "",
      )
      .filter(Boolean);

  const imageUrl =
    imageUrls[0] ?? "";

  return {
    id: post.id,

    apiId: post.id,

    src: imageUrl,

    images: imageUrls,

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

    authorId:
      post.author?.id ??
      null,

    authorDisplayName:
      post.author?.displayName ??
      "",

    avatarSmallUrl:
      post.author?.avatarSmallUrl ??
      "",

    avatarLargeUrl:
      post.author?.avatarLargeUrl ??
      "",

    createdAt:
      post.createdAt,

    likes:
      post.likeCount ?? 0,

    likeCount:
      post.likeCount ?? 0,

    replyCount:
      post.replyCount ?? 0,

    likedByViewer:
      Boolean(
        post.likedByViewer,
      ),

    repostedByViewer:
      Boolean(
        post.repostedByViewer,
      ),

    replyToId:
      post.replyToId ?? null,

    repostOfId:
      post.repostOfId ?? null,

    kind:
      post.kind,

    comments: [],

    isApiPost: true,
  };
};

export const convertProfileMediaToFeedPost = (
  item,
) => {
  return convertApiPostToFeedPost(item);
};

export {
  API_PAGE_LIMIT,
};
export const deletePost = async (
  postId,
) => {
  return request(
    `/posts/${postId}`,
    {
      method: "DELETE",
    },
  );
};

export const undoRepost = async (
  originalPostId,
) => {
  return request(
    `/posts/${originalPostId}/repost`,
    {
      method: "DELETE",
    },
  );
};