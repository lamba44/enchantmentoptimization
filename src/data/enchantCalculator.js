import { enchantmentsConflict, itemEnchantMap } from "./enchantmentData";

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function clone(n) {
    return {
        item: n.item,
        isBook: n.isBook,
        rc: n.rc,
        ench: { ...n.ench },
    };
}

function key(nodes) {
    return nodes
        .map((n) => {
            const e = Object.entries(n.ench)
                .sort()
                .map(([k, v]) => k + ":" + v)
                .join(",");
            return (n.isBook ? "B" : "I") + "|" + n.item + "|" + n.rc + "|" + e;
        })
        .sort()
        .join("||");
}

function disp(n) {
    const e = Object.entries(n.ench)
        .map(([k, v]) => k + " " + toRoman(v))
        .join(", ");
    return n.isBook
        ? "Book" + (e ? " (" + e + ")" : "")
        : n.item + (e ? " (" + e + ")" : "");
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
    for (let i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}

function xpForLevel(L) {
    if (L <= 16) return L * L + 6 * L;
    if (L <= 31) return Math.floor(2.5 * L * L - 40.5 * L + 360);
    return Math.floor(4.5 * L * L - 162.5 * L + 2220);
}

function getMaxLevel(enchantName) {
    for (const arr of Object.values(itemEnchantMap)) {
        for (const e of arr) {
            if (e.name === enchantName) return e.max;
        }
    }
    return 1;
}

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
};

function getMultiplier(enchantName, isBook) {
    if (multipliers[enchantName])
        return isBook
            ? multipliers[enchantName].book
            : multipliers[enchantName].item;
    return isBook ? 1 : 1;
}

function combine(aInput, bInput) {
    let a = aInput;
    let b = bInput;
    let swapped = false;
    if (a.isBook && !b.isBook) {
        const tmp = a;
        a = b;
        b = tmp;
        swapped = true;
    }
    const r = clone(a);
    r.item = a.item;
    r.isBook = a.isBook && b.isBook;
    const changes = [];
    let enchantCost = 0;
    for (const x in b.ench) {
        let applicable = true;
        let conflictCount = 0;
        for (const y in a.ench) {
            if (enchantmentsConflict(x, y) || enchantmentsConflict(y, x))
                conflictCount++;
        }
        if (conflictCount > 0) {
            enchantCost += conflictCount * 1;
            applicable = false;
        }
        if (!applicable) continue;
        const lvA = r.ench[x] || 0;
        const lvB = b.ench[x];
        const maxLv = getMaxLevel(x);
        let finalLv;
        if (lvA === lvB && lvA > 0 && lvA < maxLv)
            finalLv = Math.min(maxLv, lvA + 1);
        else finalLv = Math.min(maxLv, Math.max(lvA, lvB));
        if (finalLv !== lvA) {
            r.ench[x] = finalLv;
            changes.push([x, lvA, finalLv]);
        } else {
            r.ench[x] = lvA;
        }
        const mult = getMultiplier(x, b.isBook);
        enchantCost += mult * finalLv;
    }
    if (changes.length === 0) return null;
    const pwA = Math.max(0, 2 ** a.rc - 1);
    const pwB = Math.max(0, 2 ** b.rc - 1);
    const pwSum = pwA + pwB;
    const levels = Math.max(1, Math.floor(pwSum + enchantCost));
    if (levels >= 40) return null;
    const xp = xpForLevel(levels);
    r.rc = 1 + Math.max(a.rc, b.rc);
    return {
        node: r,
        levels,
        xp,
        pw: pwSum,
        changes,
        left: a,
        right: b,
        swapped,
    };
}

export function computeOptimalEnchantPlan(data) {
    const target = {
        item: deepClone(data.targetItem),
        isBook: false,
        rc: 0,
        ench: deepClone(data.existingEnchantments || {}),
    };
    const itemsToCombine = [target];
    if (data.sacrificeMode === "Item & Books" && data.sacrificeItem) {
        itemsToCombine.push({
            item: deepClone(data.sacrificeItem),
            isBook: false,
            rc: 0,
            ench: deepClone(data.sacrificeEnchantments || {}),
        });
    }
    if (
        data.booksEnchantments &&
        Object.keys(data.booksEnchantments).length > 0
    ) {
        for (const [enchantName, level] of Object.entries(
            data.booksEnchantments
        )) {
            itemsToCombine.push({
                item: "Book",
                isBook: true,
                rc: 0,
                ench: { [enchantName]: Number(level) },
            });
        }
    }
    if (itemsToCombine.length === 1) {
        return {
            success: true,
            totalLevels: 0,
            totalXP: 0,
            timeMs: 0,
            steps: [],
            finalItem: target,
        };
    }
    const stack = [
        {
            nodes: itemsToCombine.map(clone),
            totalLevels: 0,
            steps: [],
            totalXPpoints: 0,
        },
    ];
    const seen = new Map();
    let best = null;
    const start = performance.now();
    while (stack.length > 0) {
        const state = stack.pop();
        if (state.nodes.length === 1) {
            if (!best || state.totalLevels < best.totalLevels) {
                best = {
                    ...state,
                    finalItem: deepClone(state.nodes[0]),
                    timeMs: performance.now() - start,
                };
            }
            continue;
        }
        const n = state.nodes.length;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                const result = combine(state.nodes[i], state.nodes[j]);
                if (!result) continue;
                const newNodes = [];
                for (let k = 0; k < n; k++) {
                    if (k !== i && k !== j)
                        newNodes.push(clone(state.nodes[k]));
                }
                newNodes.push(result.node);
                const stateKey = key(newNodes);
                const newTotal = state.totalLevels + result.levels;
                if (seen.has(stateKey) && seen.get(stateKey) <= newTotal)
                    continue;
                seen.set(stateKey, newTotal);
                const leftDisp = disp(result.left);
                const rightDisp = disp(result.right);
                const resultDisp = disp(result.node);
                stack.push({
                    nodes: newNodes,
                    totalLevels: newTotal,
                    steps: [
                        ...state.steps,
                        {
                            left: leftDisp,
                            right: rightDisp,
                            result: resultDisp,
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
            reason: "No valid merge order found without exceeding 39 levels (Too Expensive).",
            timeMs: performance.now() - start,
        };
    }
    return {
        success: true,
        totalLevels: best.totalLevels,
        totalXP: best.totalXPpoints,
        timeMs: best.timeMs,
        steps: best.steps,
        finalItem: best.finalItem,
    };
}
