
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PromoBanner() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="bg-beauty-gradient rounded-xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join Our Beauty Rewards Program</h2>
              <p className="text-white/80 mb-6 text-lg">
                Earn points with every purchase, get exclusive deals, early access to sales, and personalized recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-white text-beauty-purple hover:bg-white/90">
                  <Link to="/account/register">Sign Up Now</Link>
                </Button>
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                  <Link to="/rewards">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="relative hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1598452963314-b09f397a5c48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                alt="Beauty products arrangement"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
