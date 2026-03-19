"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const userController_1 = require("../controllers/userController");
const userRouter = express_1.default.Router();
userRouter.get("/credits", auth_1.protect, userController_1.getUserCredits);
userRouter.post("/project", auth_1.protect, userController_1.createUserProject);
userRouter.get("/project/:projectId", auth_1.protect, userController_1.getUserProject);
userRouter.get("/projects", auth_1.protect, userController_1.getUserProjects);
userRouter.get("/publish-toggle/:projectId", auth_1.protect, userController_1.togglePublish);
userRouter.post("/purchase-credits", auth_1.protect, userController_1.purchaseCredits);
exports.default = userRouter;
