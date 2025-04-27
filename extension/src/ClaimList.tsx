import React from "react"

import type { Claim } from "./types/User"

import "./styles.css"

export const ClaimList: React.FC<{
  claims: Claim[]
  onSelect: (idx: number) => void
}> = ({ claims, onSelect }) => (
  <div className="flex flex-col overflow-hidden rounded-md bg-base-200">
    <div className="w-full overflow-y-auto max-h-[262px]">
      {claims.map((claim, idx) => (
        <div
          key={idx}
          className={[
            "p-2 transition cursor-pointer hover:bg-gray-700",
            idx === 0 ? "rounded-t-md" : "",
            idx === claims.length - 1 ? "rounded-b-md" : "",
            idx !== claims.length - 1 ? "border-b border-base-300" : ""
          ].join(" ")}
          onClick={() => onSelect(idx)}>
          <span className="block text-sm text-white truncate">{claim.url}</span>
        </div>
      ))}
    </div>
  </div>
)
