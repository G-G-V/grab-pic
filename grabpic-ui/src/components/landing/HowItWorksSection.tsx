import { motion } from "framer-motion";
import { Upload, ScanFace, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Event Photos",
    desc: "Organizers drag & drop hundreds or thousands of photos from any event.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: ScanFace,
    step: "02",
    title: "Take a Selfie",
    desc: "Attendees upload a single selfie. That's all our AI needs.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "Get Your Photos",
    desc: "Our AI scans every photo and returns matches ranked by confidence.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-28 border-t border-border/20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-widest">How it works</span>
          <h2 className="mt-3 text-4xl font-bold font-display md:text-5xl">
            Three Steps. <span className="gradient-text">That's It.</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="glass rounded-2xl p-8 relative overflow-hidden group hover:border-primary/30 transition-all duration-300"
            >
              <div className="absolute top-4 right-4 text-6xl font-bold font-display text-foreground/5 select-none">
                {step.step}
              </div>
              <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center mb-5`}>
                <step.icon className={`h-6 w-6 ${step.color}`} />
              </div>
              <h3 className="text-xl font-semibold font-display mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
