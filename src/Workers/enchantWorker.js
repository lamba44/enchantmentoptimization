// src/workers/enchantWorker.js
// Module worker for Vite (type: "module")
import { computeOptimalEnchantPlan as computeJava } from "../data/enchantCalculator.js";
import { computeOptimalEnchantPlan as computeBedrock } from "../data/bedrockCalculator.js";

self.onmessage = async (ev) => {
    const { id, data } = ev.data || {};
    if (!id) {
        self.postMessage({
            id: null,
            success: false,
            error: "Missing id in request",
        });
        return;
    }
    try {
        // call the requested edition; calculators return plain objects
        const edition = data?.edition || "Java";
        const result =
            edition === "Java" ? computeJava(data) : computeBedrock(data);
        self.postMessage({ id, success: true, result });
    } catch (err) {
        // Return error string but do NOT abort or time-limit anything.
        self.postMessage({
            id,
            success: false,
            error: (err && err.message) || String(err),
        });
    }
};
