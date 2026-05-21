"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Target, Users, Rocket } from "lucide-react";

const values = [
  { icon: Sparkles, title: "Innovation", desc: "Using cutting-edge AI to give you a competitive edge." },
  { icon: Target, title: "Precision", desc: "Accurate, data-driven analysis you can trust." },
  { icon: Users, title: "User-First", desc: "Every feature is designed to help you land your dream job." },
  { icon: Rocket, title: "Impact", desc: "We measure success by the careers we help launch." },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About ResumeScore</h1>
          <p className="text-lg text-muted-foreground">Empowering job seekers with AI-powered resume optimization.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-12">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                We believe everyone deserves a fair chance at their dream job. Modern hiring relies heavily on ATS systems
                that can filter out qualified candidates. ResumeScore was built to level the playing field, giving every job
                seeker access to the same AI-powered optimization tools that top candidates use.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-3">
                    <v.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Join 50,000+ Job Seekers</h2>
            <p className="text-muted-foreground">Start your journey to a better resume today.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}