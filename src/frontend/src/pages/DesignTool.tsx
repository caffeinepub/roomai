import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  Clapperboard,
  Clock,
  CloudSun,
  Download,
  Droplets,
  Eraser,
  Gift,
  Globe,
  ImagePlus,
  Layers,
  LayoutGrid,
  Leaf,
  Loader2,
  Menu,
  Moon,
  Sofa,
  Sparkles,
  Sun,
  Sunset,
  TreePine,
  Video,
  Wand2,
  Waves,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import BeforeAfterSlider from "../components/BeforeAfterSlider";

interface DesignToolProps {
  onBack: () => void;
}

interface Generation {
  id: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  tool: string;
  roomType: string;
  instructions: string;
  version: number;
  timestamp: Date;
}

interface VideoGeneration {
  id: string;
  originalImageUrl: string;
  videoUrl: string;
  prompt: string;
  duration: number;
  resolution: string;
  timestamp: Date;
}

const ROOM_TYPES = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Office",
  "Dining Room",
];

type ToolId =
  | "ADD_FURNITURE"
  | "FURNITURE_ERASER"
  | "ROOM_DECLUTTERING"
  | "ENHANCE_PHOTO_QUALITY"
  | "MATERIAL_OVERLAY"
  | "AI_DESIGN_AGENT"
  | "MULTI_ANGLE_STAGING"
  | "VIRTUAL_TWILIGHT"
  | "CHANGING_SEASONS"
  | "NIGHT_TO_DAY"
  | "RAIN_TO_SHINE"
  | "NATURAL_TWILIGHT"
  | "HOLIDAY_CARD"
  | "POOL_WATER_ENHANCEMENT"
  | "LAWN_REPLACEMENT"
  | "ADD_WATER_POOL"
  | "AI_VIRTUAL_TOUR"
  | "AI_360_PANORAMA"
  | "IMAGE_TO_VIDEO";

interface Tool {
  id: ToolId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  beta?: boolean;
  modifiesFurniture?: boolean;
  prompt: (roomType: string) => string;
}

interface ToolGroup {
  label: string;
  tools: Tool[];
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    label: "Interior Design",
    tools: [
      {
        id: "ADD_FURNITURE",
        modifiesFurniture: true,
        label: "Add Furniture",
        icon: Sofa,
        prompt: (roomType) =>
          `Add tasteful, well-placed furniture to this ${roomType} that suits the space. Do not change walls, floors, windows or structural elements.`,
      },
      {
        id: "FURNITURE_ERASER",
        modifiesFurniture: true,
        label: "Furniture Eraser",
        icon: Eraser,
        prompt: (roomType) =>
          `Remove all furniture from this ${roomType}, leaving only the walls, floors, windows, and structural elements. Make it look clean and empty.`,
      },
      {
        id: "ROOM_DECLUTTERING",
        modifiesFurniture: true,
        label: "Room Decluttering",
        icon: Sparkles,
        prompt: (roomType) =>
          `Declutter and organize this ${roomType}. Remove unnecessary items, tidy up surfaces, keep the essential furniture.`,
      },
      {
        id: "ENHANCE_PHOTO_QUALITY",
        label: "Enhance Photo Quality",
        icon: Wand2,
        prompt: (roomType) =>
          `Enhance the photo quality of this ${roomType} image. Improve lighting, sharpness, color balance and overall visual quality without changing any design elements.`,
      },
      {
        id: "MATERIAL_OVERLAY",
        label: "Material Overlay",
        icon: Layers,
        prompt: (roomType) =>
          `Apply a premium material overlay to the surfaces in this ${roomType}. Update wall textures, floor materials, and finishes to look high-end.`,
      },
      {
        id: "AI_DESIGN_AGENT",
        modifiesFurniture: true,
        label: "AI Design Agent",
        icon: Bot,
        prompt: (roomType) =>
          `Act as an expert interior design agent. Comprehensively redesign this ${roomType} with the best design choices for the space, optimizing layout, furniture, colors and lighting.`,
      },
      {
        id: "MULTI_ANGLE_STAGING",
        modifiesFurniture: true,
        label: "Multi-Angle Staging",
        icon: LayoutGrid,
        prompt: (roomType) =>
          `Stage this ${roomType} for real estate with professional interior design. Add furniture, decor and lighting that would appeal to potential buyers.`,
      },
    ],
  },
  {
    label: "Seasonal & Lighting",
    tools: [
      {
        id: "VIRTUAL_TWILIGHT",
        label: "Virtual Twilight",
        icon: Sunset,
        prompt: () =>
          "Transform this exterior/room photo to a beautiful virtual twilight scene with warm golden-hour lighting, glowing windows, and a dusk sky.",
      },
      {
        id: "CHANGING_SEASONS",
        label: "Changing Seasons",
        icon: Leaf,
        prompt: () =>
          "Transform the season visible in this image. Change the outdoor environment and lighting to show a different season while keeping the building/room unchanged.",
      },
      {
        id: "NIGHT_TO_DAY",
        label: "Night to Day",
        icon: Sun,
        prompt: () =>
          "Transform this night scene to a bright daytime scene with natural daylight, blue sky, and appropriate lighting. Keep the room/building structure identical.",
      },
      {
        id: "RAIN_TO_SHINE",
        label: "Rain to Shine",
        icon: CloudSun,
        prompt: () =>
          "Transform this rainy scene to bright sunshine weather. Remove rain, add blue sky and warm sunlight. Keep all structural elements identical.",
      },
      {
        id: "NATURAL_TWILIGHT",
        label: "Natural Twilight",
        icon: Moon,
        prompt: () =>
          "Create a natural twilight atmosphere for this scene with soft purple-pink sky, balanced ambient lighting, and a serene dusk mood.",
      },
      {
        id: "HOLIDAY_CARD",
        modifiesFurniture: true,
        label: "AI Holiday Card",
        icon: Gift,
        prompt: () =>
          "Transform this room/home into a beautiful AI holiday card scene with festive decorations, warm lighting, and seasonal charm.",
      },
    ],
  },
  {
    label: "Outdoor Features",
    tools: [
      {
        id: "POOL_WATER_ENHANCEMENT",
        label: "Pool Water Enhancement",
        icon: Waves,
        prompt: () =>
          "Enhance the pool water in this image to look crystal clear, vibrant blue, and inviting. Keep all surrounding elements the same.",
      },
      {
        id: "LAWN_REPLACEMENT",
        label: "Lawn Replacement",
        icon: TreePine,
        prompt: () =>
          "Replace the existing lawn in this image with lush, perfectly manicured green grass. Keep all other elements unchanged.",
      },
      {
        id: "ADD_WATER_POOL",
        label: "Add Water to an Empty Pool",
        icon: Droplets,
        prompt: () =>
          "Add realistic, crystal-clear water to this empty pool. Make it look inviting and properly filled. Keep surrounding area unchanged.",
      },
      {
        id: "AI_VIRTUAL_TOUR",
        label: "AI Virtual Tour",
        icon: Video,
        prompt: (roomType) =>
          `Create a virtual tour-ready version of this ${roomType} with professional staging, perfect lighting, and polished presentation suitable for a real estate listing.`,
      },
      {
        id: "AI_360_PANORAMA",
        label: "AI 360° Panorama",
        icon: Globe,
        beta: true,
        prompt: () =>
          "Enhance this image for a 360° panoramic virtual tour. Improve lighting, color balance, and visual quality for an immersive panoramic presentation.",
      },
    ],
  },
  {
    label: "Video Generation",
    tools: [
      {
        id: "IMAGE_TO_VIDEO",
        label: "Image to Video",
        icon: Clapperboard,
        prompt: () =>
          "Animate this room with smooth, cinematic camera movement.",
      },
    ],
  },
];

const ALL_TOOLS = TOOL_GROUPS.flatMap((g) => g.tools);

const STATUS_MESSAGES = [
  "Analyzing your room...",
  "Applying transformation...",
  "Rendering details...",
  "Adjusting lighting...",
  "Finalizing details...",
];

const VIDEO_STATUS_MESSAGES = [
  "Analyzing image...",
  "Generating video frames...",
  "Rendering motion...",
  "Encoding video...",
  "Finalizing...",
];

const DURATION_OPTIONS = [
  { label: "4s", value: 4 },
  { label: "8s", value: 8 },
  { label: "12s", value: 12 },
];

const RESOLUTION_OPTIONS = ["1280x720", "720x1280", "1024x1024"];

function SidebarContent({
  selectedTool,
  onSelect,
}: {
  selectedTool: ToolId;
  onSelect: (id: ToolId) => void;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="py-3 pb-8">
        {TOOL_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            <p
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#9CA3AF" }}
            >
              {group.label}
            </p>
            {group.tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = selectedTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelect(tool.id)}
                  className="w-full flex items-center gap-2.5 py-2 px-3 transition-colors text-left"
                  style={{
                    backgroundColor: isActive ? "#E6F7F6" : "transparent",
                    borderLeft: isActive
                      ? "2px solid #4ECDC4"
                      : "2px solid transparent",
                    color: isActive ? "#4ECDC4" : "#374151",
                  }}
                  data-ocid={`sidebar.${tool.id.toLowerCase()}.button`}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "#F8F9FA";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "transparent";
                  }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span
                    className="text-sm flex-1 leading-tight"
                    style={{ color: isActive ? "#4ECDC4" : "#374151" }}
                  >
                    {tool.label}
                  </span>
                  {tool.beta && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: "#CCFAF7", color: "#0D9488" }}
                    >
                      Beta
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export default function DesignTool({ onBack }: DesignToolProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState("Living Room");
  const [selectedTool, setSelectedTool] = useState<ToolId>("ADD_FURNITURE");
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [videoGenerations, setVideoGenerations] = useState<VideoGeneration[]>(
    [],
  );
  const [refineTargetId, setRefineTargetId] = useState<string | null>(null);
  const [videoRefineTargetId, setVideoRefineTargetId] = useState<string | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(4);
  const [selectedResolution, setSelectedResolution] = useState("1280x720");
  const [historyTab, setHistoryTab] = useState<"images" | "videos">("images");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTool =
    ALL_TOOLS.find((t) => t.id === selectedTool) ?? ALL_TOOLS[0];
  const isVideoMode = selectedTool === "IMAGE_TO_VIDEO";

  const totalCount = generations.length + videoGenerations.length;

  useEffect(() => {
    if (totalCount > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [totalCount]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImageUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const clearUpload = () => {
    setUploadedFile(null);
    setUploadedImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startProgress = (isVideo = false) => {
    const messages = isVideo ? VIDEO_STATUS_MESSAGES : STATUS_MESSAGES;
    let msgIndex = 0;
    setStatusMsg(messages[0]);
    setProgress(0);
    // Video progress is slower (can take 1-2 min)
    const increment = isVideo ? 0.5 : 2;
    const interval = isVideo ? 800 : 600;
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        const msgI = Math.floor((next / 100) * messages.length);
        if (msgI !== msgIndex && msgI < messages.length) {
          msgIndex = msgI;
          setStatusMsg(messages[msgI]);
        }
        return next >= 90 ? 90 : next;
      });
    }, interval);
  };

  const stopProgress = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleVideoSend = async () => {
    if (!uploadedFile || !uploadedImageUrl) {
      toast.error("Please upload a room photo first");
      return;
    }
    if (isGenerating) return;

    const prompt =
      inputText.trim() ||
      "Animate this room with smooth, cinematic camera movement and subtle lighting transitions.";
    const refineTarget = videoRefineTargetId
      ? videoGenerations.find((v) => v.id === videoRefineTargetId)
      : null;

    // Use original image from refine target or current upload
    const sourceFile = uploadedFile;
    const sourceImageUrl = refineTarget
      ? refineTarget.originalImageUrl
      : uploadedImageUrl;

    setIsGenerating(true);
    startProgress(true);
    try {
      const puter = (window as any).puter;
      if (!puter) throw new Error("Puter.js not loaded");
      const videoEl = await puter.ai.txt2vid(prompt, {
        model: "sora-2",
        seconds: selectedDuration,
        size: selectedResolution,
        input_reference: sourceFile,
      });
      stopProgress();
      setProgress(100);
      setStatusMsg("Video ready!");
      const videoUrl = videoEl.src || videoEl.currentSrc;
      const newVidGen: VideoGeneration = {
        id: crypto.randomUUID(),
        originalImageUrl: sourceImageUrl,
        videoUrl,
        prompt,
        duration: selectedDuration,
        resolution: selectedResolution,
        timestamp: new Date(),
      };
      setVideoGenerations((prev) => [...prev, newVidGen]);
      setVideoRefineTargetId(null);
      setInputText("");
      toast.success("Video generated!");
    } catch (err) {
      stopProgress();
      console.error(err);
      toast.error("Video generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (isVideoMode) {
      await handleVideoSend();
      return;
    }

    if (!uploadedImageUrl) {
      toast.error("Please upload a room photo first");
      return;
    }
    if (isGenerating) return;
    const instructions = inputText.trim();

    if (refineTargetId) {
      const target = generations.find((g) => g.id === refineTargetId);
      if (!target) return;
      setIsGenerating(true);
      startProgress();
      try {
        const puter = (window as any).puter;
        if (!puter) throw new Error("Puter.js not loaded");
        const prompt = `STRICT INSTRUCTIONS (you MUST follow these exactly): ${instructions || "improve the overall look, keep structure identical"}. Refine this room design. Keep the overall layout and structure.`;
        const imageElement = await puter.ai.txt2img(prompt, {
          model: "black-forest-labs/flux.1-kontext-pro",
          image_url: target.generatedImageUrl,
        });
        stopProgress();
        setProgress(100);
        setStatusMsg("Refinement complete!");
        const newGen: Generation = {
          id: crypto.randomUUID(),
          originalImageUrl: target.originalImageUrl,
          generatedImageUrl: imageElement.src,
          tool: target.tool,
          roomType: target.roomType,
          instructions,
          version: target.version + 1,
          timestamp: new Date(),
        };
        setGenerations((prev) => [...prev, newGen]);
        setRefineTargetId(null);
        setInputText("");
        toast.success("Design refined!");
      } catch (err) {
        stopProgress();
        console.error(err);
        toast.error("Refinement failed. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    } else {
      setIsGenerating(true);
      startProgress();
      try {
        const puter = (window as any).puter;
        if (!puter) throw new Error("Puter.js not loaded");
        const strictConstraints = instructions
          ? `STRICT INSTRUCTIONS (you MUST follow these exactly): ${instructions}. `
          : "";
        const preservationConstraint = activeTool.modifiesFurniture
          ? ""
          : "IMPORTANT: Do NOT add, remove, or change any furniture or decor items. Preserve all existing furniture exactly as-is. ";
        const basePrompt = activeTool.prompt(selectedRoom);
        const prompt = `${strictConstraints}${preservationConstraint}${basePrompt}`;
        const imageElement = await puter.ai.txt2img(prompt, {
          model: "black-forest-labs/flux.1-kontext-pro",
          image_url: uploadedImageUrl,
        });
        stopProgress();
        setProgress(100);
        setStatusMsg("Done!");
        const newGen: Generation = {
          id: crypto.randomUUID(),
          originalImageUrl: uploadedImageUrl,
          generatedImageUrl: imageElement.src,
          tool: activeTool.label,
          roomType: selectedRoom,
          instructions,
          version: 1,
          timestamp: new Date(),
        };
        setGenerations((prev) => [...prev, newGen]);
        setInputText("");
        toast.success("Transformation complete!");
      } catch (err) {
        stopProgress();
        console.error(err);
        toast.error("Generation failed. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleDownload = (gen: Generation) => {
    const a = document.createElement("a");
    a.href = gen.generatedImageUrl;
    a.download = `roomai-${gen.tool.toLowerCase().replace(/ /g, "-")}-v${gen.version}.jpg`;
    a.click();
  };

  const handleVideoDownload = (gen: VideoGeneration) => {
    const a = document.createElement("a");
    a.href = gen.videoUrl;
    a.download = `roomai-video-${gen.duration}s.mp4`;
    a.click();
  };

  const startRefine = (genId: string) => {
    setRefineTargetId(genId);
    setVideoRefineTargetId(null);
    setInputText("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelRefine = () => {
    setRefineTargetId(null);
    setInputText("");
  };

  const startVideoRefine = (genId: string) => {
    setVideoRefineTargetId(genId);
    setRefineTargetId(null);
    setSelectedTool("IMAGE_TO_VIDEO");
    setInputText("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelVideoRefine = () => {
    setVideoRefineTargetId(null);
    setInputText("");
  };

  const refineTarget = refineTargetId
    ? generations.find((g) => g.id === refineTargetId)
    : null;
  const videoRefineTarget = videoRefineTargetId
    ? videoGenerations.find((v) => v.id === videoRefineTargetId)
    : null;

  // Merge and sort by timestamp for chronological chat feed
  type ChatItem =
    | { type: "image"; data: Generation }
    | { type: "video"; data: VideoGeneration };
  const chatItems: ChatItem[] = [
    ...generations.map((g) => ({ type: "image" as const, data: g })),
    ...videoGenerations.map((v) => ({ type: "video" as const, data: v })),
  ].sort((a, b) => a.data.timestamp.getTime() - b.data.timestamp.getTime());

  const year = new Date().getFullYear();
  const caffeineHref = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`;

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      {/* Top Bar */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 z-10"
        style={{
          backgroundColor: "#F8F9FA",
          borderBottom: "1px solid #E2E8F0",
          height: 56,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-gray-100"
            data-ocid="design.sidebar.open_modal_button"
          >
            <Menu className="h-4 w-4" style={{ color: "#6B7280" }} />
          </button>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-gray-100"
            data-ocid="design.back.button"
          >
            <ArrowLeft className="h-4 w-4" style={{ color: "#6B7280" }} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{
                background: "linear-gradient(135deg, #4ECDC4, #2D9B94)",
              }}
            >
              R
            </div>
            <span className="font-bold text-sm" style={{ color: "#111827" }}>
              RoomAI
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              backgroundColor: isVideoMode ? "#EEF2FF" : "#E6F7F6",
              color: isVideoMode ? "#6366F1" : "#4ECDC4",
              fontWeight: 600,
            }}
          >
            {isVideoMode && <Clapperboard className="inline h-3 w-3 mr-1" />}
            {activeTool.label}
            {activeTool.beta && (
              <span
                className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "#CCFAF7", color: "#0D9488" }}
              >
                Beta
              </span>
            )}
          </span>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100"
              style={{ color: "#6B7280", border: "1px solid #E2E8F0" }}
              data-ocid="design.history.button"
            >
              <Clock className="h-3.5 w-3.5" />
              History
              {totalCount > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: "#4ECDC4", color: "#FFFFFF" }}
                >
                  {totalCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[360px]"
            style={{
              backgroundColor: "#FFFFFF",
              borderLeft: "1px solid #E2E8F0",
            }}
          >
            <SheetHeader>
              <SheetTitle style={{ color: "#111827" }}>
                Generation History
              </SheetTitle>
            </SheetHeader>

            {/* Tab toggle */}
            <div
              className="flex mt-3 mb-1 rounded-lg overflow-hidden"
              style={{ border: "1px solid #E2E8F0" }}
            >
              <button
                type="button"
                onClick={() => setHistoryTab("images")}
                className="flex-1 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor:
                    historyTab === "images" ? "#4ECDC4" : "#FFFFFF",
                  color: historyTab === "images" ? "#FFFFFF" : "#6B7280",
                }}
                data-ocid="design.history.images.tab"
              >
                Images ({generations.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab("videos")}
                className="flex-1 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor:
                    historyTab === "videos" ? "#6366F1" : "#FFFFFF",
                  color: historyTab === "videos" ? "#FFFFFF" : "#6B7280",
                }}
                data-ocid="design.history.videos.tab"
              >
                Videos ({videoGenerations.length})
              </button>
            </div>

            <ScrollArea className="h-[calc(100vh-120px)] mt-2 pr-1">
              {historyTab === "images" ? (
                generations.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-20 gap-3"
                    data-ocid="design.history.empty_state"
                  >
                    <Clock className="h-10 w-10" style={{ color: "#E2E8F0" }} />
                    <p className="text-sm" style={{ color: "#6B7280" }}>
                      No image generations yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-8">
                    {generations.map((gen, idx) => (
                      <div
                        key={gen.id}
                        className="rounded-xl overflow-hidden"
                        style={{
                          border: "1px solid #E2E8F0",
                          backgroundColor: "#F8F9FA",
                        }}
                        data-ocid={`design.history.item.${idx + 1}`}
                      >
                        <img
                          src={gen.generatedImageUrl}
                          alt={`Version ${gen.version}`}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: "#E6F7F6",
                                color: "#4ECDC4",
                              }}
                            >
                              Version {gen.version}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "#9CA3AF" }}
                            >
                              {gen.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "#6B7280" }}
                          >
                            {gen.roomType} · {gen.tool}
                          </p>
                          {gen.instructions && (
                            <p
                              className="text-xs mt-1 truncate"
                              style={{ color: "#9CA3AF" }}
                            >
                              "{gen.instructions}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : videoGenerations.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-20 gap-3"
                  data-ocid="design.history.videos.empty_state"
                >
                  <Clapperboard
                    className="h-10 w-10"
                    style={{ color: "#E2E8F0" }}
                  />
                  <p className="text-sm" style={{ color: "#6B7280" }}>
                    No videos yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-8">
                  {videoGenerations.map((vid, idx) => (
                    <div
                      key={vid.id}
                      className="rounded-xl overflow-hidden"
                      style={{
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#F8F9FA",
                      }}
                      data-ocid={`design.history.video.item.${idx + 1}`}
                    >
                      <video
                        src={vid.videoUrl}
                        className="w-full h-32 object-cover"
                        muted
                      />
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: "#EEF2FF",
                              color: "#6366F1",
                            }}
                          >
                            {vid.duration}s
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: "#F3F4F6",
                              color: "#6B7280",
                            }}
                          >
                            {vid.resolution}
                          </span>
                          <span
                            className="text-xs ml-auto"
                            style={{ color: "#9CA3AF" }}
                          >
                            {vid.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {vid.prompt && (
                          <p
                            className="text-xs mt-1 truncate"
                            style={{ color: "#9CA3AF" }}
                          >
                            "{vid.prompt}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0"
          style={{
            width: 220,
            backgroundColor: "#FFFFFF",
            borderRight: "1px solid #E2E8F0",
          }}
          data-ocid="design.sidebar.panel"
        >
          <SidebarContent
            selectedTool={selectedTool}
            onSelect={setSelectedTool}
          />
        </aside>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="p-0 w-[240px]"
            style={{
              backgroundColor: "#FFFFFF",
              borderRight: "1px solid #E2E8F0",
            }}
            data-ocid="design.sidebar.modal"
          >
            <SheetHeader
              className="px-3 py-3"
              style={{ borderBottom: "1px solid #E2E8F0" }}
            >
              <SheetTitle className="text-sm" style={{ color: "#111827" }}>
                Tools
              </SheetTitle>
            </SheetHeader>
            <SidebarContent
              selectedTool={selectedTool}
              onSelect={(id) => {
                setSelectedTool(id);
                setSidebarOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>

        {/* Main area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Chat Area */}
          <main className="flex-1 overflow-y-auto">
            {chatItems.length === 0 && !isGenerating ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full gap-4 px-4"
                data-ocid="design.chat.empty_state"
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{
                    background: isVideoMode
                      ? "linear-gradient(135deg, #EEF2FF, #F5F3FF)"
                      : "linear-gradient(135deg, #E6F7F6, #F0FAFA)",
                    border: isVideoMode
                      ? "1px solid #C7D2FE"
                      : "1px solid #B2EBE8",
                  }}
                >
                  {isVideoMode ? (
                    <Clapperboard
                      className="h-9 w-9"
                      style={{ color: "#6366F1" }}
                    />
                  ) : (
                    <Wand2 className="h-9 w-9" style={{ color: "#4ECDC4" }} />
                  )}
                </div>
                <div className="text-center">
                  <p
                    className="text-lg font-semibold mb-1"
                    style={{ color: "#111827" }}
                  >
                    {activeTool.label}
                  </p>
                  <p className="text-sm" style={{ color: "#6B7280" }}>
                    {isVideoMode
                      ? "Upload a photo and describe the animation below"
                      : "Upload a photo below to get started"}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                <AnimatePresence>
                  {chatItems.map((item) => {
                    if (item.type === "image") {
                      const gen = item.data;
                      return (
                        <motion.div
                          key={gen.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35 }}
                          className="rounded-2xl overflow-hidden"
                          style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                          }}
                          data-ocid="design.chat.card"
                        >
                          <div
                            className="flex items-center justify-between px-4 py-3"
                            style={{ borderBottom: "1px solid #E2E8F0" }}
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle
                                className="h-4 w-4"
                                style={{ color: "#4ECDC4" }}
                              />
                              <span
                                className="text-sm font-semibold"
                                style={{ color: "#111827" }}
                              >
                                Version {gen.version}
                              </span>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: "#E6F7F6",
                                  color: "#4ECDC4",
                                }}
                              >
                                {gen.tool}
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: "#9CA3AF" }}
                              >
                                · {gen.roomType}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startRefine(gen.id)}
                                className="text-xs px-3 py-1 rounded-lg transition-colors hover:bg-teal-50"
                                style={{
                                  color: "#4ECDC4",
                                  border: "1px solid #B2EBE8",
                                }}
                                data-ocid="design.chat.edit_button"
                              >
                                Refine this
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(gen)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg transition-colors hover:bg-gray-50"
                                style={{
                                  color: "#6B7280",
                                  border: "1px solid #E2E8F0",
                                }}
                                data-ocid="design.chat.download.button"
                              >
                                <Download className="h-3 w-3" />
                                Save
                              </button>
                            </div>
                          </div>
                          <div className="relative">
                            <BeforeAfterSlider
                              beforeSrc={gen.originalImageUrl}
                              afterSrc={gen.generatedImageUrl}
                            />
                          </div>
                          {gen.instructions && (
                            <div
                              className="px-4 py-2"
                              style={{ borderTop: "1px solid #E2E8F0" }}
                            >
                              <p
                                className="text-xs"
                                style={{ color: "#9CA3AF" }}
                              >
                                "{gen.instructions}"
                              </p>
                            </div>
                          )}
                        </motion.div>
                      );
                    }

                    // Video card
                    const vid = item.data;
                    return (
                      <motion.div
                        key={vid.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="rounded-2xl overflow-hidden"
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #C7D2FE",
                        }}
                        data-ocid="design.chat.video.card"
                      >
                        <div
                          className="flex items-center justify-between px-4 py-3"
                          style={{
                            borderBottom: "1px solid #E2E8F0",
                            backgroundColor: "#F5F3FF",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Clapperboard
                              className="h-4 w-4"
                              style={{ color: "#6366F1" }}
                            />
                            <span
                              className="text-sm font-semibold"
                              style={{ color: "#111827" }}
                            >
                              Video Generated
                            </span>
                            <Badge
                              className="text-[10px] px-2 py-0.5"
                              style={{
                                backgroundColor: "#EEF2FF",
                                color: "#6366F1",
                                border: "none",
                              }}
                            >
                              {vid.duration}s
                            </Badge>
                            <Badge
                              className="text-[10px] px-2 py-0.5"
                              style={{
                                backgroundColor: "#F3F4F6",
                                color: "#6B7280",
                                border: "none",
                              }}
                            >
                              {vid.resolution}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startVideoRefine(vid.id)}
                              className="text-xs px-3 py-1 rounded-lg transition-colors hover:bg-indigo-50"
                              style={{
                                color: "#6366F1",
                                border: "1px solid #C7D2FE",
                              }}
                              data-ocid="design.chat.video.edit_button"
                            >
                              Re-generate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVideoDownload(vid)}
                              className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg transition-colors hover:bg-gray-50"
                              style={{
                                color: "#6B7280",
                                border: "1px solid #E2E8F0",
                              }}
                              data-ocid="design.chat.video.download.button"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <video
                            controls
                            src={vid.videoUrl}
                            className="w-full rounded-lg"
                            style={{ maxHeight: 400 }}
                          >
                            <track kind="captions" />
                          </video>
                        </div>
                        {vid.prompt && (
                          <div className="px-4 pb-3">
                            <p className="text-xs" style={{ color: "#9CA3AF" }}>
                              "{vid.prompt}"
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <AnimatePresence>
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-2xl p-5"
                      style={{
                        backgroundColor: isVideoMode ? "#F5F3FF" : "#F8F9FA",
                        border: `1px solid ${isVideoMode ? "#C7D2FE" : "#E2E8F0"}`,
                      }}
                      data-ocid="design.generate.loading_state"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Loader2
                          className="h-5 w-5 animate-spin"
                          style={{ color: isVideoMode ? "#6366F1" : "#4ECDC4" }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#111827" }}
                        >
                          {statusMsg}
                        </span>
                        {isVideoMode && (
                          <span
                            className="text-xs"
                            style={{ color: "#9CA3AF" }}
                          >
                            (may take 1-2 min)
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-400 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
                        {Math.round(progress)}% complete
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={chatBottomRef} />
              </div>
            )}
          </main>

          {/* Bottom Input Bar */}
          <div
            className="flex-shrink-0"
            style={{
              backgroundColor: "#FFFFFF",
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <AnimatePresence>
              {(refineTarget || videoRefineTarget) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between px-4 py-2"
                  style={{
                    backgroundColor: videoRefineTarget ? "#F5F3FF" : "#F0FAFA",
                    borderBottom: `1px solid ${videoRefineTarget ? "#C7D2FE" : "#B2EBE8"}`,
                  }}
                >
                  <span
                    className="text-xs font-medium"
                    style={{ color: videoRefineTarget ? "#6366F1" : "#4ECDC4" }}
                  >
                    {videoRefineTarget
                      ? "Re-generating video — describe changes or adjust duration/resolution below"
                      : `Refining Version ${refineTarget?.version} — describe your changes below`}
                  </span>
                  <button
                    type="button"
                    onClick={
                      videoRefineTarget ? cancelVideoRefine : cancelRefine
                    }
                    className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-100"
                    style={{ color: videoRefineTarget ? "#6366F1" : "#4ECDC4" }}
                    data-ocid="design.refine.cancel_button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {uploadedImageUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 px-4 pt-3"
                >
                  <div className="relative">
                    <img
                      src={uploadedImageUrl}
                      alt="Uploaded"
                      className="w-12 h-12 object-cover rounded-lg"
                      style={{ border: "1px solid #E2E8F0" }}
                    />
                    <button
                      type="button"
                      onClick={clearUpload}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#9CA3AF", color: "white" }}
                      data-ocid="design.upload.delete_button"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    {uploadedFile?.name}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-colors hover:bg-gray-100"
                style={{ border: "1px solid #E2E8F0", color: "#6B7280" }}
                data-ocid="design.upload.button"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
                data-ocid="design.upload.input"
              />

              <Input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  videoRefineTarget
                    ? "Describe changes for the new video..."
                    : refineTarget
                      ? "Describe changes to apply..."
                      : isVideoMode
                        ? "Describe the video animation..."
                        : "Add instructions (optional)..."
                }
                className="flex-1 h-10 text-sm"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  color: "#111827",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                data-ocid="design.chat.input"
              />

              {isVideoMode ? (
                <>
                  {/* Duration selector */}
                  <Select
                    value={String(selectedDuration)}
                    onValueChange={(v) => setSelectedDuration(Number(v))}
                  >
                    <SelectTrigger
                      className="w-[80px] h-10 text-xs flex-shrink-0"
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #C7D2FE",
                        color: "#6366F1",
                      }}
                      data-ocid="design.video.duration.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <SelectItem
                          key={d.value}
                          value={String(d.value)}
                          className="text-xs"
                        >
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Resolution selector */}
                  <Select
                    value={selectedResolution}
                    onValueChange={setSelectedResolution}
                  >
                    <SelectTrigger
                      className="w-[110px] h-10 text-xs flex-shrink-0"
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #C7D2FE",
                        color: "#6366F1",
                      }}
                      data-ocid="design.video.resolution.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      {RESOLUTION_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger
                    className="w-[130px] h-10 text-xs flex-shrink-0"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      color: "#6B7280",
                    }}
                    data-ocid="design.room.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    {ROOM_TYPES.map((r) => (
                      <SelectItem
                        key={r}
                        value={r}
                        className="text-xs"
                        style={{ color: "#111827" }}
                      >
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <button
                type="button"
                onClick={handleSend}
                disabled={
                  !uploadedImageUrl ||
                  isGenerating ||
                  (isVideoMode && !uploadedFile)
                }
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all disabled:opacity-40"
                style={{
                  background:
                    !uploadedImageUrl || isGenerating
                      ? "#E5E7EB"
                      : isVideoMode
                        ? "linear-gradient(135deg, #6366F1, #4F46E5)"
                        : "linear-gradient(135deg, #4ECDC4, #2D9B94)",
                }}
                data-ocid="design.generate.primary_button"
              >
                {isGenerating ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    style={{ color: isVideoMode ? "#6366F1" : "#4ECDC4" }}
                  />
                ) : isVideoMode ? (
                  <Clapperboard
                    className="h-4 w-4"
                    style={{ color: uploadedImageUrl ? "#FFFFFF" : "#9CA3AF" }}
                  />
                ) : (
                  <Wand2
                    className="h-4 w-4"
                    style={{ color: uploadedImageUrl ? "#FFFFFF" : "#9CA3AF" }}
                  />
                )}
              </button>
            </div>

            <p
              className="text-center text-xs pb-2"
              style={{ color: "#9CA3AF" }}
            >
              © {year}. Built with ❤️ using{" "}
              <a
                href={caffeineHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80"
                style={{ color: "#4ECDC4" }}
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
