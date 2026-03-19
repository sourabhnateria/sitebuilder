"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_1 = require("better-auth/node");
const auth_1 = require("./lib/auth");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const stripeWebhook_1 = require("./controllers/stripeWebhook");
const app = (0, express_1.default)();
// Middleware
// app.use(cors())
app.use(express_1.default.json());
const port = 3000;
const CORSOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(",") || [],
    credentials: true,
};
app.use((0, cors_1.default)(CORSOptions));
app.post("/api/stripe", express_1.default.raw({ type: "application/json" }), stripeWebhook_1.stripeWebhook);
app.all("/api/auth/{*any}", (0, node_1.toNodeHandler)(auth_1.auth));
app.use(express_1.default.json({ limit: "50mb" }));
app.get("/", (req, res) => {
    res.send("Server is Live!");
});
app.use("/api/user", userRoutes_1.default);
app.use("/api/project", projectRoutes_1.default);
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
