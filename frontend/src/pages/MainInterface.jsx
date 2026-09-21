import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { useImageUpload } from "../hooks/useImageUpload";
import { useQueryManagement } from "../hooks/useQueryManagement";
import { useChatManagement } from "../hooks/useChatManagement";
import { BackgroundEffects } from "../components/BackgroundEffects";
import { ChatHistoryPanel } from "../components/ChatHistoryPanel";
import { Header } from "../components/Header";
import { ImageUploadArea } from "../components/ImageUploadArea";
import { UploadedImageDisplay } from "../components/UploadedImageDisplay";
import { QueryResultsList } from "../components/QueryResultList";
import { QuerySidebar } from "../components/QuerySidebar";
import { backendLink } from "../lib/config.js";

/**
 * MainInterface
 * - Primary logged-in UI that composes uploads, chat history, query sidebar,
 *   image preview and query results together.
 *
 * Props:
 *  - onLogout: callback to sign the user out
 *  - theme: "dark" | "light" used to style children
 *  - onToggleTheme: toggles the app theme
 *  - username: current user's display name
 */
export function MainInterface({ onLogout, theme, onToggleTheme, username }) {
  // Sidebar / history panel visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [modelMode, setModelMode] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${backendLink}/api/model-info`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(info => setModelMode(info?.mode ?? null))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // boolean convenience used widely for conditional classes
  const isDark = theme === "dark";

  // Read persisted auth; onLogout will be called by hook when no valid session
  const { userData } = useAuth(onLogout);

  // Chat session management: loads sessions, select/new/delete handlers, caption generation
  const {
    chatSessions,
    setChatSessions,
    currentChatId,
    caption,
    isGenerating,
    generateCaption,
    setCurrentChatId,
    handleSelectChat,
    handleNewChat,
    handleDeleteChat,
  } = useChatManagement(userData, isDark, setSidebarOpen);

  // Query management: input state, run handlers, results storage for the active chat
  const {
    query,
    setQuery,
    isProcessing,
    queryResults,
    setQueryResults,
    handleRunQuery,
    groundingQuery,
    setGroundingQuery,
    isGroundingProcessing,
    setIsGroundingProcessing,
    handleRunGrounding,
    queryType,
    setQueryType,
  } = useQueryManagement(currentChatId, setChatSessions, theme);

  // Image upload handling: file/link upload, drag state, and uploaded image object
  const {
    uploadedImage,
    setUploadedImage,
    imageLink,
    setImageLink,
    isLoading,
    isDragging,
    fileInputRef,
    handleFileUpload,
    handleImageLinkSubmit,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useImageUpload(
    userData,
    isDark,
    setChatSessions,
    setCurrentChatId,
    setSidebarOpen
  );

  // Download a PDF/CSV report for the currently selected chat session (opens in new tab)
  const onDownloadReport = () => {
    window.open(`${backendLink}/api/chat/${currentChatId}/report`, "_blank");
  };

  return (
    <>
      {/* Toast container for user notifications */}
      <ToastContainer />
      <div className="satquery-space-shell min-h-screen transition-colors duration-500">
        {/* Decorative background effects (stars, gradients, etc.) */}
        <BackgroundEffects isDark={isDark} />

        {/* Slide-in chat history panel (left or right depending on layout) */}
        <ChatHistoryPanel
          chatSessions={chatSessions}
          currentChatId={currentChatId}
          onSelectChat={(chatId) =>
            handleSelectChat(
              chatId,
              setUploadedImage,
              setQueryResults,
            )
          }
          onNewChat={() =>
            handleNewChat(setUploadedImage, setQueryResults, fileInputRef)
          }
          onDeleteChat={(chatId) =>
            handleDeleteChat(
              chatId,
              setUploadedImage,
              setQueryResults,
              fileInputRef
            )
          }
          isOpen={historyPanelOpen}
          onToggle={() => {
            // Toggling history should close the query sidebar to avoid overlap
            setHistoryPanelOpen(!historyPanelOpen);
            setSidebarOpen(false);
          }}
          theme={theme}
        />

        {/* Top header with menu, theme toggle, query open and logout */}
        <Header
          isDark={isDark}
          username={username}
          uploadedImage={!!uploadedImage}
          historyPanelOpen={historyPanelOpen}
          onToggleHistory={() => {
            setHistoryPanelOpen(!historyPanelOpen);
            setSidebarOpen(false);
          }}
          onToggleTheme={onToggleTheme}
          onOpenQuerySidebar={() => setSidebarOpen(true)}
          onLogout={onLogout}
        />

        {/* Main container: either upload area or image + results layout */}
        {modelMode === "public" && (
          <p className="relative z-10 mx-auto max-w-4xl px-6 pt-4 text-sm text-cyan-100/85">
            Public model demo · RGB images · Custom fine-tuning, DIOR detection, SAR fusion and temporal change analysis are not enabled.
          </p>
        )}
        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:py-10">
          <div
            className={`${
              uploadedImage && queryResults.length !== 0
                ? "max-w-5xl 2xl:max-w-6xl mx-auto"
                : "max-w-4xl mx-auto"
            }`}
          >
            {/* If no image uploaded -> show the upload UI (link or file) */}
            {!uploadedImage ? (
              <ImageUploadArea
                isDark={isDark}
                isDragging={isDragging}
                imageLink={imageLink}
                isLoading={isLoading}
                fileInputRef={fileInputRef}
                onFileUpload={handleFileUpload}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onImageLinkChange={setImageLink}
                onImageLinkSubmit={handleImageLinkSubmit}
              />
            ) : (
              /* When an image is uploaded, show preview + results area */
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                {/* Uploaded image preview */}
                {queryResults.length > 0 && (
                  <div className="lg:sticky lg:top-24">
                    <UploadedImageDisplay
                      isDark={isDark}
                      uploadedImage={uploadedImage}
                      caption={caption}
                      isGenerating={isGenerating}
                      generateCaption={generateCaption}
                      />
                  </div>
                )}

                {/* Query results list column */}
                {queryResults.length > 0 && (
                  <div className="min-w-0">
                    <QueryResultsList
                      isDark={isDark}
                      queryResults={queryResults}
                    />
                  </div>
                )}

                {/* If no results yet, center the uploaded image display */}
                {queryResults.length === 0 && (
                  <div className="max-w-3xl mx-auto">
                    <UploadedImageDisplay
                      isDark={isDark}
                      uploadedImage={uploadedImage}
                      caption={caption}
                      isGenerating={isGenerating}
                      generateCaption={generateCaption}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Query sidebar: contains query inputs, voice controls and run buttons */}
        <QuerySidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          query={query}
          onQueryChange={setQuery}
          onRunQuery={handleRunQuery}
          onRunGrounding={handleRunGrounding}
          isProcessing={isProcessing}
          onDownloadReport={onDownloadReport}
          isGroundingProcessing={isGroundingProcessing}
          setIsGroundingProcessing={setIsGroundingProcessing}
          groundingQuery={groundingQuery}
          setGroundingQuery={setGroundingQuery}
          handleRunGrounding={handleRunGrounding}
          queryType={queryType}
          setQueryType={setQueryType}
          theme={theme}
        />
      </div>
    </>
  );
}
