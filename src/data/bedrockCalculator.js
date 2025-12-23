// src/data/bedrockCalculator.js
// Optimized Bedrock Edition enchant calculator (drop-in replacement)

import { enchantmentsConflict, itemEnchantMap } from "./enchantmentData";

/* ===================== PRECOMPUTATION ===================== */

// Build enchant → index mapping once
const ENCHANT_INDEX = (() => {
    const map = new Map();
    let i = 0;
    for (const arr of Object.values(itemEnchantMap)) {
        for (const e of arr) {
            if (!map.has(e.name)) map.set(e.name, i++);
        }
    }
    return map;
})();
const ENCHANT_COUNT = ENCHANT_INDEX.size;

// Reverse index → enchant name
const IDX_TO_NAME = Array.from(ENCHANT_INDEX.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => name);

// Max level cache
const maxLevelCache = new Map();
function getMaxLevel(name) {
    if (maxLevelCache.has(name)) return maxLevelCache.get(name);
    for (const arr of Object.values(itemEnchantMap)) {
        for (const e of arr) {
            if (e.name === name) {
                maxLevelCache.set(name, e.max);
                return e.max;
            }
        }
    }
    maxLevelCache.set(name, 1);
    return 1;
}

// Multipliers (same as your original)
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
    Impaling: { item: 2, book: 1 },
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
};

function getMultiplier(name, isBook) {
    const m = multipliers[name];
    return m ? (isBook ? m.book : m.item) : 1;
}

function xpForLevel(L) {
    if (L <= 16) return L * L + 6 * L;
    if (L <= 31) return Math.floor(2.5 * L * L - 40.5 * L + 360);
    return Math.floor(4.5 * L * L - 162.5 * L + 2220);
}

/* ===================== VECTORS ===================== */

function vecFromObj(obj) {
    const v = new Uint8Array(ENCHANT_COUNT);
    if (!obj) return v;
    for (const [k, lv] of Object.entries(obj)) {
        const idx = ENCHANT_INDEX.get(k);
        if (idx !== undefined) v[idx] = lv;
    }
    return v;
}

function vecKey(v) {
    return Array.from(v).join(",");
}

/* ===================== COMBINE (BEDROCK RULES) ===================== */

const combineMemo = new Map();

function combine(a, b) {
    const key =
        vecKey(a.ench) +
        "|" +
        vecKey(b.ench) +
        "|" +
        a.rc +
        "|" +
        b.rc +
        "|" +
        (a.isBook ? 1 : 0) +
        "|" +
        (b.isBook ? 1 : 0);

    if (combineMemo.has(key)) return combineMemo.get(key);

    let left = a,
        right = b;
    if (left.isBook && !right.isBook) [left, right] = [right, left];

    const outVec = new Uint8Array(left.ench);
    let enchantCost = 0;
    const changes = [];

    for (let i = 0; i < ENCHANT_COUNT; i++) {
        const lvB = right.ench[i];
        if (!lvB) continue;

        let conflict = false;
        for (let j = 0; j < ENCHANT_COUNT; j++) {
            if (left.ench[j]) {
                const n1 = IDX_TO_NAME[i];
                const n2 = IDX_TO_NAME[j];
                if (
                    enchantmentsConflict(n1, n2) ||
                    enchantmentsConflict(n2, n1)
                ) {
                    conflict = true;
                    break;
                }
            }
        }
        if (conflict) continue;

        const lvA = outVec[i];
        const maxLv = getMaxLevel(IDX_TO_NAME[i]);
        const finalLv =
            lvA === lvB && lvA > 0 && lvA < maxLv
                ? Math.min(maxLv, lvA + 1)
                : Math.min(maxLv, Math.max(lvA, lvB));

        if (finalLv !== lvA) {
            outVec[i] = finalLv;
            changes.push([IDX_TO_NAME[i], lvA, finalLv]);
        }

        enchantCost +=
            getMultiplier(IDX_TO_NAME[i], right.isBook) *
            Math.max(0, finalLv - lvA);
    }

    if (!changes.length) {
        combineMemo.set(key, null);
        return null;
    }

    const pw = Math.max(0, 2 ** left.rc - 1) + Math.max(0, 2 ** right.rc - 1);
    const levels = Math.max(1, Math.floor(pw + enchantCost));
    if (levels >= 40) {
        combineMemo.set(key, null);
        return null;
    }

    const res = {
        node: {
            item: left.item,
            isBook: left.isBook && right.isBook,
            rc: 1 + Math.max(left.rc, right.rc),
            ench: outVec,
            isTarget: left.isTarget || right.isTarget,
        },
        levels,
        xp: xpForLevel(levels),
        pw,
        changes,
        left,
        right,
    };

    combineMemo.set(key, res);
    return res;
}

/* ===================== PRIORITY QUEUE ===================== */

class MinHeap {
    constructor() {
        this.a = [];
    }
    push(p, v) {
        this.a.push([p, v]);
        let i = this.a.length - 1;
        while (i > 0) {
            const pIdx = (i - 1) >> 1;
            if (this.a[pIdx][0] <= this.a[i][0]) break;
            [this.a[pIdx], this.a[i]] = [this.a[i], this.a[pIdx]];
            i = pIdx;
        }
    }
    pop() {
        if (!this.a.length) return null;
        const r = this.a[0];
        const x = this.a.pop();
        if (this.a.length) {
            this.a[0] = x;
            let i = 0;
            while (true) {
                let l = i * 2 + 1,
                    r2 = l + 1,
                    s = i;
                if (l < this.a.length && this.a[l][0] < this.a[s][0]) s = l;
                if (r2 < this.a.length && this.a[r2][0] < this.a[s][0]) s = r2;
                if (s === i) break;
                [this.a[i], this.a[s]] = [this.a[s], this.a[i]];
                i = s;
            }
        }
        return r;
    }
    get size() {
        return this.a.length;
    }
}

/* ===================== MAIN SEARCH ===================== */

export function computeOptimalEnchantPlan(data) {
    const target = {
        item: data.targetItem,
        isBook: false,
        rc: 0,
        ench: vecFromObj(data.existingEnchantments),
        isTarget: true,
    };

    const nodes = [target];

    if (data.sacrificeMode === "Item & Books" && data.sacrificeItem) {
        nodes.push({
            item: data.sacrificeItem,
            isBook: false,
            rc: 0,
            ench: vecFromObj(data.sacrificeEnchantments),
            isTarget: false,
        });
    }

    for (const [k, v] of Object.entries(data.booksEnchantments || {})) {
        nodes.push({
            item: "Book",
            isBook: true,
            rc: 0,
            ench: vecFromObj({ [k]: v }),
            isTarget: false,
        });
    }

    const frontier = new MinHeap();
    frontier.push(0, {
        nodes,
        totalLevels: 0,
        steps: [],
        totalXP: 0,
    });

    const seen = new Map();
    let best = null;
    const start = performance.now();

    while (frontier.size) {
        const [, state] = frontier.pop();
        if (best && state.totalLevels >= best.totalLevels) break;

        if (state.nodes.length === 1) {
            best = {
                ...state,
                finalItem: state.nodes[0],
                timeMs: performance.now() - start,
            };
            break;
        }

        for (let i = 0; i < state.nodes.length; i++) {
            for (let j = 0; j < state.nodes.length; j++) {
                if (i === j) continue;

                const r = combine(state.nodes[i], state.nodes[j]);
                if (!r) continue;

                const next = state.nodes.filter(
                    (_, idx) => idx !== i && idx !== j
                );
                next.push(r.node);

                const k = next
                    .map(
                        (n) => `${n.item}|${n.rc}|${n.isBook}|${vecKey(n.ench)}`
                    )
                    .sort()
                    .join("||");

                const newCost = state.totalLevels + r.levels;
                if (seen.has(k) && seen.get(k) <= newCost) continue;
                seen.set(k, newCost);

                frontier.push(newCost, {
                    nodes: next,
                    totalLevels: newCost,
                    totalXP: state.totalXP + r.xp,
                    steps: state.steps.concat(r),
                });
            }
        }
    }

    if (!best)
        return {
            success: false,
            reason: "No valid merge order found",
            timeMs: performance.now() - start,
        };

    const steps = best.steps.map((s) => ({
        left: formatNode(s.left),
        right: formatNode(s.right),
        result: formatNode(s.node),
        levels: s.levels,
        xp: s.xp,
        pw: s.pw,
        changes: s.changes,
    }));

    return {
        success: true,
        totalLevels: best.totalLevels,
        totalXP: best.totalXP,
        timeMs: best.timeMs,
        steps,
        finalItem: formatFinal(best.finalItem),
    };
}

/* ===================== DISPLAY ===================== */

function formatNode(n) {
    const parts = [];
    for (let i = 0; i < ENCHANT_COUNT; i++) {
        if (n.ench[i]) parts.push(`${IDX_TO_NAME[i]} ${toRoman(n.ench[i])}`);
    }
    const e = parts.join(", ");
    return n.isBook
        ? `Book${e ? " (" + e + ")" : ""}`
        : `${n.item}${e ? " (" + e + ")" : ""}`;
}

function formatFinal(n) {
    const ench = {};
    for (let i = 0; i < ENCHANT_COUNT; i++) {
        if (n.ench[i]) ench[IDX_TO_NAME[i]] = n.ench[i];
    }
    return { item: n.item, ench };
}

function toRoman(num) {
    const map = [
        ["M", 1000],
        ["CM", 900],
        ["D", 500],
        ["CD", 400],
        ["C", 100],
        ["XC", 90],
        ["L", 50],
        ["XL", 40],
        ["X", 10],
        ["IX", 9],
        ["V", 5],
        ["IV", 4],
        ["I", 1],
    ];
    let out = "";
    for (const [s, v] of map) {
        while (num >= v) {
            out += s;
            num -= v;
        }
    }
    return out;
}
