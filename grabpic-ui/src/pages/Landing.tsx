import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CTASection } from "@/components/landing/CTASection";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/20 bg-background/60 backdrop-blur-2xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="rounded-xl gradient-primary p-1.5 shadow-lg shadow-primary/20">
              <Camera className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display gradient-text">GrabPic</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button className="gradient-primary border-0 shadow-lg shadow-primary/20" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />

      {/* Footer */}
      <footer className="border-t border-border/20 py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">GrabPic</span>
          </div>
          <p>© 2026 GrabPic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
