import React from "react";

import type { Claim } from "./types/User";

import "./styles.css";

export const ClaimList: React.FC<{
  claims: Claim[];
  onSelect: (idx: number) => void;
}> = ({ claims, onSelect }) => (
  <div className="flex flex-col w-full bg-[#23272f] rounded-xl shadow-lg border border-gray-700">
    <div className="w-full overflow-y-auto max-h-[262px]">
      {claims.map((claim, idx) => (
        <button
          key={idx}
          className={[
            "w-full text-left px-4 py-3 transition-colors cursor-pointer focus:outline-none",
            "hover:bg-blue-900/40 focus:bg-blue-900/60",
            idx === 0 ? "rounded-t-xl" : "",
            idx === claims.length - 1 ? "rounded-b-xl" : "",
            idx !== claims.length - 1 ? "border-b border-gray-700" : "",
          ].join(" ")}
          onClick={() => onSelect(idx)}
          aria-label={`View claim from ${claim.url}`}
        >
          <span className="block text-sm text-gray-100 truncate">
            {claim.url}
          </span>
          <span className="block mt-1 text-xs italic text-gray-400 truncate">
            {claim.text.slice(0, 80)}
            {claim.text.length > 80 ? "..." : ""}
          </span>
        </button>
      ))}
    </div>
  </div>
);
