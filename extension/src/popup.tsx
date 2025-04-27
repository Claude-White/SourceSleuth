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

  function renderContent() {
    if (loading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>
    if (!user) return <div>No history found.</div>
    if (user.claims.length == 0) return <div>History empty.</div>
    return <ClaimList claims={user.claims} onSelect={setSelectedIdx} />
  }

  return (
    <div className="p-4 overflow-y-auto w-96 h-96">
      {selectedIdx === null ? (
        <>
          <div className="flex items-end justify-between gap-1 mb-3">
            <h1 className="text-3xl font-bold">Source Sleuth</h1>
            <img className="w-12" src={Logo} alt="Logo" />
          </div>
          <h2 className="mb-1 text-xl font-semibold">Search History</h2>
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
