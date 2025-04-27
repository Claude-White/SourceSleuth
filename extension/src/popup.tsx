import "./styles.css"

import { Search } from "lucide-react"
import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import Logo from "~assets/logo.svg"
import myIcon from "~assets/logo.svg"

import { ClaimDetails } from "./ClaimDetails"
import { ClaimList } from "./ClaimList"
import type { User } from "./types/User"

interface GeminiResponse {
  summary: string
  rating: string
  explanation: string
  sources: string[]
}

// Define Status enum
enum Status {
  UNHIGHLIGHTED,
  HIGHLIGHTED,
  COMPLETED
}
function IndexPopup() {
  enum Status {
    UNHIGHLIGHTED = "Highlight Any Information",
    HIGHLIGHTED = "Selected Text",
    COMPLETED = "Results"
  }

  const apiBaseUrl = process.env.PLASMO_PUBLIC_API_BASE_URL

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"input" | "history">("input")
  const [inputText, setInputText] = useState("")
  const [highlightedText, setHighlightedText] = useState("")
  const [submitted, setIsSubmitted] = useState(false)
  const [status, setStatus] = useState(Status.UNHIGHLIGHTED)
  const [title, setTitle] = useState("Highlight Any Information")
  const [response, setResponse] = useState(null)

  const storage = new Storage()

  useEffect(() => {
    chrome.storage.local.get("highlightedText", (result) => {
      if (result.highlightedText) {
        setHighlightedText(result.highlightedText)
      }
    })
  }, [])

  const handleCheckNow = async (): Promise<void> => {
    if (!highlightedText || submitted) return

    setIsSubmitted(true)

    try {
      // Get the current URL
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })
      const currentUrl = tab.url || ""

      // Make request to Gemini API endpoint
      const response = await fetch(`${apiBaseUrl}/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: highlightedText })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: GeminiResponse = await response.json()
      setResponse(data)

      // If we have a user, add this to their claims history
      if (user && user._id) {
        // Save to user's claim history
        await fetch(`${apiBaseUrl}/users/${user._id}/claims`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify([
            {
              text: highlightedText,
              feedback: data,
              url: currentUrl
            }
          ])
        })
      }
    } catch (err: any) {
      setError(err.message)
      console.error("Error submitting to Gemini:", err)
    } finally {
      setIsSubmitted(false)
    }
  }

  useEffect(() => {
    // On popup open, get the last highlighted text
    chrome.storage.local.get("highlightedText", (result) => {
      if (result.highlightedText) {
        setHighlightedText(result.highlightedText)
      }
    })

    // Listen for new highlights while popup is open
    const handler = (message) => {
      if (message.type === "HIGHLIGHTED_TEXT") {
        setHighlightedText(message.text)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  useEffect(() => {
    if (response) setStatus(Status.COMPLETED)
  }, [response])

  useEffect(() => {
    if (highlightedText) setStatus(Status.HIGHLIGHTED)
    else setStatus(Status.UNHIGHLIGHTED)
  }, [highlightedText])

  useEffect(() => {
    if (status === Status.UNHIGHLIGHTED) {
      setTitle("Highlight Any Information")
    } else if (status === Status.HIGHLIGHTED) {
      setTitle("Selected Text")
    } else if (status === Status.COMPLETED) {
      setTitle("Results")
    }
  }, [status])

  useEffect(() => {
    const handler = (message) => {
      if (message.type === "HIGHLIGHTED_TEXT") {
        setHighlightedText(message.text)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        let userId = (await storage.get("userId")) ?? null
        if (userId == null) {
          const response = await fetch(`${apiBaseUrl}/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ claims: [] })
          })
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data: User = await response.json()
          if (data._id == null) {
            throw new Error(`No user id`)
          }
          await storage.set("userId", data._id)
          userId = data._id
          setUser((prevUser) => ({
            ...prevUser,
            _id: data._id
          }))
        }
        const response = await fetch(`${apiBaseUrl}/users/${userId}`)
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        const data: User = await response.json()
        setUser(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [viewMode])

  function renderHistory() {
    if (loading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>
    if (!user) return <div>No history found.</div>
    if (user.claims.length == 0) return <div>History empty.</div>
    if (selectedIdx !== null) {
      return (
        <ClaimDetails
          claim={user.claims[selectedIdx]}
          onBack={() => setSelectedIdx(null)}
        />
      )
    }
    return <ClaimList claims={user.claims} onSelect={setSelectedIdx} />
  }

  function renderInputView() {
    return (
      <>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {status === Status.COMPLETED && response ? (
            renderResultView()
          ) : highlightedText ? (
            <p className="h-24 overflow-hidden text-base italic text-gray-400 line-clamp-3">
              {`"${highlightedText}"`}
            </p>
          ) : (
            <p className="h-24 overflow-hidden text-base text-gray-400 line-clamp-3">
              Simply highlight any text on a website you suspect of being false,
              inaccurate or biased, and click the button below to determine the
              legitimacy.
            </p>
          )}
        </div>

        {status !== Status.COMPLETED && (
          <button
            onClick={handleCheckNow}
            className="w-full rounded-lg btn btn-primary shadow-none bg-[#D9D9D9] border-none text-black font-normal p-6"
            disabled={!highlightedText || submitted}>
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
              setResponse(null)
              setStatus(Status.HIGHLIGHTED)
            }}
            className="w-full rounded-lg btn btn-primary shadow-none bg-[#D9D9D9] border-none text-black font-normal p-6 mt-2">
            <span className="flex items-center justify-center gap-2">
              <Search strokeWidth={2} width={20} height={20} />
              Check Another Claim
            </span>
          </button>
        )}
      </>
    )
  }

  function renderResultView(): JSX.Element | null {
    if (!response) return null

    return (
      <div className="mt-2 overflow-y-auto max-h-40">
        <div className="mb-2">
          <span className="font-bold">Accuracy Rating: </span>
          <span
            className={`${Number(response.rating) > 70 ? "text-green-500" : Number(response.rating) > 40 ? "text-yellow-500" : "text-red-500"}`}>
            {response.rating}/100
          </span>
        </div>
        <p className="mb-2 text-sm">
          <span className="font-bold">Summary: </span>
          {response.summary}
        </p>
        <p className="text-sm">
          <span className="font-bold">Explanation: </span>
          {response.explanation}
        </p>
        {response.sources && response.sources.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-bold">Sources:</p>
            <ul className="pl-5 text-xs list-disc">
              {response.sources.map((source: string, index: number) => (
                <li key={index} className="truncate">
                  <a
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline">
                    {source}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  function renderContent() {
    if (viewMode === "history") {
      return renderHistory()
    } else {
      return renderInputView()
    }
  }

  const toggleButton = (
    <button
      onClick={() => setViewMode(viewMode === "input" ? "history" : "input")}
      className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
      {viewMode === "input" ? "History" : "Back"}
    </button>
  )

  if (
    status === Status.HIGHLIGHTED ||
    status === Status.UNHIGHLIGHTED ||
    status === Status.COMPLETED
  ) {
    return (
      <div className="bg-[#474747] p-4 h-auto min-h-72 w-96 flex flex-col justify-between">
        <div className="flex items-end gap-1">
          <img src={myIcon} className="w-8" alt="My Icon" />
          <h1 className="text-2xl font-bold">Source Sleuth</h1>
        </div>

        <div className="flex items-center gap-2">{toggleButton}</div>
        {renderContent()}
      </div>
    )
  } else {
    return (
      <div className="bg-[#474747] p-4 h-72 w-96 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <img src={myIcon} className="w-8" alt="My Icon" />
            <h1 className="text-2xl font-bold">Source Sleuth</h1>
          </div>
          <div className="flex items-center gap-2">{toggleButton}</div>
        </div>
        {renderContent()}
      </div>
    )
  }
}

export default IndexPopup
