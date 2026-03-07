"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Phone, Shield, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GlowInput } from "@/components/ui/GlowInput";

const schema = z.object({
  firstName: z.string().min(1).max(50),
  lastName:  z.string().min(1).max(50),
  phone:     z.string().min(5).max(25).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName:  user?.lastName  ?? "",
      phone:     "",
    },
  });

  const onSubmit = async (_data: FormData) => {
    // TODO: PATCH /api/auth/profile endpoint
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-display font-bold text-2xl text-snow">Profile</h1>
        <p className="text-sm text-slate mt-1">Manage your account settings</p>
      </motion.div>

      {/* Avatar card */}
      <motion.div
        className="rounded-2xl border border-white/[0.08] p-6 flex items-center gap-5"
        style={{ background: "rgba(255,255,255,0.02)" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}>
          {initials || <User size={24} />}
        </div>
        <div>
          <p className="font-display font-bold text-snow text-lg">
            {user?.firstName} {user?.lastName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">Client</span>
            {user?.isVerified && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check size={10} /> Verified
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        className="rounded-2xl border border-white/[0.08] p-6 space-y-5"
        style={{ background: "rgba(255,255,255,0.02)" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="font-display font-semibold text-snow text-sm flex items-center gap-2">
          <User size={15} className="text-indigo-400" /> Personal Information
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <GlowInput label="First name" error={errors.firstName?.message} {...register("firstName")} />
            <GlowInput label="Last name" error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <GlowInput label="Phone" type="tel" placeholder="+91 98765 43210" error={errors.phone?.message} {...register("phone")} />

          <motion.button
            type="submit"
            disabled={!isDirty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          >
            {saved ? <><Check size={15} /> Saved!</> : "Save Changes"}
          </motion.button>
        </form>
      </motion.div>

      {/* Account info */}
      <motion.div
        className="rounded-2xl border border-white/[0.08] p-6 space-y-4"
        style={{ background: "rgba(255,255,255,0.02)" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="font-display font-semibold text-snow text-sm flex items-center gap-2">
          <Shield size={15} className="text-indigo-400" /> Account Details
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <Mail size={16} className="text-slate flex-shrink-0" />
            <div>
              <p className="text-xs text-slate">Email address</p>
              <p className="text-sm text-snow">{user?.email}</p>
            </div>
            <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Verified</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <Phone size={16} className="text-slate flex-shrink-0" />
            <div>
              <p className="text-xs text-slate">Account type</p>
              <p className="text-sm text-snow capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
