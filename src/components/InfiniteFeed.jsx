import "./InfiniteFeed.css";
import { useEffect, useRef } from "react";

function InfiniteFeed({
  apiPosts,
  apiImageStatus,
  apiLoading,
  apiError,
  apiHasMore,
  fetchNextApiPage,
  onPostClick,
}) {
  const apiSentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = apiSentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          fetchNextApiPage();
        }
      },
      {
        root: null,
        rootMargin: "400px 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [apiHasMore, fetchNextApiPage]);

  return (
    <section className="infinite-feed-section">

      <div className="infinite-feed-list">
        {apiPosts.map((post) => {
          const imageStatus = apiImageStatus[post.id];

          return (
            <article
              className="api-feed-card"
              key={post.id}
             onClick={() => onPostClick(post)}
            >
              <div className="api-feed-image-wrapper">

                {!imageStatus && (
                  <div className="api-image-skeleton" />
                )}

                {imageStatus === "loaded" && (
                  <img
                    src={post.src}
                    alt={post.alt}
                    className="api-feed-image"
                    loading="lazy"
                    decoding="async"
                  />
                )}

                {imageStatus === "error" && (
                  <div className="api-image-error">
                    Image could not be loaded.
                  </div>
                )}

              </div>
            </article>
          );
        })}
      </div>

      {apiLoading && (
        <div className="infinite-feed-loading">
          <p>Loading more posts...</p>
        </div>
      )}

      {apiError && (
        <div className="infinite-feed-error">
          <p>{apiError}</p>

          <button
            type="button"
            onClick={fetchNextApiPage}
            disabled={apiLoading}
          >
            Retry
          </button>
        </div>
      )}

      {!apiHasMore && apiPosts.length > 0 && (
        <p className="infinite-feed-end">
          You reached the end of the feed.
        </p>
      )}

      <div
        ref={apiSentinelRef}
        className="feed-sentinel"
        aria-hidden="true"
      />
    </section>
  );
}

export default InfiniteFeed;