import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./Routes";
import "./index.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <AppRoutes />
        <Analytics />
        <SpeedInsights />
    </React.StrictMode>
);
