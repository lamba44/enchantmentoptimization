import React from "react";
import "./App.css";

const App = () => {
    return (
        <div className="container">
            <h1 className="appheader">MINECRAFT ENCHANTING TOOL</h1>
            <div className="bentogrid">
                <div className="topsect">
                    <div className="introbox">
                        <p className="intro-desc">
                            An enchanting calculator that helps you find the
                            <span className="highlight">
                                {" "}
                                most optimal anvil order
                            </span>
                            minimizing XP cost and avoiding the dreaded
                            <span className="dangerword">
                                {" "}
                                “Too Expensive!”
                            </span>{" "}
                            message.
                        </p>

                        <div className="badges">
                            <span className="badge java">
                                Java Edition Only
                            </span>
                            <span className="badge pwp">
                                Assumes items have not been used in an anvil
                                before unless changed
                            </span>
                        </div>

                        <a href="/guide" className="guidebtn">
                            How It Works
                        </a>
                    </div>
                </div>

                <div className="bottomsect">
                    <div className="botleft">
                        select the target tools, and everything else here
                    </div>
                    <div className="botright">
                        {" "}
                        all the results show up here
                    </div>
                </div>
            </div>
            <div className="appfooter">
                <p className="footertext">Footer Xd</p>
            </div>
        </div>
    );
};

export default App;
