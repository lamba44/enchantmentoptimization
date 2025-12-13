import React from "react";
import "./SubHeader.css";

const SubHeader = ({ subHeader }) => {
    return (
        <section>
            <h2 className="subheader">{subHeader}</h2>
        </section>
    );
};

export default SubHeader;
