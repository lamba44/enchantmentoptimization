import React from "react";
import "./App.css";

const App = () => {
    const [selectedCat, setSelectedCat] = React.useState(null);
    const [selectedSub, setSelectedSub] = React.useState(null);

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
                                most optimal enchanting order{" "}
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
                                Java Edition Only!
                            </span>
                        </div>

                        <a href="/guide" className="guidebtn">
                            Learn How It Works
                        </a>
                    </div>
                </div>

                <div className="bottomsect">
                    <div className="botleft">
                        {(() => {
                            const subcats = {
                                Armor: [
                                    "Helmet",
                                    "Chestplate",
                                    "Leggings",
                                    "Boots",
                                ],
                                Weapons: [
                                    "Sword",
                                    "Axe",
                                    "Bow",
                                    "Crossbow",
                                    "Trident",
                                    "Mace",
                                ],
                                Tools: [
                                    "Pickaxe",
                                    "Shovel",
                                    "Hoe",
                                    "Fishing Rod",
                                ],
                                Others: [
                                    "Shield",
                                    "Elytra",
                                    "Shears",
                                    "Flint and Steel",
                                ],
                            };

                            return (
                                <>
                                    <div className="cat-select">
                                        {Object.keys(subcats).map((cat) => (
                                            <button
                                                key={cat}
                                                className={`cat-btn ${
                                                    selectedCat === cat
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() => {
                                                    if (selectedCat === cat) {
                                                        setSelectedCat(null);
                                                        setSelectedSub(null);
                                                    } else {
                                                        setSelectedCat(cat);
                                                        setSelectedSub(null);
                                                    }
                                                }}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    <div
                                        className={`subcat-select subcat-container ${
                                            selectedCat ? "visible" : "hidden"
                                        }`}
                                    >
                                        {selectedCat &&
                                            subcats[selectedCat].map((sub) => (
                                                <button
                                                    key={sub}
                                                    className={`subcat-btn ${
                                                        selectedSub === sub
                                                            ? "active"
                                                            : ""
                                                    }`}
                                                    onClick={() => {
                                                        if (
                                                            selectedSub === sub
                                                        ) {
                                                            setSelectedSub(
                                                                null
                                                            );
                                                        } else {
                                                            setSelectedSub(sub);
                                                        }
                                                    }}
                                                >
                                                    {sub}
                                                </button>
                                            ))}
                                    </div>

                                    <div className="slots-area">
                                        <div className="slot target-slot">
                                            {selectedSub || "Select item"}
                                        </div>

                                        <div className="plus-sign">+</div>

                                        <div className="slot sacrifice-slot">
                                            Select sacrifice...
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
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
