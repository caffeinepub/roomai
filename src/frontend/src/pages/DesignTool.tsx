import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Loader2,
  RefreshCw,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import BeforeAfterSlider from "../components/BeforeAfterSlider";

interface DesignToolProps {
  onBack: () => void;
}

const ROOM_TYPES = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Office",
  "Dining Room",
];

const STYLES = [
  { name: "No Style", emoji: "🚫", color: "#2A2A3E" },
  { name: "Modern", emoji: "🏙️", color: "#2D4A6B" },
  { name: "Minimalist", emoji: "⬜", color: "#4A4A5A" },
  { name: "Scandinavian", emoji: "🌲", color: "#2D5A3D" },
  { name: "Industrial", emoji: "🏭", color: "#4A3728" },
  { name: "Bohemian", emoji: "🌿", color: "#5A4A28" },
  { name: "Farmhouse", emoji: "🏡", color: "#4A3040" },
  { name: "Contemporary", emoji: "✨", color: "#2A4A5A" },
  { name: "Mid-Century", emoji: "🪑", color: "#5A3A28" },
  { name: "Coastal", emoji: "🌊", color: "#1A4A5A" },
  { name: "Art Deco", emoji: "🎭", color: "#4A2A5A" },
];

const STATUS_MESSAGES = [
  "Analyzing your room...",
  "Applying design style...",
  "Rendering furniture...",
  "Adjusting lighting...",
  "Finalizing details...",
];

export default function DesignTool({ onBack }: DesignToolProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState("Living Room");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [refinementInstructions, setRefinementInstructions] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [iterationCount, setIterationCount] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setUploadedFile(file);
    setGeneratedImageUrl("");
    setIterationCount(1);
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
    setIterationCount(1);
  };

  const startProgress = () => {
    let msgIndex = 0;
    setStatusMsg(STATUS_MESSAGES[0]);
    setProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        const msgI = Math.floor((next / 100) * STATUS_MESSAGES.length);
        if (msgI !== msgIndex && msgI < STATUS_MESSAGES.length) {
          msgIndex = msgI;
          setStatusMsg(STATUS_MESSAGES[msgI]);
        }
        return next >= 90 ? 90 : next;
      });
    }, 600);
  };

  const stopProgress = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleGenerate = async () => {
    if (!uploadedImageUrl) {
      toast.error("Please upload a room photo first");
      return;
    }

    setIsGenerating(true);
    setGeneratedImageUrl("");
    startProgress();

    try {
      const puter = (window as any).puter;
      if (!puter) throw new Error("Puter.js not loaded");

      const customPart = customInstructions ? `${customInstructions}.` : "";
      let prompt: string;
      if (!selectedStyle || selectedStyle === "No Style") {
        prompt = `Enhance and redecorate this ${selectedRoom}. ${customPart} Keep the room layout and structure identical.`;
      } else {
        prompt = `Redesign this ${selectedRoom} in a ${selectedStyle} interior design style. ${customPart} Keep the room layout and structure identical, only change the decor, furniture, colors and materials.`;
      }

      const imageElement = await puter.ai.txt2img(prompt, {
        model: "black-forest-labs/flux.1-kontext-pro",
        image_url: uploadedImageUrl,
      });

      stopProgress();
      setProgress(100);
      setStatusMsg("Design complete!");
      setGeneratedImageUrl(imageElement.src);
      setIterationCount(1);
      toast.success("Your room has been redesigned!");
    } catch (err) {
      stopProgress();
      console.error(err);
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!generatedImageUrl) return;
    if (!refinementInstructions.trim()) {
      toast.error("Please add refinement instructions");
      return;
    }

    setIsRefining(true);
    startProgress();

    try {
      const puter = (window as any).puter;
      if (!puter) throw new Error("Puter.js not loaded");

      const prompt = `Refine this room design: ${refinementInstructions}. Keep the overall style and layout.`;

      const imageElement = await puter.ai.txt2img(prompt, {
        model: "black-forest-labs/flux.1-kontext-pro",
        image_url: generatedImageUrl,
      });

      stopProgress();
      setProgress(100);
      setStatusMsg("Refinement complete!");
      setGeneratedImageUrl(imageElement.src);
      setIterationCount((prev) => prev + 1);
      setRefinementInstructions("");
      toast.success("Design refined!");
    } catch (err) {
      stopProgress();
      console.error(err);
      toast.error("Refinement failed. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = generatedImageUrl;
    a.download = `roomai-${(selectedStyle || "enhanced").toLowerCase()}-v${iterationCount}.jpg`;
    a.click();
  };

  const year = new Date().getFullYear();
  const caffeineHref = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "#0F0F1A" }}
    >
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0"
        style={{
          width: 280,
          backgroundColor: "#16213E",
          borderRight: "1px solid #1E2D4F",
        }}
      >
        {/* Logo / Back */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid #1E2D4F" }}
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-white/10"
            data-ocid="design.back.button"
          >
            <ArrowLeft className="h-4 w-4" style={{ color: "#A0AEC0" }} />
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
            <span className="font-bold text-sm" style={{ color: "#F0F4F8" }}>
              RoomAI
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 py-4 space-y-5">
            {/* Room Type */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#4A6FA5" }}
              >
                Room Type
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ROOM_TYPES.map((room) => (
                  <button
                    key={room}
                    type="button"
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor:
                        selectedRoom === room ? "#4ECDC4" : "#1E2D4F",
                      color: selectedRoom === room ? "#0F0F1A" : "#A0AEC0",
                    }}
                    onClick={() => setSelectedRoom(room)}
                    data-ocid="design.room.toggle"
                  >
                    {room}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selection */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#4A6FA5" }}
              >
                Design Style
              </p>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => {
                  const isSelected =
                    selectedStyle === s.name ||
                    (s.name === "No Style" && !selectedStyle);
                  return (
                    <button
                      key={s.name}
                      type="button"
                      className="relative rounded-xl overflow-hidden text-left transition-all"
                      style={{
                        backgroundColor: s.color,
                        border: isSelected
                          ? "2px solid #4ECDC4"
                          : "2px solid transparent",
                        outline: isSelected ? "none" : undefined,
                      }}
                      onClick={() => {
                        if (s.name === "No Style") {
                          setSelectedStyle("");
                        } else {
                          setSelectedStyle(
                            selectedStyle === s.name ? "" : s.name,
                          );
                        }
                      }}
                      data-ocid="design.style.toggle"
                    >
                      <div className="p-3">
                        <div className="text-xl mb-1">{s.emoji}</div>
                        <div
                          className="text-xs font-medium leading-tight"
                          style={{ color: isSelected ? "#4ECDC4" : "#E2E8F0" }}
                        >
                          {s.name}
                        </div>
                      </div>
                      {isSelected && (
                        <div
                          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "#4ECDC4" }}
                        >
                          <CheckCircle
                            className="w-3 h-3"
                            style={{ color: "#0F0F1A" }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer attribution in sidebar */}
        <div className="px-4 py-3" style={{ borderTop: "1px solid #1E2D4F" }}>
          <p className="text-xs text-center" style={{ color: "#4A6FA5" }}>
            © {year}. Built with ❤️ using{" "}
            <a
              href={caffeineHref}
              className="underline hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4ECDC4" }}
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: "#F7F8FA" }}
      >
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {/* Upload Zone */}
          <section>
            <h2
              className="text-base font-semibold mb-3"
              style={{ color: "#1A202C" }}
            >
              Upload Your Room Photo
            </h2>
            <label
              htmlFor="room-file-input"
              className="block rounded-2xl border-2 border-dashed transition-colors cursor-pointer"
              style={{
                borderColor: isDragging ? "#4ECDC4" : "#CBD5E0",
                backgroundColor: isDragging ? "#E6FAFA" : "#FFFFFF",
                minHeight: 200,
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
                    className="w-full h-56 object-cover rounded-2xl"
                  />
                  <button
                    type="button"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
                    onClick={clearUpload}
                    data-ocid="design.upload.delete_button"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: "#EBF8F7" }}
                  >
                    <Upload className="h-7 w-7" style={{ color: "#4ECDC4" }} />
                  </div>
                  <p className="font-semibold" style={{ color: "#1A202C" }}>
                    Drop your room photo here
                  </p>
                  <p className="text-sm" style={{ color: "#718096" }}>
                    or click to browse · JPG, PNG, WEBP up to 20MB
                  </p>
                </div>
              )}
            </label>
          </section>

          {/* Custom Instructions */}
          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ color: "#1A202C" }}
            >
              Custom Instructions{" "}
              <span
                className="font-normal text-sm"
                style={{ color: "#718096" }}
              >
                (optional)
              </span>
            </h2>
            <Textarea
              placeholder="e.g. Use warm earth tones, add a bookshelf, keep the fireplace..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="resize-none bg-white"
              rows={3}
              style={{ borderColor: "#CBD5E0" }}
              data-ocid="design.instructions.textarea"
            />
          </section>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !uploadedFile}
            size="lg"
            className="w-full py-6 text-base font-semibold rounded-xl transition-all"
            style={{
              background:
                isGenerating || !uploadedFile
                  ? "#CBD5E0"
                  : "linear-gradient(135deg, #4ECDC4, #2D9B94)",
              color: isGenerating || !uploadedFile ? "#718096" : "#0F0F1A",
              border: "none",
            }}
            data-ocid="design.generate.primary_button"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Design...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Generate Design
                {selectedStyle ? ` · ${selectedStyle}` : " · No Style"}
              </>
            )}
          </Button>

          {/* Progress Bar */}
          <AnimatePresence>
            {(isGenerating || isRefining) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl p-5 bg-white shadow-sm"
                style={{ border: "1px solid #E2E8F0" }}
                data-ocid="design.generate.loading_state"
              >
                <p
                  className="text-sm font-medium mb-3"
                  style={{ color: "#1A202C" }}
                >
                  {statusMsg}
                </p>
                <Progress value={progress} className="h-2" />
                <p className="text-xs mt-2" style={{ color: "#718096" }}>
                  {progress}% complete
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {generatedImageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
                data-ocid="design.result.success_state"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className="h-5 w-5"
                      style={{ color: "#4ECDC4" }}
                    />
                    <p className="font-semibold" style={{ color: "#1A202C" }}>
                      Design Ready
                    </p>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#EBF8F7", color: "#2D9B94" }}
                    >
                      Version {iterationCount}
                    </span>
                  </div>
                  <Button
                    onClick={handleDownload}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    style={{ borderColor: "#4ECDC4", color: "#2D9B94" }}
                    data-ocid="design.download.button"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-md">
                  <BeforeAfterSlider
                    beforeSrc={uploadedImageUrl}
                    afterSrc={generatedImageUrl}
                  />
                </div>

                {/* Refine Section */}
                <div
                  className="rounded-2xl p-5 bg-white"
                  style={{ border: "1px solid #E2E8F0" }}
                >
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: "#1A202C" }}
                  >
                    ✏️ Refine This Design
                  </h3>
                  <p className="text-xs mb-3" style={{ color: "#718096" }}>
                    Describe changes to apply on top of the current result
                    (iterative editing).
                  </p>
                  <Textarea
                    placeholder="e.g. Make it brighter, add a plant in the corner, change the rug to blue..."
                    value={refinementInstructions}
                    onChange={(e) => setRefinementInstructions(e.target.value)}
                    className="resize-none bg-gray-50 mb-3"
                    rows={2}
                    style={{ borderColor: "#CBD5E0" }}
                    data-ocid="design.refine.textarea"
                  />
                  <Button
                    onClick={handleRefine}
                    disabled={isRefining || !refinementInstructions.trim()}
                    className="w-full gap-2 font-semibold rounded-xl"
                    style={{
                      background:
                        isRefining || !refinementInstructions.trim()
                          ? "#CBD5E0"
                          : "linear-gradient(135deg, #4ECDC4, #2D9B94)",
                      color:
                        isRefining || !refinementInstructions.trim()
                          ? "#718096"
                          : "#0F0F1A",
                      border: "none",
                    }}
                    data-ocid="design.refine.submit_button"
                  >
                    {isRefining ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Refining...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" /> Refine Design
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!generatedImageUrl && !isGenerating && !isRefining && (
            <div
              className="rounded-2xl flex flex-col items-center justify-center bg-white"
              style={{ border: "1px solid #E2E8F0", minHeight: 280 }}
              data-ocid="design.result.empty_state"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "#F7F8FA" }}
              >
                <Wand2 className="h-8 w-8" style={{ color: "#CBD5E0" }} />
              </div>
              <p className="font-medium" style={{ color: "#718096" }}>
                Your design will appear here
              </p>
              <p className="text-sm mt-1" style={{ color: "#CBD5E0" }}>
                Upload a photo and click Generate
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
