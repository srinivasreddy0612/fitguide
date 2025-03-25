"use client"
import React from 'react';
import { Dumbbell, Brain, Calendar, Send, CheckCircle, BarChart, ChevronRight, Sparkles } from 'lucide-react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';

const FitGuideLanding = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">FitGuide</span>
          </div>
          <div className="flex items-center space-x-4">
            <SignedIn>
              <Link href="/home" className="bg-white/10 backdrop-blur-sm border border-white/10 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/15 transition">
                Dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="text-white/80 hover:text-white transition px-4 py-2 text-sm font-medium">
                Sign In
              </Link>
              <Link href="/sign-up" className="bg-white/10 backdrop-blur-sm border border-white/10 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/15 transition">
                Get Started
              </Link>
            </SignedOut>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-5"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/95" />
        </div>
        <div className="z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
            <Brain className="h-5 w-5 text-white/80 mr-2" />
            <span className="text-sm">Powered by Groq AI</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Your AI Fitness Coach
          </h1>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Advanced AI-powered fitness platform with personalized workout plans, progress tracking, and interactive coaching through Groq AI technology
          </p>
          <SignedIn>
            <Link href="/home" className="bg-white/10 backdrop-blur-sm border border-white/10 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/15 transition">
              Go to Dashboard
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-up" className="bg-white/10 backdrop-blur-sm border border-white/10 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/15 transition">
              Start Your Fitness Journey
            </Link>
          </SignedOut>
        </div>
      </div>

      {/* Bento Grid Section */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI Coach Card */}
          <div className="backdrop-blur-lg bg-white/5 rounded-xl p-8 col-span-2 group hover:bg-white/10 transition duration-300 border border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-3 rounded-lg bg-white/10 text-white/80">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div className="p-3 rounded-lg bg-white/10 text-white/80">
                    <Send className="h-6 w-6" />
                  </div>
                </div>
                <h2 className="text-2xl font-medium mb-3 text-white/90">Interactive AI Coach</h2>
                <p className="text-white/60 leading-relaxed">Chat with your AI fitness coach powered by Groq technology to create personalized workout plans. The AI guides you through a conversation about your preferences and creates custom workouts tailored to your needs.</p>
              </div>
              <ChevronRight className="h-6 w-6 text-white/50 group-hover:text-white/80 group-hover:translate-x-2 transition-all" />
            </div>
          </div>

          {/* Workout Library Card */}
          <div className="backdrop-blur-lg bg-white/5 rounded-xl p-8 group hover:bg-white/10 transition duration-300 border border-white/10">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 mb-6 w-fit">
              <Dumbbell className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-medium mb-3 text-white/90">Custom Workouts</h2>
            <p className="text-white/60 leading-relaxed">Access a variety of workouts from strength training to yoga, and easily add AI-generated custom workouts to your collection.</p>
          </div>

          {/* Progress Tracking Card */}
          <div className="backdrop-blur-lg bg-white/5 rounded-xl p-8 group hover:bg-white/10 transition duration-300 border border-white/10">
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 mb-6 w-fit">
              <BarChart className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-medium mb-3 text-white/90">Live Tracking</h2>
            <p className="text-white/60 leading-relaxed">Track your workout progress in real-time, mark completed exercises, and see your workout history visualized.</p>
          </div>

          {/* Calendar Card */}
          <div className="backdrop-blur-lg bg-white/5 rounded-xl p-8 group hover:bg-white/10 transition duration-300 border border-white/10">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 mb-6 w-fit">
              <Calendar className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-medium mb-3 text-white/90">Workout Calendar</h2>
            <p className="text-white/60 leading-relaxed">View your workout history on a calendar and keep track of your consistency and completed workouts.</p>
          </div>
          
          {/* Exercise Tracking Card */}
          <div className="backdrop-blur-lg bg-white/5 rounded-xl p-8 group hover:bg-white/10 transition duration-300 border border-white/10">
            <div className="p-3 rounded-lg bg-green-500/10 text-green-500 mb-6 w-fit">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-medium mb-3 text-white/90">Progress Tracking</h2>
            <p className="text-white/60 leading-relaxed">Track your progress by checking off completed exercises and monitoring your workout durations.</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-24 border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-white/90">Real AI Fitness Features</h2>
          <p className="text-white/60 max-w-2xl mx-auto">Our Groq AI technology transforms your fitness journey with intelligent, personalized guidance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center group">
            <div className="h-16 w-16 mx-auto mb-6 p-3 rounded-2xl bg-white/5 group-hover:bg-white/10 transition">
              <Brain className="h-full w-full text-white/80" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white/90">Conversational Workout Creation</h3>
            <p className="text-white/60">The AI asks about your preferences to create the perfect workout plan for your needs</p>
          </div>
          <div className="text-center group">
            <div className="h-16 w-16 mx-auto mb-6 p-3 rounded-2xl bg-white/5 group-hover:bg-white/10 transition">
              <Dumbbell className="h-full w-full text-white/80" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white/90">Multiple Workout Types</h3>
            <p className="text-white/60">From HIIT and strength training to yoga and core workouts, all personalized for you</p>
          </div>
          <div className="text-center group">
            <div className="h-16 w-16 mx-auto mb-6 p-3 rounded-2xl bg-white/5 group-hover:bg-white/10 transition">
              <Calendar className="h-full w-full text-white/80" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white/90">Workout History</h3>
            <p className="text-white/60">Track your completed workouts and see your fitness journey visualized over time</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-3"></div>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 text-center">
          <h2 className="text-4xl font-bold mb-4 text-white/90">Ready to Transform Your Fitness?</h2>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">Experience the future of fitness with intelligent AI coaching that adapts to your needs</p>
          <SignedIn>
            <Link href="/home" className="bg-white/10 backdrop-blur-sm border border-white/10 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/15 transition">
              Go to Dashboard
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-up" className="bg-white/10 backdrop-blur-sm border border-white/10 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/15 transition">
              Get Started Now
            </Link>
          </SignedOut>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-white/40 text-sm">
          <p>© 2025 FitGuide. Powered by Groq AI technology.</p>
        </div>
      </footer>
    </div>
  );
};

export default FitGuideLanding;