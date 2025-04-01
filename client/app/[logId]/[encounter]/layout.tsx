import { SectionCards } from "@/components/section-cards";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex w-full h-full flex-col">
      <SectionCards />
      {children}
    </div>
  );
};

export default Layout;
