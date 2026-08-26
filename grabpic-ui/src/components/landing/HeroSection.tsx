import { motion, type Easing } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ScanFace } from "lucide-react";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: "easeOut" as Easing },
  }),
};

const photoUrls = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=400&fit=crop",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=300&h=250&fit=crop",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=300&h=350&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=300&h=380&fit=crop",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&h=280&fit=crop",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=300&h=320&fit=crop",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&h=360&fit=crop",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=300&h=290&fit=crop",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=340&fit=crop",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=310&fit=crop",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=370&fit=crop",
];

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[150px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-secondary/8 blur-[150px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
        <div className="absolute inset-0 animated-grid opacity-40" />
      </div>

      <div className="container relative z-10">
        <motion.div className="mx-auto max-w-4xl text-center" initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm text-primary backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              AI-Powered Photo Discovery
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-8 text-5xl font-bold leading-[1.1] font-display md:text-7xl lg:text-8xl text-balance"
          >
            Find Your Photos{" "}
            <span className="gradient-text">Instantly</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed"
          >
            Upload a selfie, and our AI finds every photo of you from thousands of event images — in seconds, not hours.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gradient-primary border-0 text-lg px-8 h-12 shadow-lg shadow-primary/25" asChild>
              <Link to="/signup">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 h-12 border-border/60 hover:bg-card/60" asChild>
              <Link to="/login">Log in</Link>
            </Button>
          </motion.div>

          {/* Animated trust metrics */}
          <motion.div variants={fadeUp} custom={4} className="mt-12 flex justify-center gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="text-foreground font-semibold">10K+</span> Events</span>
            <span className="h-4 w-px bg-border" />
            <span className="flex items-center gap-1.5"><span className="text-foreground font-semibold">2M+</span> Photos</span>
            <span className="h-4 w-px bg-border" />
            <span className="flex items-center gap-1.5"><span className="text-foreground font-semibold">500K+</span> Matches</span>
          </motion.div>
        </motion.div>

        {/* Hero visual — animated photo grid with face scan overlay */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          className="mt-20 mx-auto max-w-5xl"
        >
          <div className="glass-strong rounded-2xl p-2 glow relative">
            <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5 rounded-xl overflow-hidden">
              {photoUrls.map((url, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.06, duration: 0.4 }}
                  className="aspect-[3/4] overflow-hidden relative group rounded-lg"
                >
                  <img
                    src={url}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    alt=""
                  />
                  {/* Face detection overlay on one image */}
                  {i === 3 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[2px]">
                      <div className="relative">
                        <ScanFace className="h-10 w-10 text-secondary animate-pulse" />
                      </div>
                    </div>
                  )}
                  {/* Highlight matched images */}
                  {(i === 1 || i === 7 || i === 10) && (
                    <div className="absolute inset-0 ring-2 ring-secondary/60 rounded-lg pointer-events-none" />
                  )}
                </motion.div>
              ))}
            </div>
            {/* Scan line effect */}
            <div className="absolute inset-x-2 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent animate-scan-line pointer-events-none" style={{ top: '30%' }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
