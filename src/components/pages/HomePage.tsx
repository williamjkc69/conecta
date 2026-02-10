"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Clock,
  Target,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Building2,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/features/LoginModal";
import { useToast } from "@/components/ui/use-toast";
import {
  LANDING_HERO,
  LANDING_FEATURES,
  LANDING_STEPS,
  LANDING_COMPARISON,
  LANDING_TESTIMONIALS,
  LANDING_CTA,
  LANDING_FOOTER,
  LANDING_NAV,
  LANDING_SECTIONS
} from "@/constants/landing";
import { ASSETS } from "@/constants/assets";

interface HomePageProps {
  onNavigate: (path: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginType, setLoginType] = useState<"company" | "candidate" | "admin">(
    "company"
  );
  const [initialEmail, setInitialEmail] = useState("");
  const [inviteJobId, setInviteJobId] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const register = searchParams.get("register");
    const login = searchParams.get("login");

    if (register) {
      const emailParam = searchParams.get("email");
      const roleParam = searchParams.get("role");
      const jobIdParam = searchParams.get("jobId");
      const tokenParam = searchParams.get("token");

      if (emailParam) setInitialEmail(emailParam);
      if (jobIdParam) setInviteJobId(jobIdParam);
      if (tokenParam) setInviteToken(tokenParam);
      if (roleParam === "candidate" || roleParam === "company") {
        setLoginType(roleParam);
      }
      setShowLoginModal(true);
    } else if (login) {
      setShowLoginModal(true);
    }
  }, [searchParams]);

  const handleGetStarted = (type: "company" | "candidate") => {
    setLoginType(type);
    setShowLoginModal(true);
  };

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: LANDING_FEATURES[0].TITLE,
      description: LANDING_FEATURES[0].DESC
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: LANDING_FEATURES[1].TITLE,
      description: LANDING_FEATURES[1].DESC
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: LANDING_FEATURES[2].TITLE,
      description: LANDING_FEATURES[2].DESC
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: LANDING_FEATURES[3].TITLE,
      description: LANDING_FEATURES[3].DESC
    }
  ];

  const steps = [
    {
      number: LANDING_STEPS[0].NUMBER,
      title: LANDING_STEPS[0].TITLE,
      description: LANDING_STEPS[0].DESC
    },
    {
      number: LANDING_STEPS[1].NUMBER,
      title: LANDING_STEPS[1].TITLE,
      description: LANDING_STEPS[1].DESC
    },
    {
      number: LANDING_STEPS[2].NUMBER,
      title: LANDING_STEPS[2].TITLE,
      description: LANDING_STEPS[2].DESC
    }
  ];

  const comparison = [
    {
      metric: LANDING_COMPARISON.ROWS[0].METRIC,
      traditional: LANDING_COMPARISON.ROWS[0].TRADITIONAL,
      ai: LANDING_COMPARISON.ROWS[0].AI,
      improvement: LANDING_COMPARISON.ROWS[0].IMPROVEMENT
    },
    {
      metric: LANDING_COMPARISON.ROWS[1].METRIC,
      traditional: LANDING_COMPARISON.ROWS[1].TRADITIONAL,
      ai: LANDING_COMPARISON.ROWS[1].AI,
      improvement: LANDING_COMPARISON.ROWS[1].IMPROVEMENT
    },
    {
      metric: LANDING_COMPARISON.ROWS[2].METRIC,
      traditional: LANDING_COMPARISON.ROWS[2].TRADITIONAL,
      ai: LANDING_COMPARISON.ROWS[2].AI,
      improvement: LANDING_COMPARISON.ROWS[2].IMPROVEMENT
    },
    {
      metric: LANDING_COMPARISON.ROWS[3].METRIC,
      traditional: LANDING_COMPARISON.ROWS[3].TRADITIONAL,
      ai: LANDING_COMPARISON.ROWS[3].AI,
      improvement: LANDING_COMPARISON.ROWS[3].IMPROVEMENT
    }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-blue-400/10"
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-xl font-bold gradient-text">
              {LANDING_NAV.BRAND}
            </span>
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => handleGetStarted("candidate")}
              className="text-slate-100 hover:bg-blue-500/10"
            >
              <UserCircle className="w-4 h-4 mr-2" />
              {LANDING_HERO.BUTTON_CANDIDATE}
            </Button>
            <Button
              onClick={() => handleGetStarted("company")}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              <Building2 className="w-4 h-4 mr-2" />
              {LANDING_HERO.BUTTON_COMPANY}
            </Button>
          </div>
        </div>
      </motion.nav>

      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-transparent pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="inline-block px-4 py-2 rounded-full glass-effect border border-blue-500/30 mb-4">
              <span className="text-sm text-cyan-300">
                {LANDING_HERO.BADGE}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight text-slate-50">
              {LANDING_HERO.TITLE_PREFIX}
              <br />
              <span className="gradient-text">
                {LANDING_HERO.TITLE_GRADIENT}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              {LANDING_HERO.DESCRIPTION}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                onClick={() => handleGetStarted("company")}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg px-8 py-6 glow-effect"
              >
                <Play className="w-5 h-5 mr-2" />
                {LANDING_HERO.BUTTON_PRIMARY}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  toast({
                    title: LANDING_HERO.DEMO_TOAST_TITLE,
                    description: LANDING_HERO.DEMO_TOAST_DESC
                  })
                }
                className="border-2 border-blue-500/50 text-slate-100 hover:bg-blue-500/10 text-lg px-8 py-6"
              >
                {LANDING_HERO.BUTTON_SECONDARY}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-16 relative"
            >
              <div className="glass-effect rounded-2xl p-8 border-2 border-blue-500/30 glow-effect">
                <img
                  alt="AI Interview Dashboard Preview"
                  src={ASSETS.DASHBOARD_PREVIEW}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-50">
              <span className="gradient-text">
                {LANDING_SECTIONS.FEATURES.TITLE_PREFIX}
              </span>{" "}
              {LANDING_SECTIONS.FEATURES.TITLE_SUFFIX}
            </h2>
            <p className="text-xl text-slate-300">
              {LANDING_SECTIONS.FEATURES.SUBTITLE}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass-effect rounded-2xl p-6 border border-blue-400/10 hover:border-blue-500/50 transition-all"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-100">
                  {feature.title}
                </h3>
                <p className="text-slate-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-blue-950/20 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-50">
              {LANDING_SECTIONS.STEPS.TITLE_PREFIX}{" "}
              <span className="gradient-text">
                {LANDING_SECTIONS.STEPS.TITLE_SUFFIX}
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="glass-effect rounded-2xl p-8 border border-blue-400/10 h-full">
                  <div className="text-6xl font-black gradient-text mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-100">
                    {step.title}
                  </h3>
                  <p className="text-slate-300">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-blue-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-50">
              <span className="gradient-text">
                {LANDING_COMPARISON.TITLE_PREFIX}
              </span>
            </h2>
            <p className="text-xl text-slate-300">
              {LANDING_COMPARISON.SUBTITLE}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-effect rounded-2xl overflow-hidden border border-blue-400/10"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-100">
                      {LANDING_COMPARISON.HEADERS[0]}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-100">
                      {LANDING_COMPARISON.HEADERS[1]}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-100">
                      {LANDING_COMPARISON.HEADERS[2]}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-100">
                      {LANDING_COMPARISON.HEADERS[3]}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="border-t border-blue-400/10 hover:bg-blue-500/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-100">
                        {row.metric}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {row.traditional}
                      </td>
                      <td className="px-6 py-4 text-green-400 font-semibold">
                        {row.ai}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold">
                          <TrendingUp className="w-4 h-4" />
                          {row.improvement}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-blue-950/20">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-50">
              {LANDING_TESTIMONIALS.TITLE_PREFIX}{" "}
              <span className="gradient-text">
                {LANDING_TESTIMONIALS.TITLE_GRADIENT}
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {LANDING_TESTIMONIALS.ITEMS.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-2xl p-6 border border-blue-400/10"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-300 mb-4 italic">
                  "{testimonial.QUOTE}"
                </p>
                <div>
                  <p className="font-semibold text-slate-100">
                    {testimonial.AUTHOR}
                  </p>
                  <p className="text-sm text-slate-400">{testimonial.ROLE}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-effect rounded-3xl p-12 border-2 border-blue-500/30 glow-effect text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-50">
              {LANDING_CTA.TITLE_PREFIX}{" "}
              <span className="gradient-text">
                {LANDING_CTA.TITLE_GRADIENT}
              </span>{" "}
              {LANDING_CTA.TITLE_SUFFIX}
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              {LANDING_CTA.DESCRIPTION}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => handleGetStarted("company")}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg px-8 py-6"
              >
                {LANDING_CTA.BUTTON_PRIMARY}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  toast({
                    title: LANDING_CTA.CONTACT_TOAST_TITLE,
                    description: LANDING_CTA.CONTACT_TOAST_DESC
                  })
                }
                className="border-2 border-blue-500/50 text-slate-100 hover:bg-blue-500/10 text-lg px-8 py-6"
              >
                {LANDING_CTA.BUTTON_SECONDARY}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-blue-400/10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-slate-900" />
                </div>
                <span className="font-bold gradient-text">
                  {LANDING_NAV.BRAND}
                </span>
              </div>
              <p className="text-sm text-slate-400">
                {LANDING_FOOTER.BRAND_DESC}
              </p>
            </div>

            <div>
              <span className="font-semibold mb-3 block text-slate-100">
                {LANDING_FOOTER.SECTIONS.PRODUCT}
              </span>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    {LANDING_FOOTER.LINKS.FEATURES}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    {LANDING_FOOTER.LINKS.PRICING}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    {LANDING_FOOTER.LINKS.USE_CASES}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <span className="font-semibold mb-3 block text-slate-100">
                {LANDING_FOOTER.SECTIONS.COMPANY}
              </span>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    {LANDING_FOOTER.LINKS.ABOUT}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    {LANDING_FOOTER.LINKS.BLOG}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    {LANDING_FOOTER.LINKS.CAREERS}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <span className="font-semibold mb-3 block text-slate-100">
                {LANDING_FOOTER.SECTIONS.LEGAL}
              </span>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    {LANDING_FOOTER.LINKS.TERMS}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    {LANDING_FOOTER.LINKS.PRIVACY}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    {LANDING_FOOTER.LINKS.SUPPORT}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-blue-400/10 text-center text-sm text-slate-400">
            <p>
              {LANDING_FOOTER.COPYRIGHT}{" "}
              <Link
                href="/admin-login"
                className="text-slate-600 hover:text-slate-500"
              >
                .
              </Link>
            </p>
          </div>
        </div>
      </footer>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        type={loginType}
        initialEmail={initialEmail}
        jobId={inviteJobId}
        token={inviteToken}
      />
    </div>
  );
};

export default HomePage;
