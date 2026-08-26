import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, ArrowRight, Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { login } from "@/api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);

      navigate(result.role === "organizer" ? "/organizer" : "/attendee");
    } catch (error) {
      console.error(error);
      // We'll improve this into a proper UI toast next.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/3 h-[400px] w-[400px] rounded-full bg-secondary/8 blur-[150px]" />
        <div className="absolute inset-0 animated-grid opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-strong border-border/40 glow-sm">
          <CardHeader className="text-center pb-4">
            <Link to="/" className="mx-auto flex items-center gap-2.5 mb-6">
              <div className="rounded-xl gradient-primary p-2 shadow-lg shadow-primary/20">
                <Camera className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold font-display gradient-text">
                GrabPic
              </span>
            </Link>
            <CardTitle className="text-2xl font-display">
              Welcome back
            </CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-muted/20 border-border/40 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-muted/20 border-border/40 h-11"
                  />
                </div>
              </div>
              <Button
                className="w-full gradient-primary border-0 h-11 shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
