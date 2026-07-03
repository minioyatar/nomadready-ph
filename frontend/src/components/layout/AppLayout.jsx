import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

// App shell layout using Tailwind utility classes.
export default function AppLayout() {
	return (
		<div className="flex min-h-screen bg-[#F7F4EF]">
			<Sidebar />
			<main className="flex-1 min-w-0 p-[26px_30px_44px] flex flex-col gap-5">
				<Topbar />
				<Outlet />
			</main>
		</div>
	);
}

