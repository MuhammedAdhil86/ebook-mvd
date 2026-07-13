import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import DOMPurify from "dompurify";
import { X, ChevronDown, ChevronUp } from "lucide-react";

const BASE_URL = "https://mvdebook.blr1.digitaloceanspaces.com/";

const rewriteRelativeUrls = (html, baseUrl) => {
  if (!html) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  tempDiv.querySelectorAll("[href], [src]").forEach((el) => {
    const attr = el.hasAttribute("href") ? "href" : "src";
    const url = el.getAttribute(attr);
    if (
      url &&
      !url.startsWith("http") &&
      !url.startsWith("//") &&
      !url.startsWith("#")
    ) {
      el.setAttribute(
        attr,
        `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\/+/, "")}`,
      );
    }
  });
  return tempDiv.innerHTML;
};

const parseAccordion = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || "", "text/html");
  const result = [];
  Array.from(doc.body.childNodes).forEach((node, idx) => {
    if (node.nodeType === 1) {
      if (node.matches(".panel-group, .ck-accordion-wrapper")) {
        const panels = Array.from(
          node.querySelectorAll(".panel.panel-default"),
        );
        result.push({
          type: "accordion",
          panels: panels.map((p, i) => ({
            id: `acc-${idx}-${i}`,
            heading:
              p.querySelector(".panel-heading")?.innerText ||
              `Section ${i + 1}`,
            body: p.querySelector(".panel-body")?.innerHTML || "",
          })),
        });
      } else {
        result.push({ type: "html", content: node.outerHTML });
      }
    } else if (node.nodeType === 3 && node.textContent.trim()) {
      result.push({ type: "html", content: node.textContent });
    }
  });
  return result;
};

const stripHtml = (html) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const CitationContent = ({ node }) => {
  const [blocks, setBlocks] = useState([]);
  const [openPanel, setOpenPanel] = useState(null);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const citationStore = useRef({});

  useEffect(() => {
    if (!node?.verified_content) return;
    let citationCounter = 0;
    const localCitations = {};
    let processed = node.verified_content.replace(
      /~@\[([^\]]+)\]~@([^~]*)~@/g,
      (_, title, content) => {
        const id = `cit-${node.id}-${citationCounter++}`;
        localCitations[id] = { title, content };
        return `<span class="citation-link" data-citation-id="${id}">[${title}]</span>`;
      },
    );

    const temp = document.createElement("div");
    temp.innerHTML = processed;
    temp.querySelectorAll("a[data-content]").forEach((a) => {
      const id = `cit-${node.id}-${citationCounter++}`;
      localCitations[id] = {
        title: a.title,
        content: a.getAttribute("data-content"),
      };
      const span = document.createElement("span");
      span.className = "citation-link";
      span.setAttribute("data-citation-id", id);
      span.textContent = a.textContent;
      a.replaceWith(span);
    });
    citationStore.current[node.id] = localCitations;
    setBlocks(parseAccordion(rewriteRelativeUrls(temp.innerHTML, BASE_URL)));
  }, [node]);

  const handleCitationClick = (e) => {
    const el = e.target.closest(".citation-link");
    if (!el) return;
    const id = el.getAttribute("data-citation-id");
    const citation = citationStore.current[node?.id]?.[id];
    if (citation) {
      setSelectedCitation(citation);
      setIsBottomSheetOpen(true);
    }
  };

  const closeBottomSheet = () => setIsBottomSheetOpen(false);

  return (
    <>
      <style>{`.citation-link { background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 4px; cursor: pointer; text-decoration: underline; }`}</style>

      <div onClick={handleCitationClick}>
        {blocks.map((block, idx) => (
          <div key={idx}>
            {block.type === "html" ? (
              <div
                /* [&>p]:mb-4 adds vertical space between points
                  [&>p]:pl-4 adds horizontal space (indentation) at the start
                */
                className="prose max-w-none text-gray-800 leading-relaxed text-justify [&>p]:mb-4 [&>p]:pl-4"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(block.content, {
                    ADD_ATTR: ["data-citation-id"],
                  }),
                }}
              />
            ) : (
              <div className="mt-4">
                {block.panels.map((p) => (
                  <div key={p.id} className="border rounded-lg mb-2">
                    <button
                      className="w-full flex justify-between p-4 bg-gray-50 font-medium"
                      onClick={() =>
                        setOpenPanel(openPanel === p.id ? null : p.id)
                      }
                    >
                      {p.heading}{" "}
                      {openPanel === p.id ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                    {openPanel === p.id && (
                      <div
                        className="p-4 [&>p]:mb-4 [&>p]:pl-4 text-justify"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(p.body),
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {isBottomSheetOpen &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[999999] flex items-end justify-end"
            onClick={closeBottomSheet}
          >
            <div
              className="bg-white w-full md:w-1/4 rounded-t-lg max-h-[80vh] flex flex-col border border-gray-100 animate-in slide-in-from-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                <div className="w-6 h-1 bg-gray-300 rounded-full mx-auto"></div>
                <h3 className="text-base font-semibold text-gray-800 flex-1 text-center">
                  Citation Details
                </h3>
                <button
                  onClick={closeBottomSheet}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
              {selectedCitation && (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-3">
                    <h4 className="text-md font-bold text-gray-900 mb-1">
                      {stripHtml(selectedCitation.title)}
                    </h4>
                    <div className="h-0.5 w-10 bg-yellow-500 rounded"></div>
                  </div>
                  <div
                    className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-sm"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        rewriteRelativeUrls(
                          selectedCitation.content || "",
                          BASE_URL,
                        ),
                        { ADD_ATTR: ["target", "rel"] },
                      ),
                    }}
                  />
                </div>
              )}
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={closeBottomSheet}
                  className="w-full bg-black text-white py-2 rounded-sm font-medium hover:bg-yellow-700 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default CitationContent;
