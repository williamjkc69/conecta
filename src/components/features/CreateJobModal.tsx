import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface FormData {
  title: string;
  description: string;
  location: string;
  type: string;
  salary: string;
  requirements: string[];
  questions: string[];
  [key: string]: any; // Allow dynamic access for handleArrayChange simplifiction
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    location: "",
    type: "full-time",
    salary: "",
    requirements: [""],
    questions: [""]
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleArrayChange = (index: number, value: string, field: string) => {
    const newArray = [...(formData[field] as string[])];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: newArray
    });
  };

  const addArrayItem = (field: string) => {
    setFormData({
      ...formData,
      [field]: [...(formData[field] as string[]), ""]
    });
  };

  const removeArrayItem = (index: number, field: string) => {
    const newArray = (formData[field] as string[]).filter(
      (_, i) => i !== index
    );
    setFormData({
      ...formData,
      [field]: newArray
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast({
        title: "⚠️ Campos requeridos",
        description:
          "Por favor completa el título y descripción de la vacante.",
        variant: "destructive"
      });
      return;
    }

    const cleanedData = {
      ...formData,
      requirements: formData.requirements.filter((r) => r.trim() !== ""),
      questions: formData.questions.filter((q) => q.trim() !== "")
    };

    onSubmit(cleanedData);

    setFormData({
      title: "",
      description: "",
      location: "",
      type: "Full-time",
      salary: "",
      requirements: [""],
      questions: [""]
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative glass-effect rounded-2xl p-8 border border-blue-400/20 max-w-3xl w-full my-8"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-3xl font-bold gradient-text mb-6">
              Crear Nueva Vacante
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">
                    Título del puesto *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="ej: Desarrollador Full Stack Senior"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="ej: Remoto, Madrid, etc."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">
                    Tipo de contrato
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="full-time">Tiempo completo</option>
                    <option value="part-time">Medio tiempo</option>
                    <option value="contract">Contrato</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">
                    Rango salarial
                  </label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="ej: $50,000 - $70,000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Descripción *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Describe el puesto, responsabilidades y lo que buscas..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Requisitos
                </label>
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) =>
                          handleArrayChange(
                            index,
                            e.target.value,
                            "requirements"
                          )
                        }
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        placeholder="ej: 3+ años de experiencia en React"
                      />
                      {formData.requirements.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeArrayItem(index, "requirements")}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem("requirements")}
                    className="w-full border-blue-500/50 text-cyan-400 hover:bg-blue-500/10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Requisito
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Preguntas para la IA
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Estas preguntas serán usadas por el agente de IA durante la
                  entrevista
                </p>
                <div className="space-y-2">
                  {formData.questions.map((question, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) =>
                          handleArrayChange(index, e.target.value, "questions")
                        }
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        placeholder="ej: ¿Cuál es tu experiencia con TypeScript?"
                      />
                      {formData.questions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeArrayItem(index, "questions")}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem("questions")}
                    className="w-full border-blue-500/50 text-cyan-400 hover:bg-blue-500/10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Pregunta
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-100/20 text-slate-100 hover:bg-slate-100/10"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  Crear Vacante
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateJobModal;
