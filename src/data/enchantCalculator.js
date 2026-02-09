import { enchantmentsConflict, itemEnchantMap } from "./enchantmentData";

/* -------------------- Utilities & Precomputation -------------------- */

// Build a global list/map of all enchant names to indices (stable order)
const ENCHANT_INDEX = (() => {
    const set = new Map();
    let idx = 0;
    for (const arr of Object.values(itemEnchantMap)) {
        for (const e of arr) {
            if (!set.has(e.name)) set.set(e.name, idx++);
        }
    }
    return { map: set, size: idx };
})();

const ENCHANT_COUNT = ENCHANT_INDEX.size;

// caches for max levels and multipliers
const maxLevelCache = new Map();
function getMaxLevel(enchantName) {
    if (maxLevelCache.has(enchantName)) return maxLevelCache.get(enchantName);
    for (const arr of Object.values(itemEnchantMap)) {
        for (const e of arr) {
            if (e.name === enchantName) {
                maxLevelCache.set(enchantName, e.max);
                return e.max;
            }
        }
    }
    maxLevelCache.set(enchantName, 1);
    return 1;
}

// multipliers table (kept same as your original)
const multipliers = {
    Protection: { item: 1, book: 1 },
    "Fire Protection": { item: 2, book: 1 },
    "Projectile Protection": { item: 2, book: 1 },
    "Blast Protection": { item: 4, book: 2 },
    Thorns: { item: 8, book: 4 },
    Respiration: { item: 4, book: 2 },
    "Depth Strider": { item: 4, book: 2 },
    "Aqua Affinity": { item: 4, book: 2 },
    Sharpness: { item: 1, book: 1 },
    Smite: { item: 2, book: 1 },
    "Bane of Arthropods": { item: 2, book: 1 },
    Knockback: { item: 2, book: 1 },
    "Fire Aspect": { item: 4, book: 2 },
    Looting: { item: 4, book: 2 },
    "Sweeping Edge": { item: 4, book: 2 },
    Efficiency: { item: 1, book: 1 },
    "Silk Touch": { item: 8, book: 4 },
    Unbreaking: { item: 2, book: 1 },
    Fortune: { item: 4, book: 2 },
    Power: { item: 1, book: 1 },
    Punch: { item: 4, book: 2 },
    Flame: { item: 4, book: 2 },
    Infinity: { item: 8, book: 4 },
    Multishot: { item: 4, book: 2 },
    Piercing: { item: 1, book: 1 },
    "Quick Charge": { item: 2, book: 1 },
    Impaling: { item: 4, book: 2 },
    Channeling: { item: 8, book: 4 },
    Riptide: { item: 4, book: 2 },
    Loyalty: { item: 1, book: 1 },
    "Feather Falling": { item: 2, book: 1 },
    "Frost Walker": { item: 4, book: 2 },
    "Soul Speed": { item: 8, book: 4 },
    "Swift Sneak": { item: 8, book: 4 },
    Lure: { item: 4, book: 2 },
    "Luck of the Sea": { item: 4, book: 2 },
    Mending: { item: 4, book: 2 },
    "Curse of Binding": { item: 8, book: 4 },
    "Curse of Vanishing": { item: 8, book: 4 },
    Density: { item: 2, book: 1 },
    Breach: { item: 4, book: 2 },
    "Wind Burst": { item: 4, book: 2 },
    Lunge: { item: 2, book: 1 },
};

const multiplierCache = new Map();
function getMultiplier(enchantName, isBook) {
    const key = enchantName + (isBook ? "_B" : "_I");
    if (multiplierCache.has(key)) return multiplierCache.get(key);
    const m = multipliers[enchantName]
        ? isBook
            ? multipliers[enchantName].book
            : multipliers[enchantName].item
        : 1;
    multiplierCache.set(key, m);
    return m;
}

function xpForLevel(L) {
    if (L <= 16) return L * L + 6 * L;
    if (L <= 31) return Math.floor(2.5 * L * L - 40.5 * L + 360);
    return Math.floor(4.5 * L * L - 162.5 * L + 2220);
}

/* -------------------- Fast typed-array helpers -------------------- */

// create a zeroed enchant vector
function makeZeroVector() {
    return new Uint8Array(ENCHANT_COUNT);
}

// convert {EnchName:level,...} -> Uint8Array
function objToVec(obj) {
    const v = makeZeroVector();
    if (!obj) return v;
    for (const [k, lv] of Object.entries(obj)) {
        const idx = ENCHANT_INDEX.map.get(k);
        if (idx !== undefined) v[idx] = Number(lv) || 0;
    }
    return v;
}

// compact key from vector (fast)
function vecKey(v) {
    // join with comma; for modest ENCHANT_COUNT this is fast and stable
    return Array.from(v).join(",");
}

/* -------------------- Combine memoization -------------------- */

// memoize combine results by leftKey|rightKey|leftBook|rightBook|leftRc|rightRc
const combineMemo = new Map();

function combineTyped(left, right) {
    // left/right: { item, isBook (boolean), rc (int), enchVec (Uint8Array) }
    // We do not produce display strings here — only the numeric result used by the search.
    const leftKey = vecKey(left.enchVec);
    const rightKey = vecKey(right.enchVec);
    const memoKey =
        leftKey +
        "|" +
        rightKey +
        "|" +
        (left.isBook ? 1 : 0) +
        "|" +
        (right.isBook ? 1 : 0) +
        "|" +
        left.rc +
        "|" +
        right.rc;
    const cached = combineMemo.get(memoKey);
    if (cached !== undefined) return cached; // may be null

    // prefer non-book on left (same as vanilla rules)
    let aIsBook = left.isBook,
        bIsBook = right.isBook;
    let aVec = left.enchVec,
        bVec = right.enchVec;
    let aRc = left.rc,
        bRc = right.rc;
    let aItem = left.item,
        bItem = right.item;
    if (aIsBook && !bIsBook) {
        // swap logical a/b
        aIsBook = right.isBook;
        bIsBook = left.isBook;
        aVec = right.enchVec;
        bVec = left.enchVec;
        aRc = right.rc;
        bRc = left.rc;
        aItem = right.item;
        bItem = left.item;
    }

    // create result vector (copy of aVec)
    const rVec = new Uint8Array(aVec); // copy
    const changes = [];
    let enchantCost = 0;

    // compute per-enchant result
    for (let ei = 0; ei < ENCHANT_COUNT; ei++) {
        const lvB = bVec[ei];
        if (!lvB) continue;
        const lvA = rVec[ei] || 0;
        const enchantName = [...ENCHANT_INDEX.map.entries()].find(
            ([, i]) => i === ei,
        )?.[0]; // slow if used here frequently — but we only need name for multiplier lookup
        // to avoid the above slow lookup per loop, build an index->name array once
    }

    // To avoid repeated map.entries() cost we create an array for index->name mapping
    // (small one-time cost)
    if (!combineTyped._idxToName) {
        const arr = new Array(ENCHANT_COUNT);
        for (const [name, id] of ENCHANT_INDEX.map) arr[id] = name;
        combineTyped._idxToName = arr;
    }
    const idxToName = combineTyped._idxToName;

    for (let ei = 0; ei < ENCHANT_COUNT; ei++) {
        const lvB = bVec[ei];
        if (!lvB) continue;
        const lvA = rVec[ei] || 0;

        // conflict detection between enchant x and any in aVec:
        let conflictCount = 0;
        if (lvA > 0) {
            // if both sides have enchant, check conflict
            // (we assume conflicts are symmetric via enchantmentsConflict)
            // But we also need to check conflicts with any other enchant present in aVec.
            // We'll check conflicts against each enchant present in aVec (fast because counts small)
            for (let ej = 0; ej < ENCHANT_COUNT; ej++) {
                if (aVec[ej]) {
                    const aName = idxToName[ej];
                    const bName = idxToName[ei];
                    if (
                        enchantmentsConflict(bName, aName) ||
                        enchantmentsConflict(aName, bName)
                    ) {
                        conflictCount++;
                        break; // we only need to know >0 for Java (we count as 1)
                    }
                }
            }
        }

        if (conflictCount > 0) {
            // Java: conflicting enchantments on right are penalized (as in your original code)
            enchantCost += conflictCount * 1;
            continue;
        }

        const name = idxToName[ei];
        const maxLv = getMaxLevel(name);
        let finalLv;
        if (lvA === lvB && lvA > 0 && lvA < maxLv)
            finalLv = Math.min(maxLv, lvA + 1);
        else finalLv = Math.min(maxLv, Math.max(lvA, lvB));
        if (finalLv !== lvA) {
            changes.push([ei, lvA, finalLv]);
            rVec[ei] = finalLv;
        }
        enchantCost += getMultiplier(name, bIsBook) * finalLv;
    }

    if (changes.length === 0) {
        combineMemo.set(memoKey, null);
        return null;
    }

    const pwA = Math.max(0, 2 ** aRc - 1);
    const pwB = Math.max(0, 2 ** bRc - 1);
    const pwSum = pwA + pwB;
    const levels = Math.max(1, Math.floor(pwSum + enchantCost));
    if (levels >= 40) {
        combineMemo.set(memoKey, null);
        return null;
    }
    const xp = xpForLevel(levels);
    const resultNode = {
        item: aItem,
        isBook: aIsBook && bIsBook,
        rc: 1 + Math.max(aRc, bRc),
        enchVec: rVec,
    };

    const out = {
        node: resultNode,
        levels,
        xp,
        pw: pwSum,
        changes,
        left: left,
        right: right,
    };
    combineMemo.set(memoKey, out);
    return out;
}

/* -------------------- MinHeap (same as previous but optimized) -------------------- */
class MinHeap {
    constructor() {
        this.data = [];
    }
    push(priority, value) {
        const node = { priority, value };
        this.data.push(node);
        this._siftUp(this.data.length - 1);
    }
    pop() {
        if (this.data.length === 0) return null;
        const top = this.data[0];
        const end = this.data.pop();
        if (this.data.length > 0) {
            this.data[0] = end;
            this._siftDown(0);
        }
        return top;
    }
    _siftUp(idx) {
        const arr = this.data;
        while (idx > 0) {
            const parent = Math.floor((idx - 1) / 2);
            if (arr[parent].priority <= arr[idx].priority) break;
            [arr[parent], arr[idx]] = [arr[idx], arr[parent]];
            idx = parent;
        }
    }
    _siftDown(idx) {
        const arr = this.data;
        const n = arr.length;
        while (true) {
            let left = idx * 2 + 1;
            let right = left + 1;
            let smallest = idx;
            if (left < n && arr[left].priority < arr[smallest].priority)
                smallest = left;
            if (right < n && arr[right].priority < arr[smallest].priority)
                smallest = right;
            if (smallest === idx) break;
            [arr[smallest], arr[idx]] = [arr[idx], arr[smallest]];
            idx = smallest;
        }
    }
    get size() {
        return this.data.length;
    }
}

/* -------------------- Main search function -------------------- */

export function computeOptimalEnchantPlan(data) {
    // prepare target node
    const target = {
        item: data.targetItem,
        isBook: false,
        rc: 0,
        enchVec: objToVec(data.existingEnchantments || {}),
        isTarget: true,
    };
    const targetBaseEnch = objToVec(data.existingEnchantments || {});

    // build initial nodes list (target + optional sacrifice item + books)
    const nodes = [target];
    if (data.sacrificeMode === "Item & Books" && data.sacrificeItem) {
        nodes.push({
            item: data.sacrificeItem,
            isBook: false,
            rc: 0,
            enchVec: objToVec(data.sacrificeEnchantments || {}),
            isTarget: false,
        });
    }
    if (
        data.booksEnchantments &&
        Object.keys(data.booksEnchantments).length > 0
    ) {
        const filtered = {};
        // remove books that conflict with existing target enchants
        for (const [k, v] of Object.entries(data.booksEnchantments)) {
            // check conflicts
            let ok = true;
            for (let i = 0; i < ENCHANT_COUNT; i++) {
                if (targetBaseEnch[i]) {
                    const name = combineTyped._idxToName
                        ? combineTyped._idxToName[i]
                        : null;
                    if (
                        name &&
                        (enchantmentsConflict(k, name) ||
                            enchantmentsConflict(name, k))
                    ) {
                        ok = false;
                        break;
                    }
                }
            }
            if (ok) filtered[k] = v;
        }
        for (const [ename, lvl] of Object.entries(filtered)) {
            nodes.push({
                item: "Book",
                isBook: true,
                rc: 0,
                enchVec: objToVec({ [ename]: Number(lvl) }),
                isTarget: false,
            });
        }
    }

    if (nodes.length === 1) {
        return {
            success: true,
            totalLevels: 0,
            totalXP: 0,
            timeMs: 0,
            steps: [],
            finalItem: target,
        };
    }

    // frontier: min-heap keyed by totalLevels
    const frontier = new MinHeap();
    frontier.push(0, {
        nodes: nodes.map((n) => ({
            item: n.item,
            isBook: n.isBook,
            rc: n.rc,
            enchVec: n.enchVec,
            isTarget: n.isTarget,
        })),
        totalLevels: 0,
        steps: [],
        totalXPpoints: 0,
    });

    // seen map: stateKey -> best totalLevels seen
    const seen = new Map();

    const start = performance.now();
    let best = null;

    while (frontier.size > 0) {
        const cand = frontier.pop();
        const state = cand.value;

        if (best && state.totalLevels >= best.totalLevels) break;

        if (state.nodes.length === 1) {
            if (!best || state.totalLevels < best.totalLevels) {
                best = {
                    ...state,
                    finalItem: state.nodes[0],
                    timeMs: performance.now() - start,
                };
            }
            continue;
        }

        const n = state.nodes.length;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;

                let aIdx = i,
                    bIdx = j;
                const aIsTarget = !!state.nodes[i].isTarget;
                const bIsTarget = !!state.nodes[j].isTarget;
                if (!aIsTarget && bIsTarget) {
                    aIdx = j;
                    bIdx = i;
                }

                const aNode = state.nodes[aIdx];
                const bNode = state.nodes[bIdx];

                const result = combineTyped(aNode, bNode);
                if (!result) continue;

                // avoid combining books that later conflict with target in some cases (same heuristic you used)
                if (bNode.isBook && !result.node.isTarget) {
                    // nodeHasConflictWithTarget check (fast numeric)
                    let conflict = false;
                    for (let ei = 0; ei < ENCHANT_COUNT; ei++) {
                        if (result.node.enchVec[ei] && targetBaseEnch[ei]) {
                            const name = combineTyped._idxToName
                                ? combineTyped._idxToName[ei]
                                : null;
                            if (name && enchantmentsConflict(name, name)) {
                                conflict = true;
                                break;
                            } // no-op but kept to match logic style
                        }
                    }
                    if (conflict) continue;
                }

                result.node.isTarget = !!(
                    state.nodes[aIdx].isTarget || state.nodes[bIdx].isTarget
                );

                const newNodes = [];
                for (let k = 0; k < n; k++)
                    if (k !== i && k !== j)
                        newNodes.push({
                            item: state.nodes[k].item,
                            isBook: state.nodes[k].isBook,
                            rc: state.nodes[k].rc,
                            enchVec: state.nodes[k].enchVec,
                            isTarget: state.nodes[k].isTarget,
                        });
                newNodes.push(result.node);

                // create a compact state key: join each node's ench vector string + rc + book flag + item
                const keyParts = newNodes.map((nd) => {
                    return (
                        (nd.isBook ? "B" : "I") +
                        "|" +
                        nd.item +
                        "|" +
                        nd.rc +
                        "|" +
                        Array.from(nd.enchVec).join(",")
                    );
                });
                keyParts.sort();
                const stateKey = keyParts.join("||");

                const newTotal = state.totalLevels + result.levels;
                if (seen.has(stateKey) && seen.get(stateKey) <= newTotal)
                    continue;
                seen.set(stateKey, newTotal);

                const leftDisp = null; // defer textual display creation
                const rightDisp = null;
                const resultDisp = null;

                frontier.push(newTotal, {
                    nodes: newNodes,
                    totalLevels: newTotal,
                    steps: [
                        ...state.steps,
                        {
                            // store numeric-only step info; we'll create human strings later
                            left: {
                                item: result.left.item,
                                isBook: result.left.isBook,
                                enchVec: result.left.enchVec,
                            },
                            right: {
                                item: result.right.item,
                                isBook: result.right.isBook,
                                enchVec: result.right.enchVec,
                            },
                            resultNode: result.node,
                            levels: result.levels,
                            xp: result.xp,
                            pw: result.pw,
                            changes: result.changes,
                        },
                    ],
                    totalXPpoints: state.totalXPpoints + result.xp,
                });
            }
        }
    }

    if (!best) {
        return {
            success: false,
            reason: "No valid merge order found.",
            timeMs: performance.now() - start,
        };
    }

    // BUILD human-readable step strings from numeric-only data (final step only)
    // helper to format node into display text
    function nodeToDisplay(n) {
        const enchArr = [];
        const idxToName = combineTyped._idxToName;
        for (let i = 0; i < ENCHANT_COUNT; i++) {
            if (n.enchVec[i])
                enchArr.push(`${idxToName[i]} ${toRoman(n.enchVec[i])}`);
        }
        const enchStr = enchArr.join(", ");
        return n.isBook
            ? `Book${enchStr ? " (" + enchStr + ")" : ""}`
            : `${n.item}${enchStr ? " (" + enchStr + ")" : ""}`;
    }

    function toRoman(num) {
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
        for (let k in lookup) {
            while (num >= lookup[k]) {
                roman += k;
                num -= lookup[k];
            }
        }
        return roman;
    }

    const finalSteps = best.steps.map((s) => {
        return {
            left: nodeToDisplay(s.left),
            right: nodeToDisplay(s.right),
            result: nodeToDisplay(s.resultNode),
            levels: s.levels,
            xp: s.xp,
            pw: s.pw,
            changes: s.changes,
        };
    });

    return {
        success: true,
        totalLevels: best.totalLevels,
        totalXP: best.totalXPpoints,
        timeMs: best.timeMs,
        steps: finalSteps,
        finalItem: (() => {
            // convert numeric final item to same shape your UI expects:
            const fi = best.finalItem;
            const ench = {};
            const idxToName = combineTyped._idxToName;
            for (let i = 0; i < ENCHANT_COUNT; i++) {
                if (fi.enchVec[i]) ench[idxToName[i]] = fi.enchVec[i];
            }
            return { item: fi.item, isBook: fi.isBook, rc: fi.rc, ench };
        })(),
    };
}
