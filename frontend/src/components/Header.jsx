import { Button } from "./ui/button";
import { Menu, Moon, Sun, LogOut, Search, User } from "lucide-react";

/**
 * Header
 * - Top navigation bar used across the app.
 * - Props:
 *   - isDark: boolean theme flag
 *   - username: string to show current user
 *   - uploadedImage: optional object; presence enables "Query Image" action
 *   - onToggleHistory: open/close chat history panel
 *   - onToggleTheme: toggle light/dark theme
 *   - onOpenQuerySidebar: open the query sidebar (only relevant if uploadedImage exists)
 *   - onLogout: sign out callback
 */
export function Header({
  isDark,
  username,
  uploadedImage,
  onToggleHistory,
  onToggleTheme,
  onOpenQuerySidebar,
  onLogout,
}) {
  return (
    <header
      // sticky top bar with subtle backdrop blur and theme-aware border/background
      className={`sticky top-0 z-30 border-b backdrop-blur-xl transition-all duration-300 ${
        isDark
          ? "border-white/10 bg-[#07111f]/82"
          : "border-[#e3edf3] bg-white/80"
      }`}
    >
      <div className="mx-auto max-w-7xl px-3 py-3 md:px-6">
        <div className="flex items-center justify-between">
          {/* Left group: menu toggle and brand */}
          <div className="flex items-center gap-4">
            <div>
              {/* Button to toggle the chat history slide-over */}
              <Button
                onClick={onToggleHistory}
                variant="ghost"
                size="icon"
                className={`rounded-lg transition-all duration-300 ${
                  isDark
                    ? "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                    : "border border-[#e3edf3] bg-white hover:bg-[#e3edf3]"
                }`}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>

            {/* Brand: logo + name (hidden on very small screens) */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-white">
                <img src="/logo.png" alt="SatQuery AI" className="h-full w-full object-cover" />
              </div>
              <span className={`font-semibold ${isDark ? "text-white" : "text-[#1b263b]"}`}>
                SatQuery AI
              </span>
            </div>
          </div>

          {/* Right group: user info, theme toggle, query action and logout */}
          <div className="flex items-center gap-3">
            {/* Compact user badge (hidden on smallest screens) */}
            <div
              className={`hidden md:flex items-center gap-2 rounded-lg px-3 py-2 backdrop-blur-sm ${
                isDark ? "bg-white/10" : "bg-[#e3edf3]"
              }`}
            >
              <User
                className={`w-4 h-4 ${
                  isDark ? "text-[#48cae4]" : "text-[#0077b6]"
                }`}
              />
              <span
                className={`text-sm ${
                  isDark ? "text-white" : "text-[#1b263b]"
                }`}
              >
                {username}
              </span>
            </div>

            {/* Theme toggle: shows sun when dark (click to switch), moon when light */}
            <div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                className={`rounded-lg transition-all ${
                  isDark ? "hover:bg-white/10" : "hover:bg-[#e3edf3]"
                }`}
              >
                {isDark ? (
                  // Display Sun icon in dark mode (indicates switching to light)
                  <Sun className="w-5 h-5 text-white" />
                ) : (
                  // Display Moon icon in light mode (indicates switching to dark)
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Query Image button: only shown if an image is uploaded */}
            {uploadedImage && (
              <div>
                <Button
                  onClick={onOpenQuerySidebar}
                  className={`rounded-lg shadow-lg transition-all duration-300 ${
                    isDark
                      ? "bg-linear-to-r from-[#48cae4] to-[#00b4d8] hover:from-[#48cae4] hover:to-[#0096c7] text-[#0d1b2a]"
                      : "bg-linear-to-r from-[#0077b6] to-[#005f8f] hover:from-[#0077b6] hover:to-[#0099cc] text-white"
                  }`}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Query Image
                </Button>
              </div>
            )}

            {/* Logout button: small icon-only control */}
            <div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="rounded-lg hover:bg-red-50 dark:text-white dark:hover:bg-red-950/20 hover:text-[#c1121f] transition-all"
              >
                <LogOut className={`w-5 h-5`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
