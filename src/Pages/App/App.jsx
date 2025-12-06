// App.jsx
import React from "react";
import "./App.css";
import { itemEnchantMap, conflictMap } from "./../../data/enchantmentData";

const App = () => {
    const [selectedCat, setSelectedCat] = React.useState(null);
    const [selectedSub, setSelectedSub] = React.useState(null);
    // --- Updated default state for sacrifice UI ---
    const [sacMode, setSacMode] = React.useState(null); // Start with no mode selected
    const [sacItem, setSacItem] = React.useState(null);
    const [sacItemEnchants, setSacItemEnchants] = React.useState({});
    const [sacBooks, setSacBooks] = React.useState([]);

    // Get current enchantments based on selected item
    const currentEnchants = selectedSub
        ? itemEnchantMap[selectedSub] || []
        : [];

    // Helper function to check if an enchantment has conflicts with selected ones
    const hasConflict = (enchName) => {
        for (const selectedEnch in sacItemEnchants) {
            if (conflictMap[selectedEnch]?.includes(enchName)) {
                return true;
            }
        }
        return false;
    };

    // --- Automatically sync sacItem to selectedSub ---
    React.useEffect(() => {
        if (selectedSub) {
            setSacItem(selectedSub);
        } else {
            // Reset sacrifice data when target is cleared
            setSacItem(null);
            setSacItemEnchants({});
            setSacBooks([]);
            setSacMode(null); // Reset sacMode when target is cleared
        }
    }, [selectedSub]);

    // --- handlers for sac item enchants ---
    const toggleSacEnchant = (ename) => {
        setSacItemEnchants((prev) => {
            const copy = { ...prev };
            // If enabling, remove any conflicting enchantments
            if (!copy[ename]) {
                for (const existingEnch in copy) {
                    if (conflictMap[ename]?.includes(existingEnch)) {
                        delete copy[existingEnch];
                    }
                }
                copy[ename] = 1; // default level 1
            } else {
                // deselect
                delete copy[ename];
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
                // Remove conflicting enchantments when setting level
                for (const existingEnch in copy) {
                    if (conflictMap[ename]?.includes(existingEnch)) {
                        delete copy[existingEnch];
                    }
                }
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
                                "Too Expensive!"
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
                                            {selectedSub ? (
                                                sacMode ? (
                                                    <>
                                                        {sacMode === "Item" &&
                                                            (sacItem ||
                                                                "Same item type")}
                                                        {sacMode === "Books" &&
                                                            "Books"}
                                                        {sacMode ===
                                                            "Item & Books" && (
                                                            <>
                                                                {sacItem ||
                                                                    "Same item + books"}
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    "Select mode"
                                                )
                                            ) : (
                                                "Select target first"
                                            )}
                                        </div>
                                    </div>
                                    {/* --- Sacrifice UI only appears when target is selected --- */}
                                    {selectedSub && (
                                        <>
                                            <div className="sac-mode-row">
                                                {[
                                                    "Item",
                                                    "Books",
                                                    "Item & Books",
                                                ].map((m) => (
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
                                                ))}
                                            </div>

                                            {/* Prompt to select mode if none is selected */}
                                            {!sacMode && (
                                                <div className="mode-prompt">
                                                    Please select a sacrifice
                                                    mode above
                                                </div>
                                            )}

                                            {/* Sacrifice item editor (shown when mode includes Item) */}
                                            {(sacMode === "Item" ||
                                                sacMode === "Item & Books") && (
                                                <div className="sac-item-editor">
                                                    <div className="sac-item-header">
                                                        <div className="sac-item-title">
                                                            Sacrifice Item:{" "}
                                                            {sacItem}
                                                        </div>
                                                        <div className="sac-item-subtitle">
                                                            Select enchantments
                                                            on the sacrifice{" "}
                                                            {sacItem}
                                                        </div>
                                                    </div>
                                                    <div className="sac-enchants-grid">
                                                        {currentEnchants.map(
                                                            (ench) => {
                                                                const selectedLevel =
                                                                    sacItemEnchants[
                                                                        ench
                                                                            .name
                                                                    ] || 0;
                                                                const isDisabled =
                                                                    !selectedLevel &&
                                                                    hasConflict(
                                                                        ench.name
                                                                    );
                                                                const isActive =
                                                                    !!selectedLevel;

                                                                return (
                                                                    <div
                                                                        key={
                                                                            ench.name
                                                                        }
                                                                        className={`enchant-card ${
                                                                            isActive
                                                                                ? "active"
                                                                                : ""
                                                                        } ${
                                                                            isDisabled
                                                                                ? "disabled"
                                                                                : ""
                                                                        }`}
                                                                        onClick={() => {
                                                                            if (
                                                                                !isDisabled
                                                                            ) {
                                                                                toggleSacEnchant(
                                                                                    ench.name
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div className="enchant-header">
                                                                            <div className="enchant-name">
                                                                                {
                                                                                    ench.name
                                                                                }
                                                                            </div>
                                                                            {isActive && (
                                                                                <div className="enchant-level-indicator">
                                                                                    {
                                                                                        selectedLevel
                                                                                    }
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {isActive && (
                                                                            <div className="level-selector">
                                                                                {Array.from(
                                                                                    {
                                                                                        length: ench.max,
                                                                                    },
                                                                                    (
                                                                                        _,
                                                                                        i
                                                                                    ) =>
                                                                                        i +
                                                                                        1
                                                                                ).map(
                                                                                    (
                                                                                        lvl
                                                                                    ) => (
                                                                                        <button
                                                                                            key={
                                                                                                lvl
                                                                                            }
                                                                                            className={`level-btn ${
                                                                                                selectedLevel ===
                                                                                                lvl
                                                                                                    ? "active"
                                                                                                    : ""
                                                                                            }`}
                                                                                            onClick={(
                                                                                                e
                                                                                            ) => {
                                                                                                e.stopPropagation();
                                                                                                setSacEnchantLevel(
                                                                                                    ench.name,
                                                                                                    lvl
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                lvl
                                                                                            }
                                                                                        </button>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Books editor (shown when mode includes Books) */}
                                            {(sacMode === "Books" ||
                                                sacMode === "Item & Books") && (
                                                <div className="sac-books-editor">
                                                    <div className="books-header">
                                                        <div className="books-title">
                                                            Enchanted Books:
                                                        </div>
                                                        <button
                                                            className="add-book-btn"
                                                            onClick={addBook}
                                                        >
                                                            Add Book
                                                        </button>
                                                    </div>
                                                    <div className="books-grid">
                                                        {sacBooks.length ===
                                                            0 && (
                                                            <div className="no-books">
                                                                Click "Add Book"
                                                                to begin
                                                            </div>
                                                        )}
                                                        {sacBooks.map((b) => {
                                                            const maxLevel =
                                                                (
                                                                    currentEnchants.find(
                                                                        (e) =>
                                                                            e.name ===
                                                                            b.enchant
                                                                    ) || {
                                                                        max: 5,
                                                                    }
                                                                ).max || 5;
                                                            return (
                                                                <div
                                                                    className="book-card"
                                                                    key={b.id}
                                                                >
                                                                    <div className="book-header">
                                                                        <span>
                                                                            Book{" "}
                                                                            {sacBooks.indexOf(
                                                                                b
                                                                            ) +
                                                                                1}
                                                                        </span>
                                                                        <button
                                                                            className="remove-book-btn"
                                                                            onClick={() =>
                                                                                removeBook(
                                                                                    b.id
                                                                                )
                                                                            }
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                    <div className="book-enchant-selector">
                                                                        <select
                                                                            className="book-enchant-select"
                                                                            value={
                                                                                b.enchant
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateBook(
                                                                                    b.id,
                                                                                    "enchant",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                        >
                                                                            {currentEnchants.map(
                                                                                (
                                                                                    e
                                                                                ) => (
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
                                                                    </div>
                                                                    <div className="level-selector">
                                                                        {Array.from(
                                                                            {
                                                                                length: maxLevel,
                                                                            },
                                                                            (
                                                                                _,
                                                                                i
                                                                            ) =>
                                                                                i +
                                                                                1
                                                                        ).map(
                                                                            (
                                                                                lvl
                                                                            ) => (
                                                                                <button
                                                                                    key={
                                                                                        lvl
                                                                                    }
                                                                                    className={`level-btn ${
                                                                                        b.level ===
                                                                                        lvl
                                                                                            ? "active"
                                                                                            : ""
                                                                                    }`}
                                                                                    onClick={() =>
                                                                                        updateBook(
                                                                                            b.id,
                                                                                            "level",
                                                                                            lvl
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        lvl
                                                                                    }
                                                                                </button>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </>
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
