import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Menu,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import BeforeAfterSlider from "../components/BeforeAfterSlider";

declare const puter: any;

interface DesignToolProps {
  onBack: () => void;
}

type FeatureId =
  | "ai-interior"
  | "add-furniture"
  | "furniture-eraser"
  | "room-declutter"
  | "enhance-photo"
  | "material-overlay"
  | "changing-seasons"
  | "rain-to-shine"
  | "natural-twilight"
  | "virtual-twilight"
  | "night-to-day"
  | "add-water-pool"
  | "pool-water-enhance"
  | "lawn-replacement"
  | "sky-replacement"
  | "color-palette";

interface SidebarItem {
  id: FeatureId;
  label: string;
  icon: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: "Interior Design",
    items: [
      { id: "ai-interior", label: "AI Interior Design", icon: "✨" },
      { id: "add-furniture", label: "Add Furniture", icon: "🛋️" },
      { id: "furniture-eraser", label: "Furniture Eraser", icon: "🧹" },
      { id: "room-declutter", label: "Room Declutter", icon: "📦" },
      { id: "enhance-photo", label: "Enhance Photo Quality", icon: "📸" },
      { id: "material-overlay", label: "Material Overlay", icon: "🪨" },
    ],
  },
  {
    title: "Seasonal & Lighting",
    items: [
      { id: "changing-seasons", label: "Changing Seasons", icon: "🍂" },
      { id: "rain-to-shine", label: "Rain to Shine", icon: "☀️" },
      { id: "natural-twilight", label: "Natural Twilight", icon: "🌅" },
      { id: "virtual-twilight", label: "Virtual Twilight", icon: "🌆" },
      { id: "night-to-day", label: "Night to Day", icon: "🌞" },
    ],
  },
  {
    title: "Outdoor Features",
    items: [
      { id: "add-water-pool", label: "Add Water to Empty Pool", icon: "🏊" },
      { id: "pool-water-enhance", label: "Pool Water Enhancement", icon: "💧" },
      { id: "lawn-replacement", label: "Lawn Replacement", icon: "🌿" },
      { id: "sky-replacement", label: "Sky Replacement", icon: "🌤️" },
      { id: "color-palette", label: "Color Palette Change", icon: "🎨" },
    ],
  },
];

const ROOM_TYPES = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Office",
  "Dining Room",
];

const STYLES = [
  { name: "Modern", emoji: "🏙️" },
  { name: "Minimalist", emoji: "⬜" },
  { name: "Scandinavian", emoji: "🌲" },
  { name: "Industrial", emoji: "🏭" },
  { name: "Bohemian", emoji: "🌿" },
  { name: "Farmhouse", emoji: "🏡" },
  { name: "Contemporary", emoji: "✨" },
  { name: "Mid-Century", emoji: "🪑" },
  { name: "Coastal", emoji: "🌊" },
  { name: "Art Deco", emoji: "🎭" },
];

const FEATURES_WITH_ROOM_STYLE: FeatureId[] = [
  "ai-interior",
  "add-furniture",
  "material-overlay",
  "color-palette",
];

const STATUS_MESSAGES = [
  "Analyzing your room...",
  "Applying transformations...",
  "Rendering details...",
  "Adjusting lighting...",
  "Finalizing design...",
];

function buildPrompt(
  feature: FeatureId,
  roomType: string,
  style: string,
  custom: string,
): string {
  const customPart = custom ? ` ${custom}.` : "";
  const prompts: Record<FeatureId, string> = {
    "ai-interior": `Redesign this ${roomType} in ${style} style. Keep layout identical, only change decor, furniture, colors and materials.${customPart}`,
    "add-furniture": `Add stylish ${style} furniture to this empty or sparse ${roomType}. Keep architecture identical.${customPart}`,
    "furniture-eraser": `Remove all furniture from this room, show only empty clean room with walls, floors and architecture.${customPart}`,
    "room-declutter": `Declutter and organize this ${roomType}, remove all clutter and mess, keep only essential furniture.${customPart}`,
    "enhance-photo": `Enhance the photo quality and lighting of this room, make it look like a professional real estate photo.${customPart}`,
    "material-overlay": `Change the materials and textures in this room - floors, walls, surfaces - to premium ${style} materials.${customPart}`,
    "changing-seasons": `Transform the outdoor view and lighting of this space to show a different season, keep the room interior identical.${customPart}`,
    "rain-to-shine": `Transform the rainy wet weather outside to bright sunny weather, keep the room interior identical.${customPart}`,
    "natural-twilight": `Apply natural golden hour twilight lighting to this space, warm sunset tones.${customPart}`,
    "virtual-twilight": `Apply virtual twilight effect, transform daytime exterior view to a beautiful dusk twilight scene.${customPart}`,
    "night-to-day": `Transform the nighttime scene to bright daytime with natural sunlight.${customPart}`,
    "add-water-pool": `Fill the empty swimming pool in this image with clean crystal blue water.${customPart}`,
    "pool-water-enhance": `Enhance the swimming pool water to make it look crystal clear, vibrant blue and inviting.${customPart}`,
    "lawn-replacement": `Replace and enhance the lawn/grass area with lush green perfect grass landscaping.${customPart}`,
    "sky-replacement": `Replace the sky in this image with a dramatic beautiful sky - golden sunset or clear blue sky.${customPart}`,
    "color-palette": `Change the color palette of this ${roomType} to a cohesive ${style} color scheme.${customPart}`,
  };
  return prompts[feature];
}

export default function DesignTool({ onBack }: DesignToolProps) {
  const [selectedFeature, setSelectedFeature] =
    useState<FeatureId>("ai-interior");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("Living Room");
  const [selectedStyle, setSelectedStyle] = useState("Modern");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      "Interior Design": true,
      "Seasonal & Lighting": true,
      "Outdoor Features": true,
    },
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const showRoomStyle = FEATURES_WITH_ROOM_STYLE.includes(selectedFeature);

  const activeFeatureLabel =
    SIDEBAR_GROUPS.flatMap((g) => g.items).find(
      (item) => item.id === selectedFeature,
    )?.label ?? "AI Interior Design";

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setUploadedFile(file);
    setGeneratedImageUrl("");
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImageUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const clearUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadedFile(null);
    setUploadedImageUrl("");
    setGeneratedImageUrl("");
  };

  const handleGenerate = async () => {
    if (!uploadedImageUrl) {
      toast.error("Please upload a room photo first");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedImageUrl("");

    let msgIndex = 0;
    setStatusMsg(STATUS_MESSAGES[0]);

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1.5;
        const msgI = Math.floor((next / 100) * STATUS_MESSAGES.length);
        if (msgI !== msgIndex && msgI < STATUS_MESSAGES.length) {
          msgIndex = msgI;
          setStatusMsg(STATUS_MESSAGES[msgI]);
        }
        return next >= 90 ? 90 : next;
      });
    }, 800);

    try {
      const prompt = buildPrompt(
        selectedFeature,
        selectedRoom,
        selectedStyle,
        customInstructions,
      );

      // Use Puter's free AI image generation (sign-in triggered automatically if needed)
      const imgEl = await puter.ai.txt2img(prompt);

      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      setProgress(100);
      setStatusMsg("Complete!");

      // imgEl is an <img> element — extract the src
      const src: string =
        typeof imgEl === "string"
          ? imgEl
          : ((imgEl as HTMLImageElement).src ?? "");

      if (!src) throw new Error("No image returned");

      setGeneratedImageUrl(src);
      toast.success("Design generated successfully!");
    } catch (err: any) {
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      console.error(err);
      const msg = err?.message ?? "Generation failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = generatedImageUrl;
    a.download = `roomai-${selectedFeature}-design.jpg`;
    a.click();
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const selectFeature = (id: FeatureId) => {
    setSelectedFeature(id);
    setSidebarOpen(false);
  };

  const year = new Date().getFullYear();
  const caffeineHref = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  const SidebarContent = (
    <ScrollArea className="h-full">
      <div className="py-4">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.title} className="mb-1">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold tracking-widest uppercase text-white/40 hover:text-white/60 transition-colors"
              onClick={() => toggleGroup(group.title)}
            >
              <span>{group.title}</span>
              {expandedGroups[group.title] ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedGroups[group.title] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectFeature(item.id)}
                      data-ocid={`sidebar.${item.id}.button`}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all text-left",
                        selectedFeature === item.id
                          ? "bg-[#6F9D79]/20 text-[#8DC49A] border-r-2 border-[#6F9D79]"
                          : "text-white/70 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span className="text-base shrink-0">{item.icon}</span>
                      <span className="leading-tight">{item.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F3F0E6" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b shrink-0"
        style={{ backgroundColor: "#EEE7DA", borderColor: "#DDD6C8" }}
      >
        <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-black/5 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-ocid="design.sidebar.toggle"
          >
            <Menu className="h-5 w-5" style={{ color: "#3A3A3A" }} />
          </button>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: "#3A3A3A" }}
            data-ocid="design.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2 ml-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: "#6F9D79" }}
            >
              R
            </div>
            <span className="font-bold text-sm" style={{ color: "#111111" }}>
              RoomAI
            </span>
          </div>

          <div
            className="ml-3 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: "#6F9D79", color: "white" }}
          >
            <Sparkles className="h-3 w-3" />
            {activeFeatureLabel}
          </div>

          <div
            className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "#EAF1EC",
              color: "#4A7A54",
              border: "1px solid #6F9D79",
            }}
          >
            <span>Powered by Puter</span>
          </div>
        </div>
      </header>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Left Sidebar */}
        <motion.aside
          className={cn(
            "fixed lg:relative top-0 left-0 h-full lg:h-auto z-40 lg:z-auto flex-shrink-0 flex flex-col",
            "lg:translate-x-0 transition-transform duration-300",
          )}
          style={{
            width: 220,
            backgroundColor: "#1E2528",
            top: "auto",
          }}
          animate={{
            x: sidebarOpen
              ? 0
              : typeof window !== "undefined" && window.innerWidth < 1024
                ? -220
                : 0,
          }}
        >
          <div
            className="px-4 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "#2E3538" }}
          >
            <span className="text-xs font-bold tracking-widest uppercase text-white/40">
              Tools
            </span>
            <button
              type="button"
              className="lg:hidden text-white/40 hover:text-white/70"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">{SidebarContent}</div>
        </motion.aside>

        {/* Center Panel */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: "#F3F0E6" }}
        >
          <div className="max-w-xl mx-auto px-5 py-8 space-y-6">
            {/* Feature header */}
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {
                  SIDEBAR_GROUPS.flatMap((g) => g.items).find(
                    (i) => i.id === selectedFeature,
                  )?.icon
                }
              </span>
              <h1 className="text-lg font-bold" style={{ color: "#111111" }}>
                {activeFeatureLabel}
              </h1>
            </div>

            {/* Upload */}
            <section>
              <h2
                className="text-sm font-semibold mb-2 uppercase tracking-wide"
                style={{ color: "#6F6F6F" }}
              >
                Upload Photo
              </h2>
              <label
                htmlFor="room-file-input"
                className="block rounded-xl border-2 border-dashed transition-colors cursor-pointer"
                style={{
                  borderColor: isDragging ? "#6F9D79" : "#DDD6C8",
                  backgroundColor: isDragging ? "#EAF1EC" : "#FAF8F1",
                  minHeight: 180,
                }}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                data-ocid="design.upload.dropzone"
              >
                <input
                  id="room-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFile(e.target.files[0])
                  }
                  data-ocid="design.upload.input"
                />
                {uploadedFile ? (
                  <div className="relative">
                    <img
                      src={uploadedImageUrl}
                      alt="Uploaded room"
                      className="w-full h-52 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center"
                      onClick={clearUpload}
                      data-ocid="design.upload.delete_button"
                    >
                      <X className="h-4 w-4" style={{ color: "#3A3A3A" }} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: "#EAF1EC" }}
                    >
                      <Upload
                        className="h-6 w-6"
                        style={{ color: "#6F9D79" }}
                      />
                    </div>
                    <p className="font-semibold" style={{ color: "#111111" }}>
                      Drop your photo here
                    </p>
                    <p className="text-sm" style={{ color: "#6F6F6F" }}>
                      or click to browse
                    </p>
                    <p className="text-xs" style={{ color: "#AAAAAA" }}>
                      JPG, PNG, WEBP up to 20MB
                    </p>
                  </div>
                )}
              </label>
              <p className="text-xs mt-1.5" style={{ color: "#AAAAAA" }}>
                Your photo shows as the &ldquo;before&rdquo; in the comparison
                &mdash; the AI generates a new design from your description.
              </p>
            </section>

            {/* Room Type + Style (conditional) */}
            {showRoomStyle && (
              <>
                <section>
                  <h2
                    className="text-sm font-semibold mb-3 uppercase tracking-wide"
                    style={{ color: "#6F6F6F" }}
                  >
                    Room Type
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {ROOM_TYPES.map((room) => (
                      <button
                        key={room}
                        type="button"
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          backgroundColor:
                            selectedRoom === room ? "#6F9D79" : "#FAF8F1",
                          color: selectedRoom === room ? "white" : "#3A3A3A",
                          border: `1px solid ${selectedRoom === room ? "#6F9D79" : "#DDD6C8"}`,
                        }}
                        onClick={() => setSelectedRoom(room)}
                        data-ocid="design.room.toggle"
                      >
                        {room}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h2
                    className="text-sm font-semibold mb-3 uppercase tracking-wide"
                    style={{ color: "#6F6F6F" }}
                  >
                    Design Style
                  </h2>
                  <div className="grid grid-cols-5 gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        className="p-2.5 rounded-xl text-center transition-all"
                        style={{
                          backgroundColor:
                            selectedStyle === s.name ? "#6F9D79" : "#FAF8F1",
                          color: selectedStyle === s.name ? "white" : "#3A3A3A",
                          border: `1px solid ${selectedStyle === s.name ? "#6F9D79" : "#DDD6C8"}`,
                        }}
                        onClick={() => setSelectedStyle(s.name)}
                        data-ocid="design.style.toggle"
                      >
                        <div className="text-lg mb-0.5">{s.emoji}</div>
                        <div className="text-xs font-medium leading-tight">
                          {s.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Custom Instructions */}
            <section>
              <h2
                className="text-sm font-semibold mb-2 uppercase tracking-wide"
                style={{ color: "#6F6F6F" }}
              >
                Custom Instructions{" "}
                <span className="normal-case font-normal text-xs text-[#AAAAAA]">
                  (optional)
                </span>
              </h2>
              <Textarea
                placeholder="e.g. Use warm earth tones, add a bookshelf, keep the fireplace..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="resize-none"
                rows={3}
                style={{ backgroundColor: "#FAF8F1", borderColor: "#DDD6C8" }}
                data-ocid="design.instructions.textarea"
              />
            </section>

            {/* Puter info note */}
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
              style={{
                backgroundColor: "#EAF1EC",
                border: "1px solid #6F9D79",
                color: "#4A7A54",
              }}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>
                Generation is free via your Puter account. You'll be prompted to
                sign in when you click Generate.
              </span>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !uploadedFile}
              size="lg"
              className="w-full py-5 text-base font-semibold gap-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#6F9D79", color: "white" }}
              data-ocid="design.generate.primary_button"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" /> Generate Design
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Panel — Result */}
        <div
          className="hidden lg:flex flex-col flex-1 border-l overflow-y-auto"
          style={{ borderColor: "#DDD6C8", backgroundColor: "#F8F6EE" }}
        >
          <div className="max-w-xl mx-auto w-full px-5 py-8">
            <h2 className="text-lg font-bold mb-4" style={{ color: "#111111" }}>
              Result
            </h2>

            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl p-5 mb-4"
                  style={{
                    backgroundColor: "#FAF8F1",
                    border: "1px solid #DDD6C8",
                  }}
                  data-ocid="design.generate.loading_state"
                >
                  <p
                    className="text-sm font-medium mb-3"
                    style={{ color: "#111111" }}
                  >
                    {statusMsg}
                  </p>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs mt-2" style={{ color: "#6F6F6F" }}>
                    {progress}% complete
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {generatedImageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  data-ocid="design.result.success_state"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle
                      className="h-5 w-5"
                      style={{ color: "#6F9D79" }}
                    />
                    <p className="font-semibold" style={{ color: "#111111" }}>
                      Your design is ready!
                    </p>
                  </div>
                  <BeforeAfterSlider
                    beforeSrc={uploadedImageUrl}
                    afterSrc={generatedImageUrl}
                  />
                  <Button
                    onClick={handleDownload}
                    className="mt-4 w-full gap-2"
                    variant="outline"
                    style={{ borderColor: "#6F9D79", color: "#6F9D79" }}
                    data-ocid="design.download.button"
                  >
                    <Download className="h-4 w-4" />
                    Download Design
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {!generatedImageUrl && !isGenerating && (
              <div
                className="rounded-xl flex flex-col items-center justify-center"
                style={{
                  backgroundColor: "#FAF8F1",
                  border: "1px solid #DDD6C8",
                  minHeight: 380,
                }}
                data-ocid="design.result.empty_state"
              >
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#EEE7DA" }}
                >
                  <Wand2 className="h-9 w-9" style={{ color: "#C8BFB0" }} />
                </div>
                <p className="font-semibold" style={{ color: "#6F6F6F" }}>
                  Your design will appear here
                </p>
                <p className="text-sm mt-1" style={{ color: "#BBBBBB" }}>
                  Upload a photo and click Generate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Result panel (below center) */}
      <div
        className="lg:hidden border-t px-5 py-6"
        style={{ borderColor: "#DDD6C8", backgroundColor: "#F8F6EE" }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: "#111111" }}>
          Result
        </h2>

        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl p-5 mb-4"
              style={{
                backgroundColor: "#FAF8F1",
                border: "1px solid #DDD6C8",
              }}
              data-ocid="design.mobile.loading_state"
            >
              <p
                className="text-sm font-medium mb-3"
                style={{ color: "#111111" }}
              >
                {statusMsg}
              </p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs mt-2" style={{ color: "#6F6F6F" }}>
                {progress}% complete
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {generatedImageUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5" style={{ color: "#6F9D79" }} />
              <p className="font-semibold" style={{ color: "#111111" }}>
                Your design is ready!
              </p>
            </div>
            <BeforeAfterSlider
              beforeSrc={uploadedImageUrl}
              afterSrc={generatedImageUrl}
            />
            <Button
              onClick={handleDownload}
              className="mt-4 w-full gap-2"
              variant="outline"
              style={{ borderColor: "#6F9D79", color: "#6F9D79" }}
            >
              <Download className="h-4 w-4" />
              Download Design
            </Button>
          </motion.div>
        ) : !isGenerating ? (
          <div
            className="rounded-xl flex flex-col items-center justify-center py-12"
            style={{ backgroundColor: "#FAF8F1", border: "1px solid #DDD6C8" }}
          >
            <Wand2 className="h-10 w-10 mb-3" style={{ color: "#C8BFB0" }} />
            <p className="text-sm" style={{ color: "#AAAAAA" }}>
              Upload a photo and click Generate
            </p>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <footer
        className="shrink-0 border-t"
        style={{ borderColor: "#DDD6C8", backgroundColor: "#EEE7DA" }}
      >
        <div className="px-6 py-4 text-center">
          <p className="text-xs" style={{ color: "#6F6F6F" }}>
            © {year}. Built with ❤️ using{" "}
            <a
              href={caffeineHref}
              className="underline hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
