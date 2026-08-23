"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FaPhone, FaLocationDot, FaEnvelope, FaPaperPlane } from "react-icons/fa6";
import { toast, Toaster } from "react-hot-toast";

const splitVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 70, damping: 15 } }
};

const rightVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 70, damping: 15 } }
};

export default function ContactUsPage() {
  const t = useTranslations("ContactPage");
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill out all fields.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", message: "" });
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div className="bg-luxury-bg min-h-screen text-luxury-text-primary pt-32 pb-24 font-sans">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 space-y-16">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-vamika-gold uppercase tracking-[0.25em] text-[10px] font-semibold">
            Get in Touch
          </span>
          <h1 className="text-4xl font-serif font-light text-vamika-charcoal uppercase tracking-wider">
            {t("title")}
          </h1>
          <div className="w-12 h-px bg-vamika-gold mx-auto" />
          <p className="text-luxury-text-secondary leading-relaxed font-light text-sm md:text-base">
            {t("tagline")}
          </p>
        </div>

        {/* Contact Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 max-w-6xl mx-auto items-start">
          {/* Left Column - Contact Details */}
          <motion.div
            variants={splitVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-light text-vamika-charcoal uppercase tracking-wider">
                Our Office & Showroom
              </h2>
              <p className="text-sm text-luxury-text-secondary leading-relaxed font-light">
                {t("intro")}
              </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-6">
              <div className="flex gap-4 items-start p-6 bg-white border border-luxury-border rounded-sm shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-vamika-gold/5 rounded-full text-vamika-gold">
                  <FaLocationDot className="text-xl text-vamika-gold-light" />
                </div>
                <div>
                  <h3 className="font-serif font-medium uppercase tracking-wider text-vamika-charcoal text-sm">{t("addressTitle")}</h3>
                  <p className="text-xs text-stone-500 font-light mt-1">{t("addressText")}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-6 bg-white border border-luxury-border rounded-sm shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-vamika-gold/5 rounded-full text-vamika-gold">
                  <FaPhone className="text-xl text-vamika-gold-light" />
                </div>
                <div>
                  <h3 className="font-serif font-medium uppercase tracking-wider text-vamika-charcoal text-sm">{t("phoneTitle")}</h3>
                  <p className="text-xs text-stone-500 font-light mt-1">{t("phoneText")}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-6 bg-white border border-luxury-border rounded-sm shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-vamika-gold/5 rounded-full text-vamika-gold">
                  <FaEnvelope className="text-xl text-vamika-gold-light" />
                </div>
                <div>
                  <h3 className="font-serif font-medium uppercase tracking-wider text-vamika-charcoal text-sm">{t("emailTitle")}</h3>
                  <a href={`mailto:${t("emailText")}`} className="text-xs text-vamika-gold-light hover:underline mt-1 block">{t("emailText")}</a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Contact Form */}
          <motion.div
            variants={rightVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:col-span-7 bg-white p-8 md:p-12 border border-luxury-border rounded-sm shadow-md"
          >
            <h2 className="text-2xl font-serif font-light text-vamika-charcoal uppercase tracking-wider mb-6">
              {t("formTitle")}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">
                  {t("nameLabel")}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-bg border border-luxury-border rounded-sm text-sm focus:outline-none focus:border-vamika-gold-light transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">
                  {t("emailLabel")}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-bg border border-luxury-border rounded-sm text-sm focus:outline-none focus:border-vamika-gold-light transition-colors"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">
                  {t("msgLabel")}
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 bg-luxury-bg border border-luxury-border rounded-sm text-sm focus:outline-none focus:border-vamika-gold-light transition-colors"
                  placeholder="Write your message here..."
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-vamika-charcoal text-white hover:bg-vamika-gold-light hover:text-white transition-all duration-300 tracking-widest py-4 uppercase text-xs font-semibold rounded-sm shadow-md flex items-center justify-center gap-2"
                >
                  <FaPaperPlane className="text-xs" />
                  {submitting ? "Sending..." : t("sendBtn")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
