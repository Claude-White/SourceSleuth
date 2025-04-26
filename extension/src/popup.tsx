import "./styles.css"

import { useEffect, useState } from "react"

import myIcon from "~assets/logo.svg"

function IndexPopup() {
  const [data, setData] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setData(params.get("data") || "")
  }, [])
  return (
    <div className="p-4 h-72 w-96">
      <div className="flex items-end gap-1">
        <img src={myIcon} className="w-8" alt="My Icon" />
        <h1 className="text-xl font-bold">Source Sleuth</h1>
      </div>
      <h1>Received Data:</h1>
      <p>{data}</p>
    </div>
  )
}

export default IndexPopup
