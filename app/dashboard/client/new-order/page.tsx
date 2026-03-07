"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AIChatInterface } from "@/components/ai-chat/AIChatInterface";

export default function NewOrderPage() {
  const router = useRouter();

  const handleOrderPlaced = (orderId: string) => {
    if (orderId) router.push(`/dashboard/client/orders/${orderId}?new=1`);
    else router.push("/dashboard/client/orders");
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Header */}
      <motion.div
        className="flex-shrink-0"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-xl text-snow">New Order</h1>
        </div>
        <p className="text-sm text-slate ml-11">
          Chat with <span className="text-indigo-400 font-medium">Vix</span>, our AI consultant, to define your project
        </p>
      </motion.div>

      {/* Chat interface — takes remaining height */}
      <motion.div
        className="flex-1 min-h-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        <AIChatInterface onOrderPlaced={handleOrderPlaced} />
      </motion.div>
    </div>
  );
}
