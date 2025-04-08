"use client";

import { AttemptProvider } from "@/context/AttemptContext";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex w-full h-full flex-col">
      <AttemptProvider>{children}</AttemptProvider>
    </div>
  );
};

export default Layout;
