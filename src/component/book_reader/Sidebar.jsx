import React from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiInfo,
} from "react-icons/fi";

export default function Sidebar({
  bookInfo,
  chapters,
  expandedChapters,
  toggleChapter,
  renderTopics,
  searchQuery,
  setSearchQuery,
  highlightMatch,
  isSidebarFullscreen,
  toggleSidebarFullScreen,
}) {
  const safeHighlight = (text) => {
    return typeof highlightMatch === "function" ? highlightMatch(text) : text;
  };

  return (
    <>
      {isSidebarFullscreen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={toggleSidebarFullScreen}
        />
      )}

      <div
        className={`shadow-xl flex flex-col rounded-xl bg-white z-50 overflow-hidden ${
          isSidebarFullscreen
            ? "fixed inset-0 w-full h-full"
            : "w-[24%] h-screen"
        }`}
      >
        {/* Header Section */}
        <div className="p-4 border-b bg-white">
          <div className="relative flex flex-col items-center justify-center">
            <div className="absolute left-0 top-0">
              <FiInfo className="text-gray-500" title="Book Info" />
            </div>
            <h2 className="font-bold text-lg text-center truncate max-w-[80%]">
              {bookInfo?.title}
            </h2>
            <h3 className="font-body text-sm text-gray-600 text-center mt-1">
              {bookInfo?.author || "Subtitle goes here"}
            </h3>
            <button
              onClick={toggleSidebarFullScreen}
              className="absolute right-0 top-0"
            >
              {isSidebarFullscreen ? (
                <FiChevronLeft className="text-xl" />
              ) : (
                <FiChevronRight className="text-xl" />
              )}
            </button>
          </div>

          {/* Updated date */}
          <p className="font-body text-[10px] text-yellow-600 mt-2 text-center">
            Updated:{" "}
            {bookInfo?.last_updated_at
              ? new Date(bookInfo.last_updated_at).toLocaleDateString("en-IN")
              : "N/A"}
          </p>

          {/* Search */}
          <div className="relative mt-3">
            <input
              type="text"
              placeholder="Search..."
              className="font-body w-full border rounded-lg p-2 text-sm bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute top-2.5 right-3 text-gray-400" />
          </div>
        </div>

        {/* Chapters as Cards */}
        <div className="overflow-y-auto flex-grow p-4 space-y-3 bg-gray-50">
          {chapters.length === 0 && (
            <p className="text-gray-500 text-sm text-center">
              No results found.
            </p>
          )}

          {chapters.map((ch) => (
            <div
              key={ch.id}
              className="bg-[#FFFDF0] border border-yellow-200 rounded-xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleChapter(ch.id)}
                className="w-full p-4 flex justify-between items-center hover:bg-yellow-100 transition"
              >
                <div className="text-left">
                  <div className="font-bold text-gray-900 text-sm uppercase">
                    {safeHighlight(ch.title)}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1 font-medium">
                    {safeHighlight(ch.header)}
                  </div>
                </div>
                {expandedChapters.includes(ch.id) ? (
                  <FiChevronUp className="text-yellow-700" />
                ) : (
                  <FiChevronDown className="text-yellow-700" />
                )}
              </button>

              {/* Tree Content Area */}
              {expandedChapters.includes(ch.id) && (
                <div className="bg-white border-t border-yellow-100 p-2">
                  {renderTopics(ch.children || [])}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
