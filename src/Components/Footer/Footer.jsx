import React from "react";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="appfooter" role="contentinfo">
            <div className="footertext">
                <p className="footertop">
                    More useful tools and optimizers are planned and coming
                    soon.
                </p>

                <p className="footermid">
                    If this enchantment optimizer helped you, consider
                    supporting my work or getting in touch.
                </p>

                <p className="footerbot">
                    <a
                        href="https://buymeacoffee.com/codewithbottle"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Buy Me a Coffee
                    </a>
                </p>

                <p className="footerbot">
                    <a
                        href="https://github.com/lamba44"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        GitHub
                    </a>
                </p>

                <p className="footerbot">
                    <a href="mailto:codewithbottle@gmail.com">
                        codewithbottle@gmail.com
                    </a>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
