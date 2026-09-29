import "./SearchSection.css";

function SearchSection({
  searchText,
  setSearchText,
  searchQuery,
  onCreatePost,
  searchResults,
  searchLoading,
  searchError,
  searchHasMore,
  fetchNextSearchPage,
  onSearchPostClick,
}) {
  

  return (
    <section className="search-section">
      <button
        className="create-post-button"
        type="button"
        onClick={onCreatePost}
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
          setSearchText(
            event.target.value,
          )
        }
      />

      {searchQuery.trim() !== "" && (
        <div className="search-results">
          {searchResults.map((post) => (
            <article
              key={post.id}
              className="search-result"
              onClick={() =>
                onSearchPostClick(post)
              }
            >
              <img src={post.smallUrl} />
              <strong>
                {post.title}
              </strong>

              <p>
                {post.description}
              </p>
            </article>
          ))}

          {searchLoading && (
            <p>Searching...</p>
          )}

          {searchError && (
            <div className="search-error">
              <p>{searchError}</p>

              <button
                type="button"
                onClick={() =>
                  fetchNextSearchPage(false)
                }
                disabled={searchLoading}
              >
                Retry
              </button>
            </div>
          )}

          {!searchLoading &&
            !searchError &&
            searchResults.length === 0 && (
              <div className="no-results">
                No posts found
              </div>
            )}

          {searchHasMore &&
            !searchLoading && (
              <button
                type="button"
                onClick={() =>
                  fetchNextSearchPage(false)
                }
              >
                Load more
              </button>
            )}
        </div>
      )}
    </section>
  );
}

export default SearchSection;