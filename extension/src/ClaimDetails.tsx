import React from "react";

import type { Claim } from "./types/User";

import "./styles.css";

export const ClaimDetails: React.FC<{
  claim: Claim;
  onBack: () => void;
}> = ({ claim, onBack }) => (
  <div className="flex flex-col items-center w-full">
    <button
      className="px-4 py-2 mb-4 text-white transition-colors bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
      onClick={onBack}
      aria-label="Back to claim list"
    >
      ← Back
    </button>

    <div className="w-full max-w-xl bg-[#23272f] border border-gray-700 shadow-2xl rounded-2xl overflow-hidden">
      <div className="p-6 sm:p-8">
        {/* Claim Section */}
        <section className="mb-8">
          <h2 className="pb-1 mb-2 text-lg font-bold text-blue-300 border-b border-blue-400/20">
            Claim
          </h2>
          <p className="text-base leading-relaxed text-gray-100 break-words">
            {claim.text}
          </p>
        </section>

        {/* Feedback Section */}
        <section className="mb-8">
          <h2 className="pb-1 mb-2 text-lg font-bold text-blue-300 border-b border-blue-400/20">
            Feedback
          </h2>
          <div className="space-y-2">
            <div>
              <span className="font-semibold text-gray-300">Rating: </span>
              <span
                className={
                  Number(claim.feedback.rating) > 70
                    ? "text-green-400 font-bold"
                    : Number(claim.feedback.rating) > 40
                      ? "text-yellow-400 font-bold"
                      : "text-red-400 font-bold"
                }
              >
                {claim.feedback.rating}/100
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-300">Summary: </span>
              <span className="text-gray-100">{claim.feedback.summary}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-300">Explanation: </span>
              <span className="text-gray-100">
                {claim.feedback.explanation}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-300">Sources: </span>
              <ul className="pl-4 mt-1 space-y-1 list-disc">
                {claim.feedback.sources.map((source, i) => (
                  <li key={i}>
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline break-all transition-colors hover:text-blue-300"
                    >
                      {source}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Source Section */}
        <section>
          <h2 className="pb-1 mb-2 text-lg font-bold text-blue-300 border-b border-blue-400/20">
            Source
          </h2>
          <a
            href={claim.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline break-all transition-colors hover:text-blue-300"
          >
            {claim.url}
          </a>
        </section>
      </div>
    </div>
  </div>
);
