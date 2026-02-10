import React from "react";
import { TITLES, MESSAGES } from "@/constants/text";

// Stub component - AdminDashboard is not currently used in the Next.js app
// This file exists for compatibility but the actual admin dashboard
// is implemented differently in the Next.js architecture

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{TITLES.ADMIN_PANEL}</h1>
      <p className="text-slate-400 mt-2">{MESSAGES.STUB_COMPONENT_DESC}</p>
    </div>
  );
};

export default AdminDashboard;
