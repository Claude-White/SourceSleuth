import React from "react"

import type { Claim } from "./types/User"

import "./styles.css"

export const ClaimDetails: React.FC<{
  claim: Claim
  onBack: () => void
}> = ({ claim, onBack }) => (
  <div>
    <button className="mb-4 rounded-lg btn btn-neutral" onClick={onBack}>
      ← Back
    </button>

    <div className="w-full max-w-2xl overflow-hidden border shadow-xl bg-base-200 rounded-2xl border-base-100">
      <div className="p-8">
        <div className="mb-6">
          <h2 className="pb-1 mb-3 text-xl font-semibold border-b border-accent/30 text-info">
            Claim
          </h2>
          <p className="text-lg leading-relaxed">{claim.text}</p>
        </div>

        <div className="pt-6 mb-6 border-t border-base-100">
          <h2 className="pb-1 mb-3 text-xl font-semibold border-b border-accent/30 text-info">
            Feedback
          </h2>
          <p className="text-lg leading-relaxed">{claim.feedback}</p>
        </div>

        <div className="pt-6 border-t border-base-100">
          <h2 className="pb-1 mb-3 text-xl font-semibold border-b border-accent/30 text-info">
            Source
          </h2>
          <a
            href={claim.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-blue-500 underline break-words transition-colors duration-200 hover:text-blue-400">
            {claim.url}
          </a>
        </div>
      </div>
    </div>
  </div>
)
