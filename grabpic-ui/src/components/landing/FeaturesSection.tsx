import { motion } from "framer-motion";
import { Zap, Shield, Users, Globe, Lock, BarChart3 } from "lucide-react";

const features = [
  { icon: Zap, title: "Sub-3s Search", desc: "Optimized vector search returns results in under 3 seconds." },
  { icon: Shield, title: "Privacy First", desc: "Facial embeddings are encrypted. No face images are stored." },
  { icon: Users, title: "10K+ Photos", desc: "Handle events with tens of thousands of photos effortlessly." },
  { icon: Globe, title: "Any Device", desc: "Responsive design works on phones, tablets, and desktops." },
  { icon: Lock, title: "Secure Uploads", desc: "Pre-signed URLs ensure photos are uploaded securely." },
  { icon: BarChart3, title: "Organizer Analytics", desc: "Track uploads, detections, and searches in real-time." },
];

export function FeaturesSection() {
  return (
    <section className="py-28 border-t border-border/20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-secondary uppercase tracking-widest">Features</span>
          <h2 className="mt-3 text-4xl font-bold font-display md:text-5xl">
            Built for <span className="gradient-text">Scale & Speed</span>
          </h2>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="glass rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group"
            >
              <f.icon className="h-5 w-5 text-primary mb-3 group-hover:text-secondary transition-colors" />
              <h3 className="font-semibold font-display mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
