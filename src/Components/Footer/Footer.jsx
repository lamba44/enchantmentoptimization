import React from "react";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="appfooter" role="contentinfo">
            <div className="footertext">
                <p className="footertop">
                    Inspired By{" "}
                    <a
                        href="https://iamcal.github.io/enchant-order/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Cal Henderson's Tool
                    </a>
                </p>
                <p className="footermid">
                    Font By{" "}
                    <a
                        href="https://www.fontspace.com/jdgraphics"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        JDGraphics
                    </a>
                </p>
                <p className="footerbot">
                    More such tools are planned. If this tool helped you,
                    consider supporting me and my projects on{" "}
                    <a
                        href="https://buymeacoffee.com/codewithbottle"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Buy Me a Coffee.
                    </a>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
