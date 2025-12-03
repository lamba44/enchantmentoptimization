import React from "react";
import "./App.css";

const App = () => {
    const [selectedCat, setSelectedCat] = React.useState(null);
    const [selectedSub, setSelectedSub] = React.useState(null);

    // --- New state for sacrifice UI ---
    const [sacMode, setSacMode] = React.useState("Item"); // "Item" | "Books" | "Item+Books"
    const [sacItem, setSacItem] = React.useState(null); // name of sacrifice item (string)
    const [sacItemEnchants, setSacItemEnchants] = React.useState({}); // { EnchantName: level or 0 }
    const [sacBooks, setSacBooks] = React.useState([]); // array of { id, enchant, level }

    // Keep sacItem synced to selectedSub when appropriate
    React.useEffect(() => {
        // If user has chosen target item, default sacItem to same type (only if mode includes Item and sacItem is null or was same as previous target)
        if (selectedSub && (sacMode === "Item" || sacMode === "Item+Books")) {
            // Only override if sacItem is null or previously matched old target name
            setSacItem((prev) =>
                prev === null || prev === "" ? selectedSub : prev
            );
        }
    }, [selectedSub, sacMode]);

    // --- Enchant definitions based on category (simple mapping) ---
    const enchantMap = {
        Armor: [
            { name: "Protection", max: 4 },
            { name: "Fire Protection", max: 4 },
            { name: "Projectile Protection", max: 4 },
            { name: "Respiration", max: 3 },
        ],
        Weapons: [
            { name: "Sharpness", max: 5 },
            { name: "Smite", max: 5 },
            { name: "Looting", max: 3 },
            { name: "Unbreaking", max: 3 },
        ],
        Tools: [
            { name: "Efficiency", max: 5 },
            { name: "Fortune", max: 3 },
            { name: "Unbreaking", max: 3 },
            { name: "Silk Touch", max: 1 },
        ],
        Others: [
            { name: "Mending", max: 1 },
            { name: "Unbreaking", max: 3 },
            { name: "Curse of Vanishing", max: 1 },
        ],
    };

    // Helper: get enchants for currently selectedCat (fallback to Others)
    const currentEnchants =
        enchantMap[selectedCat] || enchantMap["Others"] || [];

    // --- handlers for sac item enchants ---
    const toggleSacEnchant = (ename) => {
        setSacItemEnchants((prev) => {
            const copy = { ...prev };
            if (copy[ename]) {
                // deselect
                delete copy[ename];
            } else {
                copy[ename] = 1; // default level 1
            }
            return copy;
        });
    };

    const setSacEnchantLevel = (ename, lvl) => {
        setSacItemEnchants((prev) => {
            const copy = { ...prev };
            if (lvl <= 0) {
                delete copy[ename];
            } else {
                copy[ename] = lvl;
            }
            return copy;
        });
    };

    // --- handlers for books ---
    const addBook = () => {
        const newBook = {
            id: Date.now() + Math.random(),
            enchant: currentEnchants.length
                ? currentEnchants[0].name
                : "Custom",
            level: 1,
        };
        setSacBooks((prev) => [...prev, newBook]);
    };

    const updateBook = (id, field, value) => {
        setSacBooks((prev) =>
            prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
        );
    };

    const removeBook = (id) => {
        setSacBooks((prev) => prev.filter((b) => b.id !== id));
    };

    // --- resetting sacrificial data when mode changes or target cleared? optional small cleanup ---
    React.useEffect(() => {
        if (sacMode === "Books") {
            // we may want sacItem cleared visually
            // but keep sacItem state; UI will hide it
        }
    }, [sacMode]);

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
                                    {/* Category buttons */}
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

                                    {/* Subcategory container always rendered */}
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

                                    {/* Slots ALWAYS visible */}
                                    <div className="slots-area">
                                        <div className="slot target-slot">
                                            {selectedSub || "Select item"}
                                        </div>

                                        <div className="plus-sign">+</div>

                                        <div
                                            className="slot sacrifice-slot"
                                            title="Select sacrifice mode below"
                                        >
                                            {sacMode === "Item" &&
                                                (sacItem ||
                                                    "Select sacrifice item")}
                                            {sacMode === "Books" && "Books"}
                                            {sacMode === "Item+Books" && (
                                                <>
                                                    {sacItem ||
                                                        "Select item + books"}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* --- Sacrifice mode selector + editors --- */}
                                    <div className="sac-mode-row">
                                        {["Item", "Books", "Item+Books"].map(
                                            (m) => (
                                                <button
                                                    key={m}
                                                    className={`sac-mode-btn ${
                                                        sacMode === m
                                                            ? "active"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        setSacMode(m)
                                                    }
                                                >
                                                    {m}
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {/* Sacrifice item editor (shown when mode includes Item) */}
                                    {(sacMode === "Item" ||
                                        sacMode === "Item+Books") && (
                                        <div className="sac-item-editor">
                                            <div className="sac-item-row">
                                                <label className="sac-label">
                                                    Sacrifice Item:
                                                </label>
                                                <input
                                                    className="sac-item-input"
                                                    value={sacItem || ""}
                                                    placeholder={
                                                        selectedSub
                                                            ? `Default: ${selectedSub}`
                                                            : "Type item name"
                                                    }
                                                    onChange={(e) =>
                                                        setSacItem(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <button
                                                    className="clear-sac-item"
                                                    onClick={() =>
                                                        setSacItem(null)
                                                    }
                                                >
                                                    Clear
                                                </button>
                                            </div>

                                            <div className="sac-enchants-list">
                                                <div className="sac-enchants-title">
                                                    Enchantments on sacrifice
                                                    item:
                                                </div>

                                                {currentEnchants.map((ench) => {
                                                    const selectedLevel =
                                                        sacItemEnchants[
                                                            ench.name
                                                        ] || 0;
                                                    return (
                                                        <div
                                                            key={ench.name}
                                                            className="enchant-row"
                                                        >
                                                            <label className="enchant-toggle">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        !!selectedLevel
                                                                    }
                                                                    onChange={() =>
                                                                        toggleSacEnchant(
                                                                            ench.name
                                                                        )
                                                                    }
                                                                />
                                                                <span className="enchant-name">
                                                                    {ench.name}
                                                                </span>
                                                            </label>

                                                            <select
                                                                className="enchant-level"
                                                                value={
                                                                    selectedLevel ||
                                                                    0
                                                                }
                                                                onChange={(e) =>
                                                                    setSacEnchantLevel(
                                                                        ench.name,
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                            >
                                                                <option
                                                                    value={0}
                                                                >
                                                                    0
                                                                </option>
                                                                {Array.from(
                                                                    {
                                                                        length: ench.max,
                                                                    },
                                                                    (_, i) =>
                                                                        i + 1
                                                                ).map((lvl) => (
                                                                    <option
                                                                        key={
                                                                            lvl
                                                                        }
                                                                        value={
                                                                            lvl
                                                                        }
                                                                    >
                                                                        {lvl}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Books editor (shown when mode includes Books) */}
                                    {(sacMode === "Books" ||
                                        sacMode === "Item+Books") && (
                                        <div className="sac-books-editor">
                                            <div className="books-header">
                                                <div>Enchanted Books:</div>
                                                <button
                                                    className="add-book-btn"
                                                    onClick={addBook}
                                                >
                                                    + Add Book
                                                </button>
                                            </div>

                                            <div className="books-list">
                                                {sacBooks.length === 0 && (
                                                    <div className="no-books">
                                                        No books added
                                                    </div>
                                                )}

                                                {sacBooks.map((b) => {
                                                    const maxLevel =
                                                        (
                                                            currentEnchants.find(
                                                                (e) =>
                                                                    e.name ===
                                                                    b.enchant
                                                            ) || { max: 5 }
                                                        ).max || 5;
                                                    return (
                                                        <div
                                                            className="book-entry"
                                                            key={b.id}
                                                        >
                                                            <select
                                                                className="book-enchant-select"
                                                                value={
                                                                    b.enchant
                                                                }
                                                                onChange={(e) =>
                                                                    updateBook(
                                                                        b.id,
                                                                        "enchant",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            >
                                                                {currentEnchants.map(
                                                                    (e) => (
                                                                        <option
                                                                            key={
                                                                                e.name
                                                                            }
                                                                            value={
                                                                                e.name
                                                                            }
                                                                        >
                                                                            {
                                                                                e.name
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>

                                                            <select
                                                                className="book-level-select"
                                                                value={b.level}
                                                                onChange={(e) =>
                                                                    updateBook(
                                                                        b.id,
                                                                        "level",
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                            >
                                                                {Array.from(
                                                                    {
                                                                        length: maxLevel,
                                                                    },
                                                                    (_, i) =>
                                                                        i + 1
                                                                ).map((lvl) => (
                                                                    <option
                                                                        key={
                                                                            lvl
                                                                        }
                                                                        value={
                                                                            lvl
                                                                        }
                                                                    >
                                                                        {lvl}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            <button
                                                                className="remove-book-btn"
                                                                onClick={() =>
                                                                    removeBook(
                                                                        b.id
                                                                    )
                                                                }
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
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
