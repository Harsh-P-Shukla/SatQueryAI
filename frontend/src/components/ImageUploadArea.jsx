import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Upload, ImageIcon, Link } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

/**
 * ImageUploadArea
 * - Tabbed UI that lets the user provide a satellite image via a direct link or file upload.
 * - Props:
 *   - isDark: boolean for theme styling
 *   - isDragging: boolean whether a drag-over is active (changes copy/styles)
 *   - imageLink: controlled input value for the link tab
 *   - isLoading: disables actions while processing
 *   - fileInputRef: ref to hidden file input (used to trigger file picker)
 *   - onFileUpload: handler for file input change
 *   - onDragOver / onDragLeave / onDrop: drag-and-drop handlers for file area
 *   - onImageLinkChange: controlled input updater for link field
 *   - onImageLinkSubmit: handler to submit the provided image URL
 */
export function ImageUploadArea({
  isDark,
  isDragging,
  imageLink,
  isLoading,
  fileInputRef,
  onFileUpload,
  onDragOver,
  onDragLeave,
  onDrop,
  onImageLinkChange,
  onImageLinkSubmit,
}) {
  return (
    <Tabs defaultValue="upload" className="w-full">
      {/* Tab switcher: Link vs Upload */}
      <TabsList className="grid w-full grid-cols-2 rounded-lg bg-white/5 p-1">
        <TabsTrigger
          value="upload"
          className={`rounded-md data-[state=active]:bg-cyan-300 ${
            isDark ? "text-white" : "data-[state=active]:text-white"
          } data-[state=active]:text-[#07111f] transition-all`}
        >
          Upload
        </TabsTrigger>
        <TabsTrigger
          value="link"
          className={`rounded-md data-[state=active]:bg-cyan-300 ${
            isDark ? "text-white" : "data-[state=active]:text-white"
          } data-[state=active]:text-[#07111f] transition-all`}
        >
          Link
        </TabsTrigger>
      </TabsList>

      {/* Link tab: user pastes a direct image URL */}
      <TabsContent value="link" className="sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card
            className={`rounded-lg border p-6 transition-all duration-300 md:p-10 ${
              isDark
                ? "bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10"
                : "bg-white border-[#e3edf3] hover:shadow-xl"
            }`}
          >
            <div className="text-center space-y-6">
              {/* Decorative icon block */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-lg ${
                  isDark
                    ? "bg-linear-to-br from-[#48cae4]/20 to-[#0077b6]/20"
                    : "bg-linear-to-br from-[#e3edf3] to-[#c7d4de]"
                }`}
              >
                <Link
                  className={`h-9 w-9 ${
                    isDark ? "text-[#48cae4]" : "text-[#0077b6]"
                  }`}
                />
              </motion.div>

              {/* Title + help text */}
              <div>
                <h2
                  className={`mb-2 ${isDark ? "text-white" : "text-[#1b263b]"}`}
                >
                  Enter Satellite Image Link
                </h2>
                <p className={isDark ? "text-[#8d99ae]" : "text-[#43515f]"}>
                  Paste a direct image URL (jpg, jpeg, png, svg)
                </p>
              </div>

              {/* Input + submit button */}
              <div className="flex flex-col items-center justify-center gap-4 w-full">
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={imageLink}
                  onChange={(e) => onImageLinkChange(e.target.value)}
                  className={`w-full rounded-lg border px-4 py-4 outline-none transition-all duration-300 sm:w-2/3 ${
                    isDark
                      ? "bg-white/5 border-white/10 text-white placeholder:text-[#8d99ae] focus:border-[#48cae4]"
                      : "bg-[#f9fbfd] border-[#cbd5e1] text-[#1b263b] placeholder:text-[#94a3b8] focus:border-[#0077b6]"
                  }`}
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    disabled={isLoading}
                    onClick={onImageLinkSubmit}
                    className={`rounded-lg px-8 py-6 shadow-lg transition-all duration-300 ${
                      isDark
                        ? "bg-linear-to-r from-[#48cae4] to-[#00b4d8] hover:from-[#48cae4] hover:to-[#0096c7] text-[#0d1b2a]"
                        : "bg-linear-to-r from-[#0077b6] to-[#005f8f] hover:from-[#0077b6] hover:to-[#0099cc] text-white"
                    }`}
                  >
                    <span className="relative flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      {isLoading ? "Processing..." : "Use Image Link"}
                    </span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      </TabsContent>

      {/* Upload tab: drag-and-drop or file picker */}
      <TabsContent value="upload" className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`cursor-pointer rounded-lg border p-6 transition-all duration-300 md:p-10 ${
              isDark
                ? `bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 ${
                    isDragging ? "border-[#48cae4]" : ""
                  }`
                : `bg-white border-[#e3edf3] hover:shadow-xl ${
                    isDragging ? "border-[#0077b6]" : ""
                  }`
            }`}
          >
            <div className="text-center space-y-6">
              {/* Decorative upload icon block (animates subtly) */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-lg ${
                  isDark
                    ? "bg-linear-to-br from-[#48cae4]/20 to-[#0077b6]/20"
                    : "bg-linear-to-br from-[#e3edf3] to-[#c7d4de]"
                }`}
              >
                <Upload
                  className={`h-9 w-9 ${
                    isDark ? "text-[#48cae4]" : "text-[#0077b6]"
                  }`}
                />
              </motion.div>

              {/* Title and drag instructions (changes when dragging) */}
              <div>
                <h2
                  className={`mb-2 ${isDark ? "text-white" : "text-[#1b263b]"}`}
                >
                  {isDragging ? "Drop image here" : "Upload Satellite Image"}
                </h2>
                <p className={isDark ? "text-[#8d99ae]" : "text-[#43515f]"}>
                  {isDragging
                    ? "Release to upload"
                    : "Drag & drop or select an image for analysis"}
                </p>
              </div>

              {/* Hidden file input triggered by the Select Image button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.svg"
                onChange={onFileUpload}
                className="hidden"
              />

              {/* Button to open native file picker */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-lg px-8 py-6 shadow-lg transition-all duration-300 ${
                    isDark
                      ? "bg-linear-to-r from-[#48cae4] to-[#00b4d8] hover:from-[#48cae4] hover:to-[#0096c7] text-[#0d1b2a]"
                      : "bg-linear-to-r from-[#0077b6] to-[#005f8f] hover:from-[#0077b6] hover:to-[#0099cc] text-white"
                  }`}
                >
                  <span className="relative flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Select Image
                  </span>
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </TabsContent>
    </Tabs>
  );
}
