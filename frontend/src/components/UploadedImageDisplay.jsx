import { motion } from "motion/react";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./ImageWithFallback";

/**
 * UploadedImageDisplay
 * - Shows the currently uploaded satellite image inside a styled card.
 * - Provides:
 *   - Header with filename
 *   - Image preview that uses ImageWithFallback (handles load errors + fullscreen preview)
 *   - Action area to generate a caption (or display generated caption)
 *
 * Props:
 *  - isDark: boolean, theme flag to choose light/dark styles
 *  - uploadedImage: { name, url } object for the uploaded image
 *  - caption: optional generated caption string
 *  - isGenerating: boolean indicating caption generation in progress
 *  - generateCaption: callback to start caption generation
 */
export function UploadedImageDisplay({
  isDark,
  uploadedImage,
  caption,
  isGenerating,
  generateCaption,
}) {
  return (
    <motion.div
      // small entrance animation for the whole block
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex w-full flex-col"
    >
      <Card
        // card contains header, image area and footer/action area
        className={`flex w-full flex-col overflow-hidden rounded-lg border transition-all ${
          isDark
            ? "bg-white/5 border-white/10 backdrop-blur-xl"
            : "bg-white border-[#e3edf3] shadow-xl"
        }`}
      >
        {/* Header: title + uploaded filename */}
        <div
          className={`flex shrink-0 items-center justify-between border-b px-4 py-3 ${
            isDark ? "border-white/10" : "border-[#e3edf3]"
          }`}
        >
          <div>
            <h2
              className={`font-semibold ${
                isDark ? "text-white" : "text-[#1b263b]"
              }`}
            >
              Active image
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-[#8d99ae]" : "text-[#43515f]"
              }`}
            >
              {uploadedImage.name}
            </p>
          </div>
        </div>

        {/* Image container: uses ImageWithFallback for robust loading + preview */}
        <div
          className={`relative shrink overflow-hidden ${
            isDark ? "bg-[#101b2c]" : "bg-[#e8eff4]"
          }`}
        >
          <ImageWithFallback
            src={uploadedImage.url}
            alt={uploadedImage.name}
            className="h-full max-h-[58vh] min-h-[280px] w-full object-contain"
          />
        </div>

        {/* Footer / action area:
            - If no caption yet, show a primary button to generate one.
            - While generating, button shows spinner and is disabled.
            - If caption exists, show it in a scrollable box.
        */}
        <div
          className={`px-4 py-2 shrink-0 ${
            isDark ? "border-t border-white/10" : "border-t border-[#e3edf3]"
          }`}
        >
          {!caption ? (
            <button
              onClick={generateCaption}
              disabled={isGenerating}
              className={`w-full rounded-lg px-3 py-2 font-semibold shadow-lg transition-all duration-300 ${
                isDark
                  ? "bg-linear-to-r from-[#48cae4] to-[#00b4d8] hover:from-[#48cae4] hover:to-[#0096c7] text-[#0d1b2a]"
                  : "bg-linear-to-r from-[#0077b6] to-[#005f8f] hover:from-[#0077b6] hover:to-[#0099cc] text-white"
              }`}
            >
              {isGenerating ? (
                // Inline SVG spinner shown while caption is being generated
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Caption"
              )}
            </button>
          ) : (
            // Display generated caption in a scrollable container (supports long captions)
            <div
              className={`px-4 py-2 rounded-lg max-h-32 overflow-y-auto ${
                isDark ? "bg-white/5" : "bg-[#f7fafc]"
              }`}
            >
              <p
                className={`text-sm leading-relaxed ${
                  isDark ? "text-white" : "text-[#1b263b]"
                }`}
              >
                {caption}
              </p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
