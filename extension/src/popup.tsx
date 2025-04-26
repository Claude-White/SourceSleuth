import "./styles.css";

import React from "react";

import myIcon from "~assets/logo.svg";

function IndexPopup() {
    return (
        <div className="p-4 h-72 w-96">
            <div className="flex items-end gap-1">
                <img src={myIcon} className="w-8" alt="My Icon" />
                <h1 className="text-xl font-bold">Source Sleuth</h1>
            </div>
        </div>
    );
}

export default IndexPopup;
