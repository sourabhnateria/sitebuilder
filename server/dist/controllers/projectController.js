"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveProjectCode = exports.getProjectById = exports.getPublishedProject = exports.getProjectPreview = exports.deleteProject = exports.rollbackToVersion = exports.makeRevision = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const openai_1 = __importDefault(require("../configs/openai"));
const str = (val) => Array.isArray(val) ? val[0] : val;
// controller function to make revision
const makeRevision = async (req, res) => {
    const userId = req.userId; // from middleware
    try {
        const projectId = str(req.params.projectId);
        const { message } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!userId || !user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (user.credits < 5) {
            return res
                .status(403)
                .json({ message: "add more credits to make changes" });
        }
        if (!message || message.trim() === "") {
            return res.status(400).json({ message: "please enter a valid prompt" });
        }
        const currentProject = await prisma_1.default.websiteProject.findUnique({
            where: { id: projectId, userId },
            include: { versions: true },
        });
        if (!currentProject) {
            return res.status(404).json({ message: "Project not found" });
        }
        await prisma_1.default.conversation.create({
            data: {
                role: "user",
                content: message,
                projectId,
            },
        });
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } },
        });
        // Enhance user prompt
        const promptEnhanceResponse = await openai_1.default.chat.completions.create({
            model: "nvidia/nemotron-3-nano-30b-a3b:free",
            messages: [
                {
                    role: "system",
                    content: `You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific and actionable for a web developer.

                        Enhance this by:
                        1. Being specific about what elements to change
                        2. Mentioning design details (colors, spacing, sizes)
                        3. Clarifying the desired outcome
                        4. Using clear technical terms

                    Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).`,
                },
                {
                    role: "user",
                    content: ` User's request: "${message}"`,
                },
            ],
        });
        const EnhancedPrompt = promptEnhanceResponse.choices[0].message.content;
        await prisma_1.default.conversation.create({
            data: {
                role: "assistant",
                content: `I’ve refined your prompt to:"${EnhancedPrompt}"`,
                projectId,
            },
        });
        await prisma_1.default.conversation.create({
            data: {
                role: "assistant",
                content: "Applying updates to your site structure...",
                projectId,
            },
        });
        // generate website code
        const codeGenerationResponse = await openai_1.default.chat.completions.create({
            model: "nvidia/nemotron-3-nano-30b-a3b:free",
            messages: [
                {
                    role: "system",
                    content: `You are an expert web developer. 

                    CRITICAL REQUIREMENTS:
                    - Return ONLY the complete updated HTML code with the requested changes.
                    - Use Tailwind CSS for ALL styling (NO custom CSS).
                    - Use Tailwind utility classes for all styling changes.
                    - Include all JavaScript in <script> tags before closing </body>
                    - Make sure it's a complete, standalone HTML document with Tailwind CSS
                    - Return the HTML Code Only, nothing else

                    Apply the requested changes while maintaining the Tailwind CSS styling approach.`,
                },
                {
                    role: "user",
                    content: `Fetching the current codebase: "${currentProject.current_code}" The user wants this changes: "${EnhancedPrompt}"`,
                },
            ],
        });
        const code = codeGenerationResponse.choices[0].message.content || "";
        if (!code) {
            await prisma_1.default.conversation.create({
                data: {
                    role: "assistant",
                    content: "Unable to generate the code, please try again",
                    projectId,
                },
            });
            await prisma_1.default.user.update({
                where: { id: userId },
                data: { credits: { increment: 5 } },
            });
            return;
        }
        const version = await prisma_1.default.version.create({
            data: {
                code: code
                    .replace(/```[a-z]*\n?/gi, "")
                    .replace(/```$/g, "")
                    .trim(),
                description: "Changes made",
                projectId,
            },
        });
        await prisma_1.default.conversation.create({
            data: {
                role: "assistant",
                content: "Your site has been updated. See the results in the preview window.",
                projectId,
            },
        });
        await prisma_1.default.websiteProject.update({
            where: { id: projectId },
            data: {
                current_code: code
                    .replace(/```[a-z]*\n?/gi, "")
                    .replace(/```$/g, "")
                    .trim(),
                current_version_index: version.id,
            },
        });
        res.json({ message: "changes made successfully" });
    }
    catch (error) {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { credits: { increment: 5 } },
        });
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.makeRevision = makeRevision;
// contoller function to rollback to a specific version
const rollbackToVersion = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const projectId = str(req.params.projectId);
        const versionId = str(req.params.versionId);
        const project = await prisma_1.default.websiteProject.findUnique({
            where: { id: projectId, userId },
            include: { versions: true },
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        const version = project.versions.find((v) => v.id === versionId);
        if (!version) {
            return res.status(404).json({ message: "Version not found" });
        }
        await prisma_1.default.websiteProject.update({
            where: { id: projectId, userId },
            data: {
                current_code: version.code,
                current_version_index: version.id,
            },
        });
        await prisma_1.default.conversation.create({
            data: {
                role: "assistant",
                content: "Successfully restored to the selected version. Your preview is ready.",
                projectId,
            },
        });
        res.json({ message: "Version rolled back" });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.rollbackToVersion = rollbackToVersion;
// contoller function to delete a project
const deleteProject = async (req, res) => {
    try {
        const userId = req.userId;
        const projectId = str(req.params.projectId);
        await prisma_1.default.websiteProject.delete({
            where: { id: projectId, userId },
        });
        res.json({ message: "Project deleted successfuly" });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.deleteProject = deleteProject;
// Controller function for getting project code for preview
const getProjectPreview = async (req, res) => {
    try {
        const userId = req.userId;
        const projectId = str(req.params.projectId);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const project = await prisma_1.default.websiteProject.findFirst({
            where: { id: projectId, userId },
            include: { versions: true },
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        res.json({
            project: {
                id: project.id,
                name: project.name,
                current_code: project.current_code,
                isPublished: project.isPublished,
            },
        });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.getProjectPreview = getProjectPreview;
// Controller function for get published project
const getPublishedProject = async (req, res) => {
    try {
        const projects = await prisma_1.default.websiteProject.findMany({
            where: { isPublished: true },
            include: { user: true },
        });
        res.json({ projects });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.getPublishedProject = getPublishedProject;
// controller function for getting a single project by id
const getProjectById = async (req, res) => {
    try {
        const projectId = str(req.params.projectId);
        // const currentUserId = (req as any).userId;
        const project = await prisma_1.default.websiteProject.findFirst({
            where: { id: projectId },
        });
        // 1. Check if project exists at all
        if (!project || project.isPublished === false || !project?.current_code) {
            return res.status(404).json({ message: "Project not found" });
        }
        // DEBUG LOGS - Check your terminal to see if these match!
        // console.log("DB Project Owner ID:", project.userId);
        // console.log("Middleware User ID:", currentUserId);
        // 2. Compare. If it's NOT published AND you aren't the owner, block it.
        // const isOwner = currentUserId && project.userId === currentUserId;
        // 2. Determine Access (Published OR Owner)
        // const canAccess = project.isPublished || isOwner;
        // if (!canAccess) {
        //   return res.status(403).json({ message: "This project is private" });
        // }
        // if (!project.isPublished && !isOwner) {
        //     return res.status(403).json({ message: 'This project is private' });
        // }
        // 3. Return the WHOLE project object to match your frontend expectation
        res.json({ code: project.current_code });
    }
    catch (error) {
        console.error("Error fetching project:", error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.getProjectById = getProjectById;
// controller to save project code
const saveProjectCode = async (req, res) => {
    try {
        const userId = req.userId;
        const projectId = str(req.params.projectId);
        const { code } = req.body;
        console.log("projectId:", projectId);
        console.log("code:", code);
        if (!userId) {
            return res.status(401).json({ message: "Unauhorized" });
        }
        if (!code) {
            return res.status(400).json({ message: "Code is required" });
        }
        const project = await prisma_1.default.websiteProject.findUnique({
            where: { id: projectId, userId },
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        await prisma_1.default.websiteProject.update({
            where: { id: projectId },
            data: {
                current_code: code,
                current_version_index: "",
            },
        });
        res.json({ message: "Project saved successfully" });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.saveProjectCode = saveProjectCode;
