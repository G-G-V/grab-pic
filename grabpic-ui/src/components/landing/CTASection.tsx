import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-28 border-t border-border/20 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
      </div>
      <div className="container relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold font-display md:text-5xl text-balance">
            Ready to Transform{" "}
            <span className="gradient-text">Event Photography?</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of organizers and attendees already using GrabPic to find their moments.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gradient-primary border-0 text-lg px-10 h-12 shadow-lg shadow-primary/25" asChild>
              <Link to="/signup">
                Start For Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-10 h-12" asChild>
              <Link to="/login">Log In</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
