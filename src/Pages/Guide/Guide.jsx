import React from "react";
import "./Guide.css";
import Footer from "../../Components/Footer/Footer";
import SubHeader from "../../Components/SubHeader/SubHeader";

import Renaming from "./../../assets/images/Renaming.webp";
import Repairing from "./../../assets/images/Repairing.webp";
import Enchanting from "./../../assets/images/Enchanting.webp";
import PWPCost from "./../../assets/images/PWPCost.webp";
import TooExpensive from "./../../assets/images/TooExpensive.webp";
import ToolExample from "./../../assets/images/ToolExample.webp";

const Guide = () => {
    return (
        <div className="container">
            <h1 className="appheader">MINECRAFT ENCHANTING GUIDE</h1>

            <header className="topsect" role="banner">
                <div className="introbox">
                    <p className="intro-desc">
                        Anvils in Minecraft are powerful but often confusing. If
                        you've seen the{" "}
                        <span className="dangerword">Too Expensive!</span>{" "}
                        message, this guide explains the core anvil functions
                        and how to use them safely. This is a practical,
                        Java-Edition focused{" "}
                        <strong>Minecraft anvil guide</strong> for players who
                        want to optimize enchanting, reduce XP costs, and avoid
                        hitting the anvil limit while playing Survival.
                    </p>
                    <div className="badges">
                        <span className="badge java">Java Edition Only!</span>
                        <span className="badge coffee">
                            <a href="https://buymeacoffee.com/codewithbottle">
                                Support Me!
                            </a>
                        </span>
                    </div>
                    <a href="/" className="guidebtn">
                        Go to Tool
                    </a>
                </div>
            </header>

            <article className="guidetext">
                <SubHeader subHeader="How Anvils Work In Minecraft" />

                <p className="lead">
                    Anvils repair, combine, and rename items while keeping
                    enchantments. Most operations cost experience levels and
                    sometimes materials. Falling anvils deal damage but do not
                    cost XP. This page covers anvil mechanics, the XP cost
                    formula, prior work penalty, common causes of the{" "}
                    <strong>Too Expensive</strong> error, and practical
                    strategies to optimize enchanting in Survival worlds.
                </p>

                <div className="core-list">
                    <div className="core-item">
                        <strong>Rename</strong>
                        <p>
                            Give any item a custom name. Renaming can be done
                            during a repair or combine if XP allows. Renaming
                            adds a small fixed cost (usually +1 level) and can
                            push a multi-step operation past the 40 level
                            threshold — rename only when necessary to save XP.
                        </p>
                        <figure>
                            <img src={Renaming} alt="Renaming item in anvil" />
                            <figcaption>
                                Rename an item in the anvil UI
                            </figcaption>
                        </figure>
                    </div>

                    <div className="core-item">
                        <strong>Repair</strong>
                        <p>
                            Restore durability using base materials or another
                            item of the same type without removing enchantments.
                            Repairing consumes materials (iron, diamonds, etc.)
                            and XP; repairing repeatedly increases the item’s
                            prior-work value which raises future anvil costs.
                        </p>
                        <figure>
                            <img src={Repairing} alt="Repairing item" />
                            <figcaption>
                                Repair with materials or another tool
                            </figcaption>
                        </figure>
                    </div>

                    <div className="core-item">
                        <strong>Combine / Enchant with Books</strong>
                        <p>
                            Merge similar items or apply enchanted books. Books
                            are usually cheaper to apply than combining two
                            enchanted items because they avoid transferring a
                            target item's high prior work. Smart book combining
                            (stacking books into one) is an essential
                            <em> XP-efficient enchanting strategy</em>.
                        </p>
                        <figure>
                            <img
                                src={Enchanting}
                                alt="Applying enchanted book"
                            />
                            <figcaption>
                                Apply enchanted books to items
                            </figcaption>
                        </figure>
                    </div>

                    <div className="core-item">
                        <strong>Falling Anvils</strong>
                        <p>
                            Falling anvils damage mobs/players (+2 HP per block
                            fallen after first, max 40 HP). They also degrade on
                            impact and can destroy ground items. Anvil
                            durability is a separate consideration from XP cost
                            but important for long-term anvil planning.
                        </p>
                    </div>
                </div>

                <p className="small">
                    Each non-trivial anvil use has a 12% chance to degrade the
                    anvil. <br />
                    Java damage states: Anvil → Chipped Anvil → Damaged Anvil{" "}
                    <br />
                    Bedrock damage states: Anvil → Slightly Damaged Anvil → Very
                    Damaged Anvil
                </p>

                <SubHeader subHeader="What Is Prior Work Penalty?" />
                <div className="explain-block">
                    <p>
                        Each time an item is repaired, combined, or enchanted on
                        an anvil, it gains a hidden history value that increases
                        future XP costs. This is the
                        <strong> Prior Work Penalty</strong>. Understanding this
                        exponential growth is key to planning XP-efficient
                        enchant sequences.
                    </p>

                    <p className="code">
                        Prior Work Penalty = <strong>2^(uses) - 1</strong>
                    </p>

                    <ul className="examples">
                        <li>If Uses = 0, then Penalty = 0 levels</li>
                        <li>If Uses = 1, then Penalty = 1 levels</li>
                        <li>If Uses = 2, then Penalty = 3 levels</li>
                        <li>If Uses = 3, then Penalty = 7 levels</li>
                        <li>If Uses = 5, then Penalty = 31 levels</li>
                    </ul>

                    <p>
                        Small penalties are fine, but the penalty grows quickly
                        and is often the main reason an anvil operation becomes
                        expensive. Because prior work is exponential, game
                        strategies focus on minimizing the number of times a
                        valuable item is touched on an anvil.
                    </p>

                    <figure className="inline-img">
                        <img src={PWPCost} alt="Prior Work Penalty example" />
                        <figcaption>
                            Anvil screen showing prior work impact
                        </figcaption>
                    </figure>
                </div>

                <SubHeader subHeader="Why “Too Expensive” Happens" />
                <div className="explain-block">
                    <p>
                        In Survival, a single anvil operation is blocked if it
                        would cost <strong>40 levels or more</strong>. The anvil
                        sums several parts to make this total. Many players hit
                        this limit unexpectedly when combining many high-level
                        enchanted books or repeatedly repairing a single item.
                    </p>

                    <p className="step">What adds to the cost:</p>
                    <ol className="short-steps">
                        <li>Base Value of the book/sacrificed item</li>
                        <li>Prior Work Penalty of the target item</li>
                        <li>
                            Prior Work Penalty of the sacrifice item (if any)
                        </li>
                        <li>Rename Cost (usually +1)</li>
                        <li>Repair/Incompatibility extras</li>
                    </ol>

                    <p className="example">
                        Example: Sword (Penalty 31) + Book (Value 9) = 40 [Too
                        Expensive!]
                    </p>

                    <p>
                        To avoid this: Combine books first, apply the combined
                        book once, and keep the item's own use count low. If you
                        have many enchanted books, merge them into a single
                        consolidated book in advance — this reduces total anvil
                        operations and the chance of hitting the 40 level cap.
                    </p>

                    <p>Practical tips for Players:</p>
                    <ul className="examples">
                        <li>
                            Stack books of the same enchantment level before
                            applying to the target item to reduce repeated uses.
                        </li>
                        <li>
                            Apply mutually compatible enchantments together to
                            minimize intermediate merges that increase prior
                            work.
                        </li>
                        <li>
                            Keep a 'clean' copy of a valuable item (no prior
                            work) and only apply final combined books once.
                        </li>
                    </ul>

                    <figure className="inline-img">
                        <img src={TooExpensive} alt="Too Expensive example" />
                        <figcaption>
                            When costs exceed the limit, the anvil shows “Too
                            Expensive!”
                        </figcaption>
                    </figure>
                </div>

                <SubHeader subHeader="How This Tool Works" />
                <div className="explain-block">
                    <p>
                        The tool runs a small search over possible combine
                        orders and returns the cheapest valid plan for applying
                        books/items to your target. It models Minecraft's anvil
                        rules (prior work penalties, enchantment multipliers,
                        and conflicts) and prunes useless steps so it runs
                        quickly. Use this <strong>anvil cost calculator</strong>{" "}
                        to plan XP-efficient enchanting sequences before you
                        touch the in-game anvil.
                    </p>

                    <p className="mini-steps">Key Points:</p>
                    <ul className="examples">
                        <li>
                            <strong>Inputs:</strong> Target item, its existing
                            enchants (if any), sacrifice item (optional), and a
                            list of enchanted books.
                        </li>
                        <li>
                            <strong>Combine function:</strong> Merges
                            enchantments, resolves conflicts, computes
                            enchantment cost and resulting prior-work increase,
                            and rejects merges that would be greater than 39
                            levels.
                        </li>
                        <li>
                            <strong>Search:</strong> Explores different merge
                            orders using a stack and a seen-state map; it keeps
                            the target item on the left to mirror in-game
                            behavior.
                        </li>
                        <li>
                            <strong>Pruning:</strong> Skips wasteful
                            intermediate merges (for example, applying a book to
                            an item that will later lose that enchantment to a
                            conflict with the target).
                        </li>
                        <li>
                            <strong>Output:</strong> A step-by-step list showing
                            each merge, the XP cost for that merge, the combined
                            result, and final totals (total levels needed,
                            steps, etc).
                        </li>
                    </ul>

                    <p>
                        In short, the tool simulates valid anvil merges, avoids
                        pointless work, and returns the optimal safe sequence so
                        you can apply enchants without hitting “Too Expensive!”.
                        This makes it a useful{" "}
                        <em>Minecraft enchantment optimizer</em> and planning
                        aid for both singleplayer and multiplayer servers.
                    </p>

                    <figure className="inline-img">
                        <img
                            src={ToolExample}
                            alt="Tool example"
                            className="toolimg"
                        />
                        <figcaption>
                            Example: The tool tests merge orders and reports the
                            cheapest sequence
                        </figcaption>
                    </figure>

                    <div className="tool-actions">
                        <a href="/" className="guidebtn">
                            Back to Tool
                        </a>
                    </div>
                </div>
            </article>

            <Footer />
        </div>
    );
};

export default Guide;
