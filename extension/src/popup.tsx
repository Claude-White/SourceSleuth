import "./styles.css"

import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import Logo from "~assets/logo.svg"

import { ClaimDetails } from "./ClaimDetails"
import { ClaimList } from "./ClaimList"
import type { User } from "./types/User"

function IndexPopup() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"input" | "history">("input")
  const [inputText, setInputText] = useState("")

  const storage = new Storage()

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        let userId = (await storage.get("userId")) ?? null
        if (userId == null) {
          const response = await fetch("http://localhost:3000/users", {
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
        }
        const response = await fetch(`http://localhost:3000/users/${userId}`)
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
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Implement your claim submission logic here
    console.log("Submitting:", inputText)
    setInputText("")
    // After submitting, you might want to refresh user data
  }

  function renderHistory() {
    if (loading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>
    if (!user) return <div>No history found.</div>
    if (user.claims.length == 0) return <div>History empty.</div>
    return <ClaimList claims={user.claims} onSelect={setSelectedIdx} />
  }

  function renderInputView() {
    return (
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-4">
          <label htmlFor="claim-input" className="block mb-2 font-medium">
            Enter a claim to verify:
          </label>
          <textarea
            id="claim-input"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter the text of a claim you want to verify..."
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Verify Claim
        </button>
      </form>
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

  return (
    <div className="p-4 overflow-y-auto w-96 h-96">
      {selectedIdx === null ? (
        <>
          <div className="flex items-end justify-between gap-1 mb-3">
            <h1 className="text-3xl font-bold">Source Sleuth</h1>
            <div className="flex items-center gap-2">
              {toggleButton}
              <img className="w-12" src={Logo} alt="Logo" />
            </div>
          </div>
          <h2 className="mb-1 text-xl font-semibold">
            {viewMode === "input" ? "Verify a Claim" : "Search History"}
          </h2>
          {renderContent()}
        </>
      ) : (
        <ClaimDetails
          claim={user.claims[selectedIdx]}
          onBack={() => setSelectedIdx(null)}
        />
      )}
    </div>
  )
}

export default IndexPopup