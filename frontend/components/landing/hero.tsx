"use client"

import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Play, CheckCircle2, Users, Clock, Bell } from "lucide-react"
import Link from "next/link"

export function Hero() {
  useEffect(() => {
    const animateWords = () => {
      const wordElements = document.querySelectorAll('.word-animate');
      wordElements.forEach((word) => {
        const delay = parseInt(word.getAttribute('data-delay') || "0") || 0;
        setTimeout(() => {
          if (word) (word as HTMLElement).style.animation = 'word-appear 0.8s ease-out forwards';
        }, delay);
      });
    };
    const timeoutId = setTimeout(animateWords, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  const textStyles = `
    @keyframes word-appear { 
      0% { opacity: 0; transform: translateY(30px) scale(0.8); filter: blur(10px); } 
      50% { opacity: 0.8; transform: translateY(10px) scale(0.95); filter: blur(2px); } 
      100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } 
    }
    .word-animate { display: inline-block; opacity: 0; margin: 0 0.1em; transition: color 0.3s ease, transform 0.3s ease; }
    .word-animate:hover { color: #3b82f6; transform: translateY(-2px); }
  `;

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <style>{textStyles}</style>
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-background to-background" />

      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              <span className="word-animate" data-delay="0">Turn</span>
              <span className="word-animate" data-delay="100">Meetings</span>
              <span className="word-animate" data-delay="200">into</span>
              <br className="hidden md:block"/>
              <span className="word-animate" data-delay="300">Action</span>
              <span className="word-animate" data-delay="400">-</span>
              <span className="word-animate text-[#3b82f6]" data-delay="500">Instantly</span>
            </h1>

            <div className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed space-y-2">
              <div>
                <span className="word-animate" data-delay="700">AI</span>
                <span className="word-animate" data-delay="750">extracts</span>
                <span className="word-animate" data-delay="800">tasks,</span>
                <span className="word-animate" data-delay="850">assigns</span>
                <span className="word-animate" data-delay="900">owners,</span>
                <span className="word-animate" data-delay="950">and</span>
                <span className="word-animate" data-delay="1000">ensures</span>
                <span className="word-animate" data-delay="1050">nothing</span>
                <span className="word-animate" data-delay="1100">gets</span>
                <span className="word-animate" data-delay="1150">missed.</span>
              </div>
              <div className="pt-2">
                <span className="word-animate" data-delay="1300">Stop</span>
                <span className="word-animate" data-delay="1350">losing</span>
                <span className="word-animate" data-delay="1400">valuable</span>
                <span className="word-animate" data-delay="1450">action</span>
                <span className="word-animate" data-delay="1500">items</span>
                <span className="word-animate" data-delay="1550">in</span>
                <span className="word-animate" data-delay="1600">meeting</span>
                <span className="word-animate" data-delay="1650">notes.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="text-base px-8">
                <Link href="/dashboard">
                  Try Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <Link href="/dashboard">
                  <Play className="mr-2 h-4 w-4" />
                  View Dashboard
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Free to try</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>No credit card</span>
              </div>
            </div>
          </div>

          {/* Right side - Mock Dashboard Preview */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-3xl" />
            <div className="wm-card relative rounded-2xl p-6 shadow-2xl">
              {/* Mini dashboard header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                    <span className="text-primary font-bold text-sm">MF</span>
                  </div>
                  <span className="font-semibold">MeetingFlow AI</span>
                </div>
                <Badge variant="secondary" className="wm-pill text-xs">Live Preview</Badge>
              </div>

              {/* Stats preview */}
              <div className="grid grid-cols-3 gap-4 py-6">
                <div className="space-y-1 p-3 rounded-xl bg-secondary/50">
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-xs text-muted-foreground">Total Tasks</div>
                </div>
                <div className="space-y-1 p-3 rounded-xl bg-secondary/50">
                  <div className="text-2xl font-bold text-green-500">18</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="space-y-1 p-3 rounded-xl bg-secondary/50">
                  <div className="text-2xl font-bold text-amber-500">6</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>

              {/* Task preview list */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground pb-2">Recent Tasks</div>
                {[
                  { task: "Review Q4 budget proposal", assignee: "Sarah", priority: "High" },
                  { task: "Schedule client follow-up", assignee: "Mike", priority: "Medium" },
                  { task: "Update project timeline", assignee: "Alex", priority: "Low" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.task}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{item.assignee}</span>
                      </div>
                      <Badge
                        variant={item.priority === "High" ? "destructive" : "secondary"}
                        className="text-xs px-2"
                      >
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
