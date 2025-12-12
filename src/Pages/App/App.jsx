// App.jsx
import React from "react";
import "./App.css";
import { itemEnchantMap, conflictMap } from "./../../data/enchantmentData";
import { computeOptimalEnchantPlan } from "./../../data/enchantCalculator";

const App = () => {
    const [selectedCat, setSelectedCat] = React.useState(null);
    const [selectedSub, setSelectedSub] = React.useState(null);
    // --- Updated sacrifice modes ---
    const [sacMode, setSacMode] = React.useState(null); // null | "Books" | "Item & Books"
    const [sacItem, setSacItem] = React.useState(null);
    const [sacItemEnchants, setSacItemEnchants] = React.useState({});
    const [sacBooksEnchants, setSacBooksEnchants] = React.useState({});
    // Added state for existing target item enchantments
    const [existingEnchantsChecked, setExistingEnchantsChecked] =
        React.useState(false);
    const [targetItemEnchants, setTargetItemEnchants] = React.useState({});
    // Error message state
    const [errorMessage, setErrorMessage] = React.useState("");
    // Result state
    const [calculationResult, setCalculationResult] = React.useState(null);

    // Get current enchantments based on selected item
    const currentEnchants = selectedSub
        ? itemEnchantMap[selectedSub] || []
        : [];

    // Helper function to check if an enchantment has conflicts with selected ones
    const hasConflict = (enchName, enchantments) => {
        for (const selectedEnch in enchantments) {
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

            // NEW: when switching to a new selectedSub, clear all per-item enchant selections
            // This prevents enchantments from the previous item (e.g., mace) persisting
            // when the user selects a different target item (e.g., bow).
            setSacItemEnchants({});
            setSacBooksEnchants({});
            setTargetItemEnchants({});
            setExistingEnchantsChecked(false);
            setErrorMessage("");
            setCalculationResult(null);
        } else {
            // Reset everything when target is cleared
            setSacItem(null);
            setSacItemEnchants({});
            setSacBooksEnchants({});
            setSacMode(null);
            setExistingEnchantsChecked(false);
            setTargetItemEnchants({});
            setErrorMessage("");
            setCalculationResult(null);
        }
    }, [selectedSub]);

    // --- handlers for enchantments (generic) ---
    const toggleEnchant = (ename, setEnchants, enchants) => {
        setEnchants((prev) => {
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

    const setEnchantLevel = (ename, lvl, setEnchants) => {
        setEnchants((prev) => {
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

    // Validation and calculation function
    const validateAndCalculate = () => {
        setErrorMessage("");
        setCalculationResult(null);

        // Check if target item is selected
        if (!selectedSub) {
            setErrorMessage("Error: No target item selected.");
            return;
        }

        // Check existing enchantments if checkbox is checked
        if (
            existingEnchantsChecked &&
            Object.keys(targetItemEnchants).length === 0
        ) {
            setErrorMessage(
                "Error: No existing enchantments selected for target item."
            );
            return;
        }

        // Check sacrifice mode is selected
        if (!sacMode) {
            setErrorMessage("Error: No sacrifice mode selected.");
            return;
        }

        // Validate based on sacrifice mode
        if (sacMode === "Books") {
            if (Object.keys(sacBooksEnchants).length === 0) {
                setErrorMessage("Error: No books selected for sacrifice.");
                return;
            }
        } else if (sacMode === "Item & Books") {
            const hasSacrificeEnchants =
                Object.keys(sacItemEnchants).length > 0;
            const hasBooks = Object.keys(sacBooksEnchants).length > 0;
            if (!hasSacrificeEnchants && !hasBooks) {
                setErrorMessage(
                    "Error: No sacrifice enchantments or books selected."
                );
                return;
            }
            if (!hasSacrificeEnchants) {
                setErrorMessage("Error: No sacrifice enchantments selected.");
                return;
            }
            if (!hasBooks) {
                setErrorMessage("Error: No books selected.");
                return;
            }
        }

        // If all validations pass, collect and calculate
        const calculationData = {
            targetItem: selectedSub,
            existingEnchantments: existingEnchantsChecked
                ? targetItemEnchants
                : {},
            sacrificeMode: sacMode,
            sacrificeItem: sacMode === "Item & Books" ? sacItem : null,
            sacrificeEnchantments:
                sacMode === "Item & Books" ? sacItemEnchants : {},
            booksEnchantments:
                sacMode === "Books"
                    ? sacBooksEnchants
                    : sacMode === "Item & Books"
                    ? sacBooksEnchants
                    : {},
        };

        try {
            const result = computeOptimalEnchantPlan(calculationData);
            setCalculationResult(result);
        } catch (error) {
            setErrorMessage(`Calculation error: ${error.message}`);
            console.error("Calculation failed:", error);
        }
    };

    // Format the calculation result for display
    const formatResult = (result) => {
        if (!result) return "";

        if (!result.success) {
            return `Error: ${
                result.reason
            }\nCalculation time: ${result.timeMs.toFixed(2)} ms`;
        }

        let output = `Optimal solution found in ${result.timeMs.toFixed(
            2
        )} ms\n`;
        output += `Total cost: ${result.totalLevels} levels (${result.totalXP} XP)\n\n`;
        output += "Steps:\n";

        if (result.steps.length === 0) {
            output += "No enchanting steps needed.\n";
        } else {
            result.steps.forEach((step, index) => {
                output += `${index + 1}. Combine ${step.left} with ${
                    step.right
                }\n`;
                output += `   Result: ${step.result}\n`;
                output += `   Cost: ${step.levels} levels (${step.xp} XP)`;

                if (step.pw > 0) {
                    output += `, Prior Work Penalty: ${step.pw} level${
                        step.pw === 1 ? "" : "s"
                    }`;
                }

                output += "\n";
            });
        }

        output += `\nFinal item: ${disp(result.finalItem)}`;

        return output;
    };

    // Helper function to display item with enchantments
    const disp = (item) => {
        const e = Object.entries(item.ench)
            .map(([k, v]) => k + " " + toRoman(v))
            .join(", ");
        return item.isBook
            ? "Book" + (e ? " (" + e + ")" : "")
            : item.item + (e ? " (" + e + ")" : "");
    };

    // Helper function to convert numbers to Roman numerals
    const toRoman = (num) => {
        if (num <= 0) return "0";
        const lookup = {
            M: 1000,
            CM: 900,
            D: 500,
            CD: 400,
            C: 100,
            XC: 90,
            L: 50,
            XL: 40,
            X: 10,
            IX: 9,
            V: 5,
            IV: 4,
            I: 1,
        };
        let roman = "";
        for (let i in lookup) {
            while (num >= lookup[i]) {
                roman += i;
                num -= lookup[i];
            }
        }
        return roman;
    };

    // Helper functions for formatting items
    const extractItemName = (itemString) => {
        if (!itemString) return "";
        const match = itemString.match(/^([^(]+)/);
        return match ? match[1].trim() : itemString;
    };

    const extractEnchantments = (itemString) => {
        if (!itemString) return [];
        const match = itemString.match(/\(([^)]+)\)/);
        if (!match) return [];

        return match[1]
            .split(",")
            .map((enchant) => enchant.trim())
            .filter((enchant) => enchant);
    };

    const formatFinalItem = (item) => {
        const e = Object.entries(item.ench)
            .map(([k, v]) => k + " " + toRoman(v))
            .join(", ");
        return item.isBook
            ? "Book" + (e ? " (" + e + ")" : "")
            : item.item + (e ? " (" + e + ")" : "");
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
                                    "Spear",
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
                                    {/* Existing enchantments checkbox for target item */}
                                    {selectedSub && (
                                        <div className="existing-enchants-section">
                                            <label className="existing-enchants-label">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        existingEnchantsChecked
                                                    }
                                                    onChange={(e) => {
                                                        setExistingEnchantsChecked(
                                                            e.target.checked
                                                        );
                                                        if (!e.target.checked) {
                                                            setTargetItemEnchants(
                                                                {}
                                                            );
                                                        }
                                                        setErrorMessage("");
                                                        setCalculationResult(
                                                            null
                                                        );
                                                    }}
                                                />
                                                <span>
                                                    Existing Enchantments on
                                                    Target Item
                                                </span>
                                            </label>
                                            {existingEnchantsChecked && (
                                                <div className="existing-enchants-grid">
                                                    <div className="existing-enchants-title">
                                                        Select existing
                                                        enchantments on your{" "}
                                                        {selectedSub}:
                                                    </div>
                                                    <div className="sac-enchants-grid">
                                                        {currentEnchants.map(
                                                            (ench) => {
                                                                const selectedLevel =
                                                                    targetItemEnchants[
                                                                        ench
                                                                            .name
                                                                    ] || 0;
                                                                const isDisabled =
                                                                    !selectedLevel &&
                                                                    hasConflict(
                                                                        ench.name,
                                                                        targetItemEnchants
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
                                                                                toggleEnchant(
                                                                                    ench.name,
                                                                                    setTargetItemEnchants,
                                                                                    targetItemEnchants
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
                                                                                                setEnchantLevel(
                                                                                                    ench.name,
                                                                                                    lvl,
                                                                                                    setTargetItemEnchants
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
                                        </div>
                                    )}
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
                                                        {sacMode === "Books" &&
                                                            "Enchanted Books"}
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
                                                {["Books", "Item & Books"].map(
                                                    (m) => (
                                                        <button
                                                            key={m}
                                                            className={`sac-mode-btn ${
                                                                sacMode === m
                                                                    ? "active"
                                                                    : ""
                                                            }`}
                                                            onClick={() => {
                                                                setSacMode(m);
                                                                setErrorMessage(
                                                                    ""
                                                                );
                                                                setCalculationResult(
                                                                    null
                                                                );
                                                            }}
                                                        >
                                                            {m}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                            {/* Prompt to select mode if none is selected */}
                                            {!sacMode && (
                                                <div className="mode-prompt">
                                                    Please select a sacrifice
                                                    mode above
                                                </div>
                                            )}
                                            {/* Books editor (shown when mode is Books) */}
                                            {sacMode === "Books" && (
                                                <div className="sac-books-editor">
                                                    <div className="books-header">
                                                        <div className="books-title">
                                                            Books to use:
                                                        </div>
                                                    </div>
                                                    <div className="books-grid">
                                                        {currentEnchants.map(
                                                            (ench) => {
                                                                const selectedLevel =
                                                                    sacBooksEnchants[
                                                                        ench
                                                                            .name
                                                                    ] || 0;
                                                                const isDisabled =
                                                                    !selectedLevel &&
                                                                    hasConflict(
                                                                        ench.name,
                                                                        sacBooksEnchants
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
                                                                                toggleEnchant(
                                                                                    ench.name,
                                                                                    setSacBooksEnchants,
                                                                                    sacBooksEnchants
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
                                                                                                setEnchantLevel(
                                                                                                    ench.name,
                                                                                                    lvl,
                                                                                                    setSacBooksEnchants
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
                                            {/* Item & Books editor */}
                                            {sacMode === "Item & Books" && (
                                                <>
                                                    {/* Sacrifice Item Section */}
                                                    <div className="sac-item-editor">
                                                        <div className="sac-item-header">
                                                            <div className="sac-item-title">
                                                                Sacrifice Item:{" "}
                                                                {sacItem}
                                                            </div>
                                                            <div className="sac-item-subtitle">
                                                                Select
                                                                enchantments on
                                                                the sacrifice
                                                                item
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
                                                                            ench.name,
                                                                            sacItemEnchants
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
                                                                                    toggleEnchant(
                                                                                        ench.name,
                                                                                        setSacItemEnchants,
                                                                                        sacItemEnchants
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
                                                                                                    setEnchantLevel(
                                                                                                        ench.name,
                                                                                                        lvl,
                                                                                                        setSacItemEnchants
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
                                                    {/* Books Section */}
                                                    <div className="sac-books-editor">
                                                        <div className="books-header">
                                                            <div className="books-title">
                                                                Books to use:
                                                            </div>
                                                        </div>
                                                        <div className="books-grid">
                                                            {currentEnchants.map(
                                                                (ench) => {
                                                                    const selectedLevel =
                                                                        sacBooksEnchants[
                                                                            ench
                                                                                .name
                                                                        ] || 0;
                                                                    const isDisabled =
                                                                        !selectedLevel &&
                                                                        hasConflict(
                                                                            ench.name,
                                                                            sacBooksEnchants
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
                                                                                    toggleEnchant(
                                                                                        ench.name,
                                                                                        setSacBooksEnchants,
                                                                                        sacBooksEnchants
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
                                                                                                    setEnchantLevel(
                                                                                                        ench.name,
                                                                                                        lvl,
                                                                                                        setSacBooksEnchants
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
                                                </>
                                            )}
                                        </>
                                    )}
                                    {/* Error message display */}
                                    {errorMessage && (
                                        <div className="error-message">
                                            {errorMessage}
                                        </div>
                                    )}
                                    {/* Calculate button */}
                                    <div className="calculate-section">
                                        <button
                                            className="calculate-btn"
                                            onClick={validateAndCalculate}
                                            disabled={!selectedSub}
                                        >
                                            Calculate
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                    <div className="botright">
                        {calculationResult ? (
                            <div className="calculation-result">
                                {!calculationResult.success ? (
                                    <div className="error-result">
                                        Error: {calculationResult.reason}
                                        <div className="calc-time">
                                            Calculation time:{" "}
                                            {calculationResult.timeMs.toFixed(
                                                2
                                            )}{" "}
                                            ms
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="result-summary">
                                            <div className="summary-cost">
                                                Total Cost:{" "}
                                                {calculationResult.totalLevels}{" "}
                                                Levels (
                                                {calculationResult.totalXP} XP)
                                            </div>
                                            <div className="summary-header">
                                                Solution Found in{" "}
                                                {calculationResult.timeMs.toFixed(
                                                    2
                                                )}{" "}
                                                ms
                                            </div>
                                        </div>

                                        <div className="steps-title">
                                            Follow these steps:
                                        </div>

                                        {calculationResult.steps.length ===
                                        0 ? (
                                            <div className="no-steps">
                                                No enchanting steps needed.
                                            </div>
                                        ) : (
                                            calculationResult.steps.map(
                                                (step, index) => (
                                                    <div
                                                        key={index}
                                                        className="step-container"
                                                    >
                                                        <div className="step-number">
                                                            Step {index + 1}:
                                                        </div>
                                                        <div className="combination-view">
                                                            <div className="item-box">
                                                                <div className="item-name">
                                                                    {extractItemName(
                                                                        step.left
                                                                    )}
                                                                </div>
                                                                <div className="item-enchantments">
                                                                    {extractEnchantments(
                                                                        step.left
                                                                    ).map(
                                                                        (
                                                                            ench,
                                                                            i
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    i
                                                                                }
                                                                                className="enchantment"
                                                                            >
                                                                                {
                                                                                    ench
                                                                                }
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="plus-sign">
                                                                +
                                                            </div>
                                                            <div className="item-box">
                                                                <div className="item-name">
                                                                    {extractItemName(
                                                                        step.right
                                                                    )}
                                                                </div>
                                                                <div className="item-enchantments">
                                                                    {extractEnchantments(
                                                                        step.right
                                                                    ).map(
                                                                        (
                                                                            ench,
                                                                            i
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    i
                                                                                }
                                                                                className="enchantment"
                                                                            >
                                                                                {
                                                                                    ench
                                                                                }
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="result-view">
                                                            <div className="result-label">
                                                                Result:
                                                            </div>
                                                            <div className="item-box result-item">
                                                                <div className="item-name">
                                                                    {extractItemName(
                                                                        step.result
                                                                    )}
                                                                </div>
                                                                <div className="item-enchantments">
                                                                    {extractEnchantments(
                                                                        step.result
                                                                    ).map(
                                                                        (
                                                                            ench,
                                                                            i
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    i
                                                                                }
                                                                                className="enchantment"
                                                                            >
                                                                                {
                                                                                    ench
                                                                                }
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="cost-info">
                                                            Cost: {step.levels}{" "}
                                                            levels ({step.xp}{" "}
                                                            XP)
                                                            {step.pw > 0 && (
                                                                <span className="pw-penalty">
                                                                    {" "}
                                                                    • Prior Work
                                                                    Penalty:{" "}
                                                                    {
                                                                        step.pw
                                                                    }{" "}
                                                                    level
                                                                    {step.pw ===
                                                                    1
                                                                        ? ""
                                                                        : "s"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            )
                                        )}

                                        <div className="final-item-section">
                                            <div className="final-item-label">
                                                Final item:
                                            </div>
                                            <div className="item-box final-item">
                                                <div className="item-name">
                                                    {extractItemName(
                                                        formatFinalItem(
                                                            calculationResult.finalItem
                                                        )
                                                    )}
                                                </div>
                                                <div className="item-enchantments">
                                                    {extractEnchantments(
                                                        formatFinalItem(
                                                            calculationResult.finalItem
                                                        )
                                                    ).map((ench, i) => (
                                                        <div
                                                            key={i}
                                                            className="enchantment"
                                                        >
                                                            {ench}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="result-placeholder">
                                <p>Calculation results will appear here</p>
                                <p>
                                    Select your items and enchantments, then
                                    click "Calculate"
                                </p>
                            </div>
                        )}
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
