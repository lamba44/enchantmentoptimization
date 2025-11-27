import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import App from "./Pages/App/App";
import Guide from "./Pages/Guide/Guide";

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/guide" element={<Guide />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;
