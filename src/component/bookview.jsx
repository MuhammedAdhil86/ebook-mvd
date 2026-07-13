import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../api/Instance";
import CitationContent from "../component/book_reader/CitationContent";
import BookViewMobile from "../responsive/bookviewmobile";
import Controls from "../ui/controls";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import Sidebar from "../component/book_reader/Sidebar";
import { useProtectedStore } from "../store/protectionStore";

const IMAGE_BASE_URL = "https://mvdebook.blr1.digitaloceanspaces.com/media/";
const FALLBACK_IMAGE =
  "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1436194631i/2585989.jpg";

const getImageUrl = (url) => {
  if (!url) return FALLBACK_IMAGE;
  return url.startsWith("http")
    ? url
    : `${IMAGE_BASE_URL}${url.replace(/^\/+/, "")}`;
};

export default function BookReader() {
  const { id: bookId } = useParams();
  const [bookInfo, setBookInfo] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarFullscreen, setIsSidebarFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCitation, setShowCitation] = useState(false);
  const [citationData, setCitationData] = useState({ title: "", body: "" });

  const contentContainerRef = useRef(null);
  const { addProtectedBook, isBookProtected } = useProtectedStore();
  const isProtected = isBookProtected(Number(bookId));

  // Transformation logic: Creates a 3-line string: Title, Header, and Range
  const processedChapters = useMemo(() => {
    return chapters.map((chapter) => {
      if (chapter.children && chapter.children.length > 0) {
        const first = chapter.children[0].title;
        const last = chapter.children[chapter.children.length - 1].title;
        const range = first === last ? first : `${first} - ${last}`;
        return {
          ...chapter,
          // Formats as 3 lines: Title \n Header \n Range
          header: `${chapter.title}\n${chapter.header}\n${range}`,
        };
      }
      return chapter;
    });
  }, [chapters]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes, contentRes] = await Promise.all([
          api.get(`/ebook/cover/${bookId}`),
          api.get(`/ebook-content/${bookId}`),
        ]);
        const data = bookRes.data?.responsedata || null;
        setBookInfo(data);
        setChapters(contentRes.data);
        if (data?.is_protected) addProtectedBook(Number(bookId));
      } catch (error) {
        console.error("Error loading book data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookId, addProtectedBook]);

  useEffect(() => {
    if (!isProtected) return;
    const blockEvent = (e) => {
      e.preventDefault();
      toast.error("Security restriction: Action not allowed.");
    };
    const handleKeydown = (e) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey &&
          ["c", "u", "p", "s", "i"].includes(e.key.toLowerCase())) ||
        e.key === "F12"
      ) {
        blockEvent(e);
      }
    };
    document.addEventListener("contextmenu", blockEvent);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [isProtected]);

  const highlightMatch = (text) => {
    if (!searchQuery) return text;
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
  };

  const searchFilter = (topics) =>
    topics
      .map((topic) => {
        const children = searchFilter(topic.children || []);
        const verifiedText = topic.verified_content
          ? topic.verified_content.replace(/<[^>]*>/g, "").toLowerCase()
          : "";
        const match =
          topic.header.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (topic.title || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          verifiedText.includes(searchQuery.toLowerCase());
        return match || children.length > 0
          ? { ...topic, children, _match: match }
          : null;
      })
      .filter(Boolean);

  const filteredChapters = useMemo(
    () => (searchQuery ? searchFilter(processedChapters) : processedChapters),
    [searchQuery, processedChapters],
  );

  useEffect(() => {
    if (!searchQuery) {
      setExpandedChapters([]);
      return;
    }
    const matchedIds = [];
    const collectMatches = (nodes) => {
      nodes.forEach((n) => {
        if (n._match || (n.children && n.children.length > 0))
          matchedIds.push(n.id);
        if (n.children) collectMatches(n.children);
      });
    };
    collectMatches(filteredChapters);
    setExpandedChapters(matchedIds);
  }, [searchQuery, filteredChapters]);

  const toggleChapter = (id) =>
    setExpandedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  const flattenTopics = (nodes = []) =>
    nodes.flatMap((n) => [n, ...flattenTopics(n.children || [])]);
  const flatTopics = flattenTopics(processedChapters);
  const selectedIndex = flatTopics.findIndex((t) => t.id === selectedTopic?.id);
  const prevTopic = flatTopics[selectedIndex - 1];
  const nextTopic = flatTopics[selectedIndex + 1];

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    if (contentContainerRef.current)
      contentContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 10));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 10));
  const toggleFullScreen = () => setIsFullscreen((fs) => !fs);
  const toggleSidebarFullScreen = () => setIsSidebarFullscreen((fs) => !fs);

  const currentChapter = useMemo(() => {
    if (!selectedTopic) return null;
    return processedChapters.find((chapter) =>
      flattenTopics([chapter]).some((t) => t.id === selectedTopic.id),
    );
  }, [selectedTopic, processedChapters]);

  const handleAddBookmark = async () => {
    const userString = Cookies.get("user");
    const user = userString ? JSON.parse(userString) : null;
    const userId = user?.id || user?.user_id;
    if (!userId) return toast.error("Please login to bookmark.");
    if (!selectedTopic) return toast.error("Select a topic first.");
    try {
      await api.post(`/user/bookmark/create`, {
        user_id: userId,
        book_id: selectedTopic.id,
        info_id: bookId,
      });
      toast.success("Bookmark added!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add bookmark");
    }
  };

  const renderTopics = (topics) => (
    <ul className="pl-4 py-2 space-y-1">
      {topics.map((topic) => (
        <li key={topic.id}>
          <button
            onClick={() => handleTopicClick(topic)}
            className={`block w-full text-left px-2 py-1 rounded ${selectedTopic?.id === topic.id ? "bg-yellow-300 font-bold" : "hover:bg-yellow-100"}`}
          >
            <div className="text-[13px] text-yellow-800 font-medium">
              {highlightMatch(topic.header)}
            </div>
            {topic.title && (
              <div className="text-xs text-gray-500 italic ml-4">
                — {highlightMatch(topic.title)}
              </div>
            )}
          </button>
          {topic.children && renderTopics(topic.children)}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <div className="md:hidden w-full h-screen overflow-hidden">
        <BookViewMobile
          bookData={bookInfo}
          chapters={processedChapters}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          setShowCitation={setShowCitation}
          setCitationData={setCitationData}
        />
      </div>
      <div
        className={`hidden md:flex h-screen overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 bg-white" : "bg-gray-50"}`}
      >
        {!isFullscreen && (
          <Sidebar
            bookInfo={bookInfo}
            chapters={filteredChapters}
            expandedChapters={expandedChapters}
            toggleChapter={toggleChapter}
            renderTopics={renderTopics}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            highlightMatch={highlightMatch}
            isSidebarFullscreen={isSidebarFullscreen}
            toggleSidebarFullScreen={toggleSidebarFullScreen}
          />
        )}
        <div
          className="flex flex-col ml-2 rounded-2xl shadow-xl bg-white my-2 mr-2 overflow-hidden"
          style={{ width: isFullscreen ? "100%" : "75%" }}
        >
          {selectedTopic && (
            <div className="border-b z-10 bg-white">
              <Controls
                prevTopic={prevTopic}
                nextTopic={nextTopic}
                zoom={zoom}
                handleZoomIn={handleZoomIn}
                handleZoomOut={handleZoomOut}
                handleTopicClick={handleTopicClick}
                toggleFullScreen={toggleFullScreen}
                isFullscreen={isFullscreen}
                bookId={bookInfo?.id}
                contentId={selectedTopic?.id}
                onBookmarkClick={handleAddBookmark}
              />
              <div className="bg-yellow-400 text-black font-bold text-center py-2 mx-4 rounded-xl">
                {currentChapter && (
                  <div className="text-lg">{currentChapter.title}</div>
                )}
              </div>
              <div className="text-center font-semibold text-md py-2 text-gray-600 italic">
                {selectedTopic.title} ~{" "}
                {selectedTopic.header.split("\n").join(" ~ ")}
              </div>
            </div>
          )}
          <div
            ref={contentContainerRef}
            className={`relative p-8 overflow-y-auto overflow-x-hidden flex-grow flex justify-center bg-gray-100 ${isProtected ? "select-none" : ""}`}
          >
            {loading ? (
              <p className="mt-20 animate-pulse text-gray-400">
                Loading book content...
              </p>
            ) : selectedTopic ? (
              <div
                className="relative transition-transform duration-200 ease-out origin-top"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                <div
                  className={`bg-white p-16 shadow-lg border border-gray-200 w-[210mm] min-h-[297mm] ${isProtected ? "select-none" : ""}`}
                >
                  <h2 className="text-3xl font-bold mb-4 text-gray-800 border-b pb-2">
                    {highlightMatch(selectedTopic.header)}
                  </h2>
                  {selectedTopic.title && (
                    <h3 className="text-xl italic text-gray-500 mb-6">
                      {highlightMatch(selectedTopic.title)}
                    </h3>
                  )}
                  <CitationContent
                    node={selectedTopic}
                    selectedNodeId={selectedTopic.id}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <img
                  src={getImageUrl(bookInfo?.cover_image)}
                  alt="Cover"
                  className="max-h-[75vh] object-contain rounded-lg shadow-2xl"
                />
                <h1 className="mt-6 text-2xl font-serif font-bold text-gray-800">
                  {bookInfo?.title}
                </h1>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
