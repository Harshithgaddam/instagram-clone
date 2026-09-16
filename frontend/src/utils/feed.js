/* =====================================
   Functional Programming - Feed Pipeline
   ===================================== */

export const pipe =
  (...functions) =>
  (value) =>
    functions.reduce(
      (result, currentFunction) =>
        currentFunction(result),
      value
    );

/* =====================================
   Filter by following users
   ===================================== */

export const filterByFollowing =
  (following) =>
  (postsToFilter) =>
    postsToFilter.filter((post) =>
      following.has(post.author)
    );

/* =====================================
   Sort newest first
   ===================================== */

export const sortByRecency = (
  postsToSort
) =>
  [...postsToSort].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

/* =====================================
   Remove duplicate posts
   ===================================== */

export const dedupe = (postsToDedupe) =>
  postsToDedupe.reduce(
    (uniquePosts, post) => {
      const alreadyExists =
        uniquePosts.some(
          (existingPost) =>
            existingPost.id === post.id
        );

      if (!alreadyExists) {
        uniquePosts.push(post);
      }

      return uniquePosts;
    },
    []
  );

/* =====================================
   Build feed
   ===================================== */

export const buildFeed =
  (following) =>
  (posts) =>
    pipe(
      filterByFollowing(following),
      sortByRecency,
      dedupe
    )(posts);