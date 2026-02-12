"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-brand-teal/5 via-white to-brand-purple/5 flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-8">
        {/* Animated Logo Container */}
        <div className="relative">
          {/* Outer Glow Ring */}
          <motion.div
            className="absolute inset-0 -m-8"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-r from-brand-teal/20 to-brand-purple/20 blur-xl" />
          </motion.div>

          {/* Rotating Gradient Border */}
          <motion.div
            className="absolute inset-0 -m-6 rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-r from-brand-teal via-brand-purple to-brand-teal opacity-20 blur-md" />
          </motion.div>

          {/* Spinning Dots */}
          <motion.div
            className="absolute inset-0 -m-8"
            animate={{ rotate: -360 }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[0, 60, 120, 180, 240, 300].map((degree, i) => (
              <motion.div
                key={degree}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-brand-teal to-brand-purple"
                style={{
                  transform: `rotate(${degree}deg) translateY(-50px)`,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>

          {/* Rotating Logo - Swing Animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              rotate: [-15, 15, -15]
            }}
            transition={{ 
              scale: { duration: 0.5 },
              opacity: { duration: 0.5 },
              rotate: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }
            }}
            className="relative z-10"
          >
            <div className="relative bg-white rounded-2xl p-4 shadow-2xl">
              <Image
                src="/just-logo.png"
                alt="TruevalueCRM"
                width={100}
                height={100}
                className="drop-shadow-lg"
                priority
              />
            </div>
          </motion.div>
        </div>

        {/* Brand Name with Shimmer Effect */}
        <div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold bg-gradient-to-r from-brand-teal via-brand-purple to-brand-teal bg-clip-text text-transparent"
            style={{
              backgroundSize: "200% auto",
            }}
          >
            <motion.span
              animate={{
                backgroundPosition: ["0% center", "200% center"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundImage: "linear-gradient(to right, hsl(var(--brand-teal)), hsl(var(--brand-purple)), hsl(var(--brand-teal)))",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "inline-block",
              }}
            >
              TruevalueCRM
            </motion.span>
          </motion.h2>
        </div>

        {/* Modern Progress Bar with Glow */}
        <div className="relative w-72">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative h-2 bg-gray-200 rounded-full overflow-hidden"
          >
            {/* Animated Gradient Bar */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-brand-teal via-brand-purple to-brand-teal"
              style={{
                backgroundSize: "200% 100%",
              }}
              animate={{
                x: ["-100%", "100%"],
                backgroundPosition: ["0% 0%", "200% 0%"],
              }}
              transition={{
                x: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                backgroundPosition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
            />
            
            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Progress Bar Glow */}
          <motion.div
            className="absolute inset-0 -m-1 bg-gradient-to-r from-brand-teal/30 to-brand-purple/30 rounded-full blur-md"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-brand-teal to-brand-purple"
            style={{
              left: `${20 + i * 10}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [-20, -60, -20],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
