import "./SearchSection.css";

function SearchSection({
  searchText,
  setSearchText,
  searchQuery,
  filteredPosts,
  filteredApiPosts,
  onCreatePost,
}) {
  const totalResults =
    filteredPosts.length +
    filteredApiPosts.length;

  const showNoResults =
    searchQuery.trim() !== "" &&
    totalResults === 0;

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
          setSearchText(event.target.value)
        }
      />

      {showNoResults && (
        <div className="no-results">
          No posts found
        </div>
      )}
    </section>
  );
}

export default SearchSection;