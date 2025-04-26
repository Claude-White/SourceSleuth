import "./styles.css"

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import myIcon from "~assets/logo.svg"

function IndexPopup() {
  enum Status {
    UNHIGHLIGHTED = "Highlight Any Information",
    HIGHLIGHTED = "Selected Text",
    COMPLETED = "Results",
  }

  const [submitted, setIsSubmitted] = useState(false);
  const [highlightedText, setHighlightedText] = useState("");
  const [status, setStatus] = useState(Status.UNHIGHLIGHTED);
  const [response, setResponse] = useState(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    // fetch to get the with the highlighted text as payload
  }, [submitted]);

  useEffect(() => {
    if (response) setStatus(Status.COMPLETED)
  }, [response])

  useEffect(() => {
    if (status === Status.UNHIGHLIGHTED) {
      setTitle("Highlight Any Information");
    } else if (status === Status.HIGHLIGHTED) {
      setTitle("Selected Text");
    } else if (status === Status.COMPLETED) {
      setTitle("Results");
    }
  }, [status]);
  

  return (
    <div className="bg-[#474747] p-4 h-72 w-96 flex flex-col justify-between">
      <div className="flex items-end gap-1">
        <img src={myIcon} className="w-8" alt="My Icon" />
        <h1 className="text-2xl font-bold">Source Sleuth</h1>
      </div>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {highlightedText ? (
          <p className="text-base text-gray-400">{highlightedText}</p>
        ) : (
          <p className="text-base text-gray-400">
            Simply highlight any text on a website you suspect of being false,
            inaccurate or biased, and click the button below to determine the
            legitimacy.
          </p>
        )}
      </div>

      <button
        onClick={() => {
          setIsSubmitted(true);
        }}
        className="w-full rounded-lg btn btn-primary shadow-none bg-[#D9D9D9] border-none text-black font-normal p-6"
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
    </div>
  );
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
