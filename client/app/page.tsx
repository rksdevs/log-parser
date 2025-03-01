import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Upload } from "@/components/upload";

const Home = () => {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* <Navigation /> */}
        <Upload />
      </div>
    </div>
  );
};

export default Home;
