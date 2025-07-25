import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StoreSection } from "@/components/StoreSection";

const Stores = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <StoreSection />
      </main>
      <Footer />
    </div>
  );
};

export default Stores;
