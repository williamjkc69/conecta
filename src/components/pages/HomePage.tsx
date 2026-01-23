"use client";

import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/features/LoginModal";
import { useToast } from "@/components/ui/use-toast";

interface HomePageProps {
  onNavigate: (path: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginType, setLoginType] = useState<"company" | "candidate" | "admin">(
    "company"
  );

  const handleGetStarted = (type: "company" | "candidate") => {
    setLoginType(type);
    setShowLoginModal(true);
  };

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Automatización Total",
      description:
        "Desde la vacante hasta la entrevista, todo en un solo lugar sin intervención manual."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Entrevistas 24/7",
      description:
        "El agente de IA entrevista sin pausas ni horarios, disponible siempre."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Evaluaciones Objetivas",
      description:
        "IA analiza las respuestas sin sesgos humanos, garantizando imparcialidad."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Escalabilidad Real",
      description:
        "Entrevista 10 o 10,000 candidatos sin aumentar tu equipo de RRHH."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Crea una Vacante",
      description:
        "Define requisitos, preguntas y criterios de evaluación en minutos."
    },
    {
      number: "02",
      title: "Registra Candidatos",
      description:
        "Invita candidatos o permite aplicaciones directas a tus ofertas."
    },
    {
      number: "03",
      title: "IA Entrevista y Analiza",
      description:
        "El agente de voz entrevista y entrega reportes detallados automáticamente."
    }
  ];

  const comparison = [
    {
      metric: "Tiempo promedio",
      traditional: "5-7 días",
      ai: "24 horas",
      improvement: "85% más rápido"
    },
    {
      metric: "Costo por entrevista",
      traditional: "$150-300",
      ai: "$5-10",
      improvement: "95% reducción"
    },
    {
      metric: "Tasa de respuesta",
      traditional: "45%",
      ai: "78%",
      improvement: "+73% engagement"
    },
    {
      metric: "Calidad de evaluación",
      traditional: "Variable",
      ai: "Consistente",
      improvement: "100% objetiva"
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
              CONECTA by Virtualiza
            </span>
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => handleGetStarted("candidate")}
              className="text-slate-100 hover:bg-blue-500/10"
            >
              <UserCircle className="w-4 h-4 mr-2" />
              Soy Candidato
            </Button>
            <Button
              onClick={() => handleGetStarted("company")}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Soy Empresa
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
                🚀 Revoluciona tu proceso de selección
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight text-slate-50">
              Entrevistas laborales con IA:
              <br />
              <span className="gradient-text">
                más rápidas, imparciales y efectivas
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              Automatiza tu proceso de selección con entrevistas por voz
              conducidas por IA. Crea vacantes, registra candidatos y entrevista
              sin agendar ni esperar. Asegura tener el mejor recurso humano.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                onClick={() => handleGetStarted("company")}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg px-8 py-6 glow-effect"
              >
                <Play className="w-5 h-5 mr-2" />
                Probar Gratis
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  toast({
                    title: "🚧 Demo disponible próximamente",
                    description:
                      "Estamos preparando demos personalizadas. ¡Vuelve pronto!"
                  })
                }
                className="border-2 border-blue-500/50 text-slate-100 hover:bg-blue-500/10 text-lg px-8 py-6"
              >
                Solicitar Demo
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
                  src="https://images.unsplash.com/photo-1686061592689-312bbfb5c055"
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
              <span className="gradient-text">Ventajas que transforman</span> tu
              reclutamiento
            </h2>
            <p className="text-xl text-slate-300">
              Tecnología de vanguardia al servicio de tu equipo
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
              ¿Cómo funciona?{" "}
              <span className="gradient-text">Simple y poderoso</span>
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
              <span className="gradient-text">IA vs Proceso Tradicional</span>
            </h2>
            <p className="text-xl text-slate-300">
              Los números hablan por sí solos
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
                      Métrica
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-100">
                      Proceso Tradicional
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-100">
                      Con IA
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-100">
                      Mejora
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
              Lo que dicen{" "}
              <span className="gradient-text">nuestros clientes</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "Gracias a esta plataforma, reducimos el tiempo de contratación en un 65%. ¡Increíble!",
                author: "María González",
                role: "Jefe de RRHH, TechCompany",
                rating: 5
              },
              {
                quote:
                  "La objetividad de las evaluaciones nos ayudó a encontrar talento que antes pasábamos por alto.",
                author: "Carlos Ruiz",
                role: "Director de Talento, StartupHub",
                rating: 5
              },
              {
                quote:
                  "Escalamos de 50 a 500 entrevistas mensuales sin contratar más personal. Impresionante.",
                author: "Ana Martínez",
                role: "CEO, GrowthCo",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-2xl p-6 border border-blue-400/10"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-300 mb-4 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-slate-100">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-slate-400">{testimonial.role}</p>
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
              ¿Listo para <span className="gradient-text">revolucionar</span> tu
              reclutamiento?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Únete a cientos de empresas que ya están contratando más rápido y
              mejor con IA
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => handleGetStarted("company")}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg px-8 py-6"
              >
                Empieza Hoy Gratis
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  toast({
                    title: "📧 Contacto",
                    description: "Escríbenos a: contacto@aiinterview.com"
                  })
                }
                className="border-2 border-blue-500/50 text-slate-100 hover:bg-blue-500/10 text-lg px-8 py-6"
              >
                Hablar con el Equipo
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
                <span className="font-bold gradient-text">AI Interview</span>
              </div>
              <p className="text-sm text-slate-400">
                IA para entrevistas laborales. Plataforma simple, poderosa y sin
                sesgos.
              </p>
            </div>

            <div>
              <span className="font-semibold mb-3 block text-slate-100">
                Producto
              </span>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Casos de uso
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <span className="font-semibold mb-3 block text-slate-100">
                Empresa
              </span>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Sobre nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Carreras
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <span className="font-semibold mb-3 block text-slate-100">
                Legal
              </span>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Términos de servicio
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Política de privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Soporte
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-blue-400/10 text-center text-sm text-slate-400">
            <p>
              © 2025 AI Interview Platform. Todos los derechos reservados.{" "}
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
      />
    </div>
  );
};

export default HomePage;
