import React from "react";

import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Search, PlusCircle, MessageSquare, User } from "lucide-react";
import { cn } from "../utils/styles";
import imgShape from "@/assets/profile.png";

const previousChats = [
  { id: 1, title: "Analog Clock React app" },
  { id: 2, title: "Simple Design System" },
  { id: 3, title: "Figma variable planning" },
  { id: 4, title: "OKLCH token algorithm" },
  { id: 5, title: "Component naming advice" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="flex flex-col w-[260px] h-full bg-[#f5f5f5] border-r border-[#d9d9d9] p-4 justify-between shrink-0">
      <div className="flex flex-col gap-4">
        {/* Header / Brand */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-[#002D72]">
          <div className="w-6 h-6 rounded bg-[#002D72] text-white flex items-center justify-center">
            C
          </div>
          The Council
        </Link>

        {/* Search */}
        <div className="relative w-full rounded-full border border-[#d9d9d9] bg-white overflow-hidden flex items-center px-4 py-2">
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-transparent text-sm text-[#1e1e1e] placeholder:text-[#b3b3b3] focus:outline-none"
          />
          <Search className="w-4 h-4 text-[#1e1e1e] shrink-0" />
        </div>

        {/* New Council CTA */}
        <Link
          to="/new"
          className="flex items-center gap-2 px-3 py-2 w-full rounded-md bg-[#002D72] text-white font-medium text-sm hover:bg-[#002D72]/90 transition-colors mt-2"
        >
          <PlusCircle className="w-4 h-4" />
          New Council
        </Link>

        {/* Chats List */}
        <div className="flex flex-col gap-1 mt-4">
          <div className="text-xs font-semibold text-[#757575] uppercase tracking-wider mb-2">
            Previous Debates
          </div>
          {previousChats.map((chat) => (
            <Link
              key={chat.id}
              to={`/council/${chat.id}`}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-[#1e1e1e] hover:bg-white transition-colors",
                location.pathname === `/council/${chat.id}` && "bg-white font-medium shadow-sm"
              )}
            >
              <MessageSquare className="w-4 h-4 text-[#757575]" />
              <span className="truncate">{chat.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-3 pt-4 border-t border-[#d9d9d9]">
        <img
          src={imgShape}
          alt="User"
          className="w-8 h-8 rounded-full object-cover shrink-0 bg-white"
        />
        <button
          onClick={handleLogout}
          className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm rounded-md px-3 py-1.5 transition-colors cursor-pointer"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <div className="flex w-full h-screen bg-white overflow-hidden text-[#1e1e1e] flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex w-full relative h-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}