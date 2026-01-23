import React, { ReactNode } from "react";

interface AdminRouteProps {
  children: ReactNode;
}

// Stub component - not currently used in Next.js app
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  return <>{children}</>;
};

export default AdminRoute;
