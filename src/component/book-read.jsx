import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  FaChevronDown,
  FaChevronRight,
  FaChevronLeft,
  FaSearchPlus,
  FaSearchMinus,
  FaExpand,
  FaCompress,
  FaFilePdf,
} from "react-icons/fa";
import api from "../api/Instance";
import DOMPurify from "dompurify";
import Fallbackimg from "../assets/istockphoto-183890264-612x612.jpg";

const IMAGE_BASE_URL = "https://mvdebook.blr1.digitaloceanspaces.com/media/";
const BASE_URL = "https://mvdebook.blr1.digitaloceanspaces.com";

/* ✅ FIX 1: correct fallback (NOT object) */
const FALLBACK_IMAGE = Fallbackimg;

const getImageUrl = (url) => {
  if (!url) return FALLBACK_IMAGE;
  return url.startsWith("http")
    ? url
    : `${IMAGE_BASE_URL}${url.replace(/^\/+/, "")}`;
};

const fixRelativeLinks = (htmlString) => {
  if (typeof window === "undefined") return htmlString;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;

  const links = tempDiv.querySelectorAll("a");

  links.forEach((a) => {
    const href = a.getAttribute("href") || "";

    if (!href || href === "#") {
      a.removeAttribute("href");
      a.style.pointerEvents = "none";
      a.style.color = "gray";
      return;
    }

    if (!href.startsWith("http")) {
      a.setAttribute(
        "href",
        `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`,
      );
    }

    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });

  return tempDiv.innerHTML;
};

export default function BookReader() {
  const { id: bookId } = useParams();

  const [bookInfo, setBookInfo] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const contentRefs = useRef({});
  const contentContainerRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes, contentRes] = await Promise.all([
          api.get(`/ebook/cover/${bookId}`),
          api.get(`/ebook-content/${bookId}`),
        ]);

        setBookInfo(bookRes.data);
        setChapters(generateNumberedTree(contentRes.data));
      } catch (error) {
        console.error("Error loading book data:", error);
      }
    };

    fetchData();
  }, [bookId]);

  const generateNumberedTree = (nodes, prefix = []) =>
    nodes.map((node, index) => {
      const numbering = [...prefix, index + 1].join(".");

      const numberedNode = { ...node, numbering };

      if (node.children) {
        numberedNode.children = generateNumberedTree(node.children, [
          ...prefix,
          index + 1,
        ]);
      }

      return numberedNode;
    });

  /* ✅ FIX 2: safe highlight (no crash) */
  const highlightMatch = (text) => {
    try {
      if (!searchQuery || typeof text !== "string") return text;

      const regex = new RegExp(`(${searchQuery})`, "gi");

      return text.split(regex).map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200">
            {part}
          </mark>
        ) : (
          part
        ),
      );
    } catch (err) {
      console.warn("highlightMatch error:", err);
      return text;
    }
  };

  const toggleChapter = (id) => {
    setExpandedChapter(expandedChapter === id ? null : id);
  };

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);

    const ref = contentRefs.current[topic.id];

    if (ref && ref.scrollIntoView) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 10, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 10, 50));
  const toggleFullScreen = () => setIsFullscreen((fs) => !fs);

  const flattenTopics = (nodes = []) =>
    nodes.flatMap((n) => [n, ...flattenTopics(n.children || [])]);

  const flatTopics = useMemo(() => flattenTopics(chapters), [chapters]);

  const selectedIndex = flatTopics.findIndex((t) => t.id === selectedTopic?.id);

  const prevTopic = flatTopics[selectedIndex - 1];
  const nextTopic = flatTopics[selectedIndex + 1];

  const renderTopics = (topics) => (
    <ul className="pl-4 py-2 space-y-1">
      {topics.map((topic) => (
        <li key={topic.id}>
          <button
            onClick={() => handleTopicClick(topic)}
            className={`block w-full text-left px-2 py-1 rounded transition-colors ${
              selectedTopic?.id === topic.id
                ? "bg-yellow-300 font-bold"
                : "hover:bg-yellow-100"
            }`}
          >
            <span className="text-sm">
              {topic.numbering}. {highlightMatch(topic?.header || "")}
            </span>

            {topic.title && (
              <div className="text-xs text-gray-500 italic ml-4">
                — {highlightMatch(topic?.title || "")}
              </div>
            )}
          </button>

          {topic.children && renderTopics(topic.children)}
        </li>
      ))}
    </ul>
  );

  const renderA4Sheets = () => (
    <div
      ref={contentContainerRef}
      className="overflow-y-auto h-[calc(100vh-12rem)] p-4 bg-gray-200 flex flex-col items-center"
    >
      {flatTopics.map((topic) => (
        <div
          key={topic.id}
          className="mb-8 origin-top transition-transform duration-200"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <div
            ref={(el) => (contentRefs.current[topic.id] = el)}
            className="bg-white shadow-2xl p-[20mm] border border-gray-300"
            style={{ width: "210mm", minHeight: "297mm" }}
          >
            <h2 className="text-3xl font-bold mb-2 border-b pb-4">
              {topic.numbering}. {highlightMatch(topic?.header || "")}
            </h2>

            {topic.title && (
              <h3 className="text-xl italic text-gray-600 mb-8">
                {highlightMatch(topic?.title || "")}
              </h3>
            )}

            <div
              className="text-gray-900 text-justify leading-relaxed text-lg"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  fixRelativeLinks(topic.verified_content || ""),
                  { ADD_ATTR: ["target", "rel"] },
                ),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`flex flex-col md:flex-row min-h-screen bg-white ${
        isFullscreen ? "fixed inset-0 z-50 mt-0" : "mt-16"
      }`}
    >
      {!isFullscreen && (
        <aside className="md:w-1/4 bg-white border-r shadow-sm p-4 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search in book..."
              className="w-full p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {chapters.map((ch) => (
            <div key={ch.id} className="mb-2">
              <button
                onClick={() => toggleChapter(ch.id)}
                className="w-full text-left font-bold py-2 px-2 hover:bg-gray-50 rounded-md flex justify-between items-center transition-colors"
              >
                <span className="truncate">{ch.title}</span>

                {expandedChapter === ch.id ? (
                  <FaChevronDown size={12} />
                ) : (
                  <FaChevronRight size={12} />
                )}
              </button>

              {expandedChapter === ch.id && renderTopics(ch.children || [])}
            </div>
          ))}
        </aside>
      )}

      <main className="flex-1 flex flex-col bg-gray-100">
        <div className="flex justify-between items-center px-6 py-3 bg-white border-b shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
              onClick={() => handleTopicClick(prevTopic)}
              disabled={!prevTopic}
            >
              <FaChevronLeft />
            </button>

            <button
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
              onClick={() => handleTopicClick(nextTopic)}
              disabled={!nextTopic}
            >
              <FaChevronRight />
            </button>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center bg-gray-100 rounded-lg px-2">
              <button onClick={handleZoomOut}>
                <FaSearchMinus />
              </button>

              <span className="w-16 text-center font-mono text-sm font-bold">
                {zoom}%
              </span>

              <button onClick={handleZoomIn}>
                <FaSearchPlus />
              </button>
            </div>

            <button onClick={toggleFullScreen}>
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>

            <button>
              <FaFilePdf />
            </button>
          </div>
        </div>

        <div className="py-4 text-center bg-white border-b">
          <h1 className="text-xl font-bold">
            {bookInfo?.responsedata?.title || "Loading Book..."}
          </h1>

          <p className="text-xs text-gray-500">
            {bookInfo?.responsedata?.author
              ? `By ${bookInfo.responsedata.author}`
              : ""}
          </p>

          {/* ✅ OPTIONAL IMAGE SAFE RENDER */}
          {bookInfo?.responsedata?.image && (
            <img
              src={getImageUrl(bookInfo.responsedata.image)}
              onError={(e) => (e.target.src = FALLBACK_IMAGE)}
              alt="book"
              className="mx-auto mt-2 w-32"
            />
          )}
        </div>

        {renderA4Sheets()}
      </main>
    </div>
  );
}
