import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

const slides = [
  {
    title: "Empowering Rwanda's CHWs",
    subtitle:
      "Comprehensive digital training for Community Health Workers nationwide — learn at your own pace, anywhere.",
  },
  {
    title: "Learn. Grow. Heal.",
    subtitle:
      "Access courses, track your progress, and earn certificates on your healthcare journey with eBumenyi.",
  },
  {
    title: "Building Healthier Communities",
    subtitle:
      "A Government of Rwanda initiative transforming frontline healthcare delivery through technology.",
  },
];

export const AuthDecorativePanel: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col"
      style={{
        background:
          "linear-gradient(145deg, #091525 0%, #0f2340 40%, #0d3060 70%, #1a4070 100%)",
      }}
    >
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(51,99,173,0.35), transparent 70%)",
          transform: "translate(25%, -25%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(51,99,173,0.25), transparent 70%)",
          transform: "translate(-30%, 30%)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(51,99,173,0.12), transparent 70%)",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-8">
        <div className="flex items-center gap-3">
          <img src="/chw.png" alt="eBumenyi" className="w-9 h-9 object-contain" />
          <span className="text-white font-bold text-lg tracking-tight">eBumenyi</span>
        </div>
        <a
          href="https://ebumenyi.online"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full transition-all border border-white/10 hover:border-white/20"
        >
          Back to website <ArrowRight size={12} />
        </a>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-10">
        {/* Logos */}
        <div className="flex items-center justify-center gap-8 mb-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
            <img src="/chw.png" alt="eBumenyi" className="w-16 h-16 object-contain" />
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
            <img
              src="/rbc-logo.png"
              alt="RBC"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Slide content */}
        <div className="text-center min-h-[110px] mb-8">
          <h2
            key={activeSlide}
            className="text-2xl font-bold text-white mb-3 leading-tight"
            style={{ animation: "fadeInUp 0.5s ease" }}
          >
            {slides[activeSlide].title}
          </h2>
          <p
            key={`sub-${activeSlide}`}
            className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto"
            style={{ animation: "fadeInUp 0.5s ease 0.1s both" }}
          >
            {slides[activeSlide].subtitle}
          </p>
        </div>

        {/* Partners card */}
        <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl px-5 py-4 border border-white/10 w-full max-w-xs">
          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3 font-semibold">
            Partner Organizations
          </p>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {[
              { name: "RBC", label: "Coordination" },
              { name: "WELTEL", label: "Development" },
              { name: "CIIC-HIN", label: "Content" },
              { name: "SFH", label: "Monitoring" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4a90d9] flex-shrink-0" />
                <div>
                  <span className="text-white/80 text-xs font-medium">{p.name}</span>
                  <span className="text-white/35 text-[10px] ml-1">{p.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="relative z-10 flex items-center justify-center gap-2 pb-8">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === activeSlide ? "w-7 bg-white" : "w-2 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
