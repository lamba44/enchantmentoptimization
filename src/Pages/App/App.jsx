import React from "react";
import "./App.css";
import { itemEnchantMap, conflictMap } from "./../../data/enchantmentData";
import { computeOptimalEnchantPlan } from "./../../data/enchantCalculator";
import Footer from "../../Components/Footer/Footer";

const App = () => {
    const [selectedCat, setSelectedCat] = React.useState(null);
    const [selectedSub, setSelectedSub] = React.useState(null);
    // --- Sacrifice modes ---
    const [sacMode, setSacMode] = React.useState(null); // null | "Books" | "Item & Books"
    const [sacItem, setSacItem] = React.useState(null);
    const [sacItemEnchants, setSacItemEnchants] = React.useState({});
    const [sacBooksEnchants, setSacBooksEnchants] = React.useState({});
    // Existing target item enchantments
    const [existingEnchantsChecked, setExistingEnchantsChecked] =
        React.useState(false);
    const [targetItemEnchants, setTargetItemEnchants] = React.useState({});
    // Error / result / loading state
    const [errorMessage, setErrorMessage] = React.useState("");
    const [calculationResult, setCalculationResult] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const botrightRef = React.useRef(null);

    // Get current enchantments based on selected item
    const currentEnchants = selectedSub
        ? itemEnchantMap[selectedSub] || []
        : [];

    // Helper: check if 'enchName' conflicts with any enchant selected within the given 'enchantSet'
    const hasConflict = (enchName, enchantSet) => {
        for (const selectedEnch in enchantSet) {
            if (conflictMap[selectedEnch]?.includes(enchName)) {
                return true;
            }
        }
        return false;
    };

    // Sync sacItem to selectedSub and reset per-item selections when changing target
    React.useEffect(() => {
        if (selectedSub) {
            setSacItem(selectedSub);
            // Clear per-item enchant selections to avoid leftover state
            setSacItemEnchants({});
            setSacBooksEnchants({});
            setTargetItemEnchants({});
            setExistingEnchantsChecked(false);
            setErrorMessage("");
            setCalculationResult(null);
        } else {
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

    // Unified toggle that only affects the provided set (no cross-set effects)
    const handleToggle = (ename, setEnchants, enchants) => {
        setEnchants((prev) => {
            const copy = { ...prev };
            if (!copy[ename]) {
                // enabling: remove any conflicting enchants in the same set ONLY
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

    // Set enchant level within a set (no cross-set effects)
    const handleSetEnchantLevel = (ename, lvl, setEnchants, enchants) => {
        setEnchants((prev) => {
            const copy = { ...prev };
            if (lvl <= 0) {
                delete copy[ename];
            } else {
                // Remove same-set conflicting enchants
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

    // Validate input and run calculation
    const validateAndCalculate = () => {
        setErrorMessage("");
        setCalculationResult(null);

        if (!selectedSub) {
            setErrorMessage("Error: No target item selected.");
            return;
        }

        if (
            existingEnchantsChecked &&
            Object.keys(targetItemEnchants).length === 0
        ) {
            setErrorMessage(
                "Error: No existing enchantments selected for target item."
            );
            return;
        }

        if (!sacMode) {
            setErrorMessage("Error: No sacrifice mode selected.");
            return;
        }

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

    // Calculate click wrapper for small UX niceties
    const handleCalculateClick = () => {
        setIsLoading(true);
        setErrorMessage("");
        setCalculationResult(null);

        setTimeout(() => {
            try {
                validateAndCalculate();
            } finally {
                setIsLoading(false);
            }
        }, 60);
    };

    React.useEffect(() => {
        if (isLoading && botrightRef.current) {
            botrightRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [isLoading]);

    // Helpers for result display
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

    const disp = (item) => {
        const e = Object.entries(item.ench)
            .map(([k, v]) => k + " " + toRoman(v))
            .join(", ");
        return item.isBook
            ? "Book" + (e ? " (" + e + ")" : "")
            : item.item + (e ? " (" + e + ")" : "");
    };

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
            <h1 className="appheader">MINECRAFT ENCHANTING OPTIMIZER</h1>
            <div className="bentogrid">
                <header className="topsect" role="banner">
                    <div className="introbox">
                        <p className="intro-desc">
                            Get the most efficient anvil combinations to
                            <span className="highlight">
                                {" "}
                                minimize XP cost{" "}
                            </span>
                            and avoid the dreaded
                            <span className="dangerword">
                                {" "}
                                "Too Expensive!"
                            </span>{" "}
                            message in Minecraft. Support for Bedrock coming
                            soon!
                        </p>
                        <div className="badges">
                            <span className="badge java">
                                Java Edition Only
                            </span>
                            <span className="badge coffee">
                                <a href="https://buymeacoffee.com/codewithbottle">
                                    Support Me!
                                </a>
                            </span>
                        </div>
                        <a href="/guide" className="guidebtn">
                            Guide
                        </a>
                    </div>
                </header>
                <main className="bottomsect" role="main">
                    <div className="botleft">
                        {(() => {
                            const subcats = {
                                Armor: [
                                    "Helmet",
                                    "Chestplate",
                                    "Leggings",
                                    "Boots",
                                    "Turtle Shell",
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
                                    "Brush",
                                    "Carrot on a Stick",
                                    "Warped Fungus on a Stick",
                                    "Pumpkin",
                                ],
                            };
                            return (
                                <>
                                    <p className="cat-help">Select Item:</p>
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
                                                    Existing enchantments on
                                                    your {selectedSub} (uncheck
                                                    if none)
                                                </span>
                                            </label>

                                            {existingEnchantsChecked && (
                                                <div className="existing-enchants-grid">
                                                    <div className="existing-enchants-title">
                                                        Select the enchantments
                                                        already present on your{" "}
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
                                                                            // Toggle only within targetItemEnchants
                                                                            handleToggle(
                                                                                ench.name,
                                                                                setTargetItemEnchants,
                                                                                targetItemEnchants
                                                                            );
                                                                            setErrorMessage(
                                                                                ""
                                                                            );
                                                                            setCalculationResult(
                                                                                null
                                                                            );
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
                                                                                                handleSetEnchantLevel(
                                                                                                    ench.name,
                                                                                                    lvl,
                                                                                                    setTargetItemEnchants,
                                                                                                    targetItemEnchants
                                                                                                );
                                                                                                setErrorMessage(
                                                                                                    ""
                                                                                                );
                                                                                                setCalculationResult(
                                                                                                    null
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

                                    <div className="slots-area">
                                        <div className="slot target-slot">
                                            {selectedSub || "Select item"}
                                        </div>
                                        <div className="plus-sign">+</div>
                                        <div
                                            className="slot sacrifice-slot"
                                            title="Select sacrifice mode below"
                                        >
                                            {selectedSub
                                                ? sacMode
                                                    ? (sacMode === "Books" &&
                                                          "Enchanted Books") ||
                                                      (sacMode ===
                                                          "Item & Books" &&
                                                          (sacItem ||
                                                              "Same item + books"))
                                                    : "Select mode"
                                                : "Select target first"}
                                        </div>
                                    </div>

                                    {selectedSub && (
                                        <>
                                            <p className="cat-help-sac">
                                                Select Combining Mode:
                                            </p>
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

                                            {!sacMode && (
                                                <div className="mode-prompt">
                                                    Please select a mode above
                                                </div>
                                            )}

                                            {/* Sacrifice Books */}
                                            {sacMode === "Books" && (
                                                <div className="sac-books-editor">
                                                    <div className="books-header">
                                                        <div className="books-title">
                                                            Enchanted Books to
                                                            use:
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
                                                                            // Toggle only within sacBooksEnchants
                                                                            handleToggle(
                                                                                ench.name,
                                                                                setSacBooksEnchants,
                                                                                sacBooksEnchants
                                                                            );
                                                                            setErrorMessage(
                                                                                ""
                                                                            );
                                                                            setCalculationResult(
                                                                                null
                                                                            );
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
                                                                                                handleSetEnchantLevel(
                                                                                                    ench.name,
                                                                                                    lvl,
                                                                                                    setSacBooksEnchants,
                                                                                                    sacBooksEnchants
                                                                                                );
                                                                                                setErrorMessage(
                                                                                                    ""
                                                                                                );
                                                                                                setCalculationResult(
                                                                                                    null
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

                                            {/* Sacrifice Item & Books */}
                                            {sacMode === "Item & Books" && (
                                                <>
                                                    <div className="sac-item-editor">
                                                        <div className="sac-item-header">
                                                            <div className="sac-item-title">
                                                                Sacrifice Item:{" "}
                                                                {sacItem}
                                                            </div>
                                                            <div className="sac-item-subtitle">
                                                                Select
                                                                enchantments
                                                                present on the
                                                                sacrifice{" "}
                                                                {selectedSub}
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
                                                                                // Toggle only within sacItemEnchants
                                                                                handleToggle(
                                                                                    ench.name,
                                                                                    setSacItemEnchants,
                                                                                    sacItemEnchants
                                                                                );
                                                                                setErrorMessage(
                                                                                    ""
                                                                                );
                                                                                setCalculationResult(
                                                                                    null
                                                                                );
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
                                                                                                    handleSetEnchantLevel(
                                                                                                        ench.name,
                                                                                                        lvl,
                                                                                                        setSacItemEnchants,
                                                                                                        sacItemEnchants
                                                                                                    );
                                                                                                    setErrorMessage(
                                                                                                        ""
                                                                                                    );
                                                                                                    setCalculationResult(
                                                                                                        null
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

                                                    <div className="sac-books-editor">
                                                        <div className="books-header">
                                                            <div className="books-title">
                                                                Enchanted Books
                                                                to use:
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
                                                                                // Toggle only within sacBooksEnchants
                                                                                handleToggle(
                                                                                    ench.name,
                                                                                    setSacBooksEnchants,
                                                                                    sacBooksEnchants
                                                                                );
                                                                                setErrorMessage(
                                                                                    ""
                                                                                );
                                                                                setCalculationResult(
                                                                                    null
                                                                                );
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
                                                                                                    handleSetEnchantLevel(
                                                                                                        ench.name,
                                                                                                        lvl,
                                                                                                        setSacBooksEnchants,
                                                                                                        sacBooksEnchants
                                                                                                    );
                                                                                                    setErrorMessage(
                                                                                                        ""
                                                                                                    );
                                                                                                    setCalculationResult(
                                                                                                        null
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

                                    {errorMessage && (
                                        <div className="error-message">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="calculate-section">
                                        <button
                                            className="calculate-btn"
                                            onClick={handleCalculateClick}
                                            disabled={!selectedSub}
                                        >
                                            Calculate
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    <div className="botright" ref={botrightRef}>
                        {isLoading ? (
                            <div className="results-loading"></div>
                        ) : calculationResult ? (
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
                                                                Outcome:
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
                                                Final Enchanted Item:
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
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default App;
