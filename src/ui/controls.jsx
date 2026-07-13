// ✅ File: src/ui/controls.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FiZoomIn,
  FiZoomOut,
  FiBookmark,
  FiMaximize,
  FiMinimize,
} from "react-icons/fi";
import { PiRewindLight, PiFastForwardLight } from "react-icons/pi";
import { useBookmarkStore } from "../store/useBookmarkStore";

export default function Controls({
  prevTopic,
  nextTopic,
  zoom,
  handleZoomIn,
  handleZoomOut,
  handleTopicClick,
  toggleFullScreen,
  isFullscreen,
  bookId,
  contentId,
  onBookmarkClick,
}) {
  const {
    bookmarks = [],
    fetchBookmarks,
    loading: storeLoading,
  } = useBookmarkStore();

  useEffect(() => {
    fetchBookmarks().catch(() => {});
  }, [fetchBookmarks]);

  return (
    <div className="flex justify-between items-center p-4">
      {/* Navigation */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => handleTopicClick(prevTopic)}
          disabled={!prevTopic}
          className="text-xl"
          title="Previous topic"
        >
          <PiRewindLight
            className={
              !prevTopic
                ? "text-gray-400 cursor-not-allowed"
                : "cursor-pointer text-black"
            }
          />
        </button>

        <button
          onClick={() => handleTopicClick(nextTopic)}
          disabled={!nextTopic}
          className="text-xl"
          title="Next topic"
        >
          <PiFastForwardLight
            className={
              !nextTopic
                ? "text-gray-400 cursor-not-allowed"
                : "cursor-pointer text-black"
            }
          />
        </button>
      </div>

      {/* Zoom and Display Controls */}
      <div className="flex items-center space-x-5 text-lg">
        <button onClick={handleZoomOut} title="Zoom Out" className="p-1">
          <FiZoomOut className="cursor-pointer hover:text-blue-500 transition-colors" />
        </button>

        <span className="text-lg font-medium select-none w-12 text-center">
          {zoom}%
        </span>

        <button onClick={handleZoomIn} title="Zoom In" className="p-1">
          <FiZoomIn className="cursor-pointer hover:text-blue-500 transition-colors" />
        </button>

        <button
          onClick={onBookmarkClick}
          title="Add / Remove Bookmark"
          className="p-1"
        >
          <FiBookmark
            className="cursor-pointer text-gray-500 hover:text-yellow-600 transition-colors"
            size={20}
          />
        </button>

        <button
          onClick={toggleFullScreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          className="p-1"
        >
          {isFullscreen ? (
            <FiMinimize className="cursor-pointer" />
          ) : (
            <FiMaximize className="cursor-pointer" />
          )}
        </button>
      </div>
    </div>
  );
}
