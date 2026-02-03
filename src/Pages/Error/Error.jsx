import React from "react";
import "./Error.css";
import Footer from "../../Components/Footer/Footer";

const Error = () => {
    return (
        <div className="container">
            <div className="errorpage">
                <h1>PAGE NOT FOUND</h1>
                <div className="tool-actions">
                    <a href="/" className="headerbtn">
                        Back to Tool
                    </a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Error;
