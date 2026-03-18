import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import api from "@/configs/axios";
import { toast } from "sonner";
import {
  Loader2Icon,
  FullscreenIcon,
  SaveIcon,
  ArrowBigDownDashIcon,
  EyeIcon,
  EyeOffIcon,
  MessagesSquareIcon,
  XIcon,
  SmartphoneIcon,
  TabletIcon,
  LaptopIcon,
} from "lucide-react";
import { assets } from "../assets/assets";
import ProjectPreview, {
  type ProjectPreviewRef,
} from "../components/ProjectPreview";
import Sidebar from "../components/Sidebar";
import type { Project } from "../types";

const Projects = () => {
  console.log("Projects component rendering");
  const { projectId } = useParams();
  console.log("ProjectId from URL:", projectId);
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<"phone" | "tablet" | "desktop">(
    "desktop",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const previewRef = useRef<ProjectPreviewRef>(null);

  const fetchProject = async () => {
    console.log("Fetching project...");
    try {
      const { data } = await api.get(`/user/project/${projectId}`);
      console.log("Project data:", data);
      setProject(data.project);
      setLoading(false);
    } catch (error: any) {
      console.log("Fetch error:", error);
      toast.error(error?.response?.data?.message || error.message);
      setLoading(false);
    }
  };

  const downloadCode = () => {
    const code = previewRef.current?.getCode() || project?.current_code;
    if (!code) return;

    const element = document.createElement("a");
    const file = new Blob([code], { type: "text/html" });
    element.href = URL.createObjectURL(file);
    element.download = "index.html";
    document.body.appendChild(element);
    element.click();
  };

  const saveProject = async () => {
    const code = previewRef.current?.getCode();
    if (!code) return;
    setIsSaving(true);
    try {
      const { data } = await api.put(`/api/project/save/${projectId}`, {
        code,
      });
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async () => {
    try {
      const { data } = await api.get(`/api/user/publish-toggle/${projectId}`);
      toast.success(data.message);
      setProject((prev) =>
        prev ? { ...prev, isPublished: !prev.isPublished } : null,
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      navigate("/");
      toast.error("Please login to view your projects");
      return;
    }

    const controller = new AbortController();

    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/api/user/project/${projectId}`, {
          signal: controller.signal,
        });
        setProject(data.project);
      } catch (error: any) {
        if (error.name === "CanceledError") return;
        toast.error(error?.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();

    return () => controller.abort();
  }, [isPending, session?.user, projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="size-7 animate-spin text-violet-200" />
      </div>
    );
  }

  return project ? (
    <div className="flex flex-col h-screen w-full bg-white-900 text-black">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2">
        <div className="flex items-center gap-3">
          <img
            src={assets.logo}
            alt="logo"
            className="h-6 cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div className="max-w-64 sm:max-w-xs">
            <p className="text-sm font-medium">{project.name}</p>
            <p className="text-xs text-gray-400">
              Previewing last saved version
            </p>
          </div>
          <div className="sm:hidden flex-1 flex justify-end">
            {isMenuOpen ? (
              <MessagesSquareIcon
                onClick={() => setIsMenuOpen(false)}
                className="size-6 cursor-pointer"
              />
            ) : (
              <XIcon
                onClick={() => setIsMenuOpen(true)}
                className="size-6 cursor-pointer"
              />
            )}
          </div>
        </div>
        {/* {middle} */}
        <div className=" hidden sm:flex gap-2 bg-gray-950 p-1.5 rounded-md">
          <SmartphoneIcon
            onClick={() => setDevice("phone")}
            className={`size-6 p-1 rounded cursor-pointer ${device === "phone" ? "bg-gray-700" : ""}`}
          />
          <TabletIcon
            onClick={() => setDevice("tablet")}
            className={`size-6 p-1 rounded cursor-pointer ${device === "tablet" ? "bg-gray-700" : ""}`}
          />
          <LaptopIcon
            onClick={() => setDevice("desktop")}
            className={`size-6 p-1 rounded cursor-pointer ${device === "desktop" ? "bg-gray-700" : ""}`}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            disabled={isSaving}
            onClick={saveProject}
            className="bg-gray-500 hover:bg-gray-700 text-white px-3 py-1 flex items-center gap-2 rounded text-sm"
          >
            {isSaving ? (
              <Loader2Icon size={16} className="animate-spin" />
            ) : (
              <SaveIcon size={16} />
            )}
            Save
          </button>
          <Link
            target="_blank"
            to={`/preview/${projectId}`}
            className="flex items-center gap-2 px-3 py-1 rounded border border-gray-700 hover:border-gray-500 text-sm"
          >
            <FullscreenIcon size={16} /> Preview
          </Link>
          <button
            onClick={downloadCode}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 flex items-center gap-2 rounded text-sm"
          >
            <ArrowBigDownDashIcon size={16} /> Download
          </button>
          <button
            onClick={togglePublish}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 flex items-center gap-2 rounded text-sm"
          >
            {project.isPublished ? (
              <EyeOffIcon size={16} />
            ) : (
              <EyeIcon size={16} />
            )}
            {project.isPublished ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-auto">
        <Sidebar
          isMenuOpen={isMenuOpen}
          project={project}
          setProject={setProject}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />
        <div className="flex-1 p-2 pl-0">
          <ProjectPreview
            ref={previewRef}
            project={project}
            device={device}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-screen">
      <p className="text-2xl font-medium">Unable to load project!</p>
    </div>
  );
};

export default Projects;
