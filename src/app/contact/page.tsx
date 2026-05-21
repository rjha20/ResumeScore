"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, MessageSquare, MapPin, ArrowRight } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-5">
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight">Get in touch</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Have questions? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold mb-5">Send us a message</h2>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Name</label>
                  <Input placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Email</label>
                  <Input type="email" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Message</label>
                  <textarea className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="How can we help?" />
                </div>
                <Button type="submit" className="w-full">
                  Send message
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {[
              { icon: Mail, title: "Email", desc: "hello@resumescore.app", gradient: false },
              { icon: MessageSquare, title: "Live Chat", desc: "Available Mon-Fri, 9am-5pm EST", gradient: false },
              { icon: MapPin, title: "Location", desc: "San Francisco, CA", gradient: false },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
