import "./styles.css";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Storage } from "@plasmohq/storage";

import Logo from "~assets/logo.svg";
import myIcon from "~assets/logo.svg";

import { ClaimDetails } from "./ClaimDetails";
import { ClaimList } from "./ClaimList";
import type { User } from "./types/User";

interface GeminiResponse {
  summary: string;
  rating: string;
  explanation: string;
  sources: string[];
}

// Define Status enum
enum Status {
  UNHIGHLIGHTED,
  HIGHLIGHTED,
  COMPLETED,
}
function IndexPopup() {
  enum Status {
    UNHIGHLIGHTED = "Highlight Any Information",
    HIGHLIGHTED = "Selected Text",
    COMPLETED = "Results",
  }

  const apiBaseUrl = process.env.PLASMO_PUBLIC_API_BASE_URL;

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"input" | "history">("input");
  const [inputText, setInputText] = useState("");
  const [highlightedText, setHighlightedText] = useState("");
  const [submitted, setIsSubmitted] = useState(false);
  const [status, setStatus] = useState(Status.UNHIGHLIGHTED);
  const [title, setTitle] = useState("Highlight Any Information");
  const [response, setResponse] = useState(null);

  const storage = new Storage();

  useEffect(() => {
    chrome.storage.local.get("highlightedText", (result) => {
      if (result.highlightedText) {
        setHighlightedText(result.highlightedText);
      }
    });
  }, []);

  const handleCheckNow = async (): Promise<void> => {
    if (!highlightedText || submitted) return;

    setIsSubmitted(true);

    try {
      // Get the current URL
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentUrl = tab.url || "";

      // Make request to Gemini API endpoint
      const response = await fetch(`${apiBaseUrl}/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: highlightedText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      setResponse(data);

      // If we have a user, add this to their claims history
      if (user && user._id) {
        // Save to user's claim history
        await fetch(`${apiBaseUrl}/users/${user._id}/claims`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              text: highlightedText,
              feedback: data,
              url: currentUrl,
            },
          ]),
        });
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error submitting to Gemini:", err);
    } finally {
      setIsSubmitted(false);
    }
  };

  useEffect(() => {
    // On popup open, get the last highlighted text
    chrome.storage.local.get("highlightedText", (result) => {
      if (result.highlightedText) {
        setHighlightedText(result.highlightedText);
      }
    });

    // Listen for new highlights while popup is open
    const handler = (message) => {
      if (message.type === "HIGHLIGHTED_TEXT") {
        setHighlightedText(message.text);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  useEffect(() => {
    if (response) setStatus(Status.COMPLETED);
  }, [response]);

  useEffect(() => {
    if (highlightedText) setStatus(Status.HIGHLIGHTED);
    else setStatus(Status.UNHIGHLIGHTED);
  }, [highlightedText]);

  useEffect(() => {
    if (status === Status.UNHIGHLIGHTED) {
      setTitle("Highlight Any Information");
    } else if (status === Status.HIGHLIGHTED) {
      setTitle("Selected Text");
    } else if (status === Status.COMPLETED) {
      setTitle("Results");
    }
  }, [status]);

  useEffect(() => {
    const handler = (message) => {
      if (message.type === "HIGHLIGHTED_TEXT") {
        setHighlightedText(message.text);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        let userId = (await storage.get("userId")) ?? null;
        if (userId == null) {
          const response = await fetch(`${apiBaseUrl}/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ claims: [] }),
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: User = await response.json();
          if (data._id == null) {
            throw new Error(`No user id`);
          }
          await storage.set("userId", data._id);
          userId = data._id;
          setUser((prevUser) => ({
            ...prevUser,
            _id: data._id,
          }));
        }
        const response = await fetch(`${apiBaseUrl}/users/${userId}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data: User = await response.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [viewMode]);

  function renderHistory() {
    if (loading)
      return (
        <div className="flex items-center justify-center h-32 text-blue-300">
          <span className="mr-2 loading loading-spinner loading-md"></span>
          Loading...
        </div>
      );
    if (error)
      return (
        <div className="flex items-center justify-center h-32 text-red-400">
          Error: {error}
        </div>
      );
    if (!user)
      return (
        <div className="flex items-center justify-center h-32 text-gray-400">
          No history found.
        </div>
      );
    if (user.claims.length === 0)
      return (
        <div className="flex items-center justify-center h-32 text-gray-400">
          History empty.
        </div>
      );
    if (selectedIdx !== null) {
      return (
        <ClaimDetails
          claim={user.claims[selectedIdx]}
          onBack={() => setSelectedIdx(null)}
        />
      );
    }
    return <ClaimList claims={user.claims} onSelect={setSelectedIdx} />;
  }

  function renderInputView() {
    return (
      <div className="flex flex-col justify-between">
        <div className="rounded-xl shadow-inner flex flex-col justify-between">
          <h2 className="text-lg font-semibold text-blue-200">{title}</h2>
          {status === Status.COMPLETED && response ? (
            renderResultView()
          ) : highlightedText ? (
            <p className="h-24 overflow-hidden text-base italic text-gray-300 line-clamp-3 rounded">
              {`"${highlightedText}"`}
            </p>
          ) : (
            <p className="h-28 overflow-hidden text-base text-gray-400 line-clamp-3 rounded overflow-y-scroll">
              Simply highlight any text on a website you suspect of being false,
              inaccurate or biased, and click the button below to determine the
              legitimacy.
            </p>
          )}
        </div>

        {status !== Status.COMPLETED && (
          <button
            onClick={handleCheckNow}
            className="w-full py-3 font-semibold text-white transition bg-blue-500 rounded-lg shadow hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!highlightedText || submitted}
          >
            <span className="flex items-center justify-center gap-2">
              {submitted ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Search strokeWidth={2} width={20} height={20} />
              )}
              {submitted ? "Investigating" : "Check Now"}
            </span>
          </button>
        )}

        {status === Status.COMPLETED && (
          <button
            onClick={() => {
              setResponse(null);
              setStatus(Status.HIGHLIGHTED);
            }}
            className="w-full py-3 mt-2 font-semibold text-white transition bg-gray-700 rounded-lg shadow hover:bg-gray-600"
          >
            <span className="flex items-center justify-center gap-2">
              <Search strokeWidth={2} width={20} height={20} />
              Check Another Claim
            </span>
          </button>
        )}
      </div>
    );
  }

  function renderResultView(): JSX.Element | null {
    if (!response) return null;

    return (
      <div className="mt-2 overflow-y-auto max-h-40 bg-[#23272f] rounded-lg p-3">
        <div className="mb-2">
          <span className="font-bold text-gray-200">Accuracy Rating: </span>
          <span
            className={
              Number(response.rating) > 70
                ? "text-green-400 font-bold"
                : Number(response.rating) > 40
                  ? "text-yellow-400 font-bold"
                  : "text-red-400 font-bold"
            }
          >
            {response.rating}/100
          </span>
        </div>
        <p className="mb-2 text-sm">
          <span className="font-bold text-gray-200">Summary: </span>
          <span className="text-gray-100">{response.summary}</span>
        </p>
        <p className="text-sm">
          <span className="font-bold text-gray-200">Explanation: </span>
          <span className="text-gray-100">{response.explanation}</span>
        </p>
        {response.sources && response.sources.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-bold text-gray-200">Sources:</p>
            <ul className="pl-5 text-xs list-disc">
              {response.sources.map((source: string, index: number) => (
                <li key={index} className="truncate">
                  <a
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 break-all hover:underline"
                  >
                    {source}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  function renderContent() {
    if (viewMode === "history") {
      return renderHistory();
    } else {
      return renderInputView();
    }
  }

  const toggleButton = (
    <button
      onClick={() => setViewMode(viewMode === "input" ? "history" : "input")}
      className="px-4 py-1 text-sm font-medium text-white transition bg-blue-600 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {viewMode === "input" ? "History" : "Back"}
    </button>
  );

  const header = (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <img
          src={myIcon}
          className="rounded-lg shadow w-9 h-9"
          alt="Source Sleuth Icon"
        />
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Source Sleuth
        </h1>
      </div>
      {toggleButton}
    </div>
  );

  if (
    status === Status.HIGHLIGHTED ||
    status === Status.UNHIGHLIGHTED ||
    status === Status.COMPLETED
  ) {
    return (
      <div className="bg-[#23272f] min-h-[22rem] w-[26rem] p-5 rounded-2xl shadow-2xl flex flex-col">
        {header}
        <div className="flex flex-col flex-1 gap-4">{renderContent()}</div>
      </div>
    );
  } else {
    return (
      <div className="h-72 w-96 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <img src={myIcon} className="w-8" alt="My Icon" />
            <h1 className="text-2xl font-bold">Source Sleuth</h1>
          </div>
          <div className="flex items-center gap-2">{toggleButton}</div>
        </div>
        {renderContent()}
      </div>
    );
  }
}

export default IndexPopup;
