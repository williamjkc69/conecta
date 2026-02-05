import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  BUTTONS,
  TITLES,
  MESSAGES,
  LABELS,
  PLACEHOLDERS
} from "@/constants/text";
import { LISTING_TYPE_PLACEHOLDER } from "@/constants/options";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface FormData {
  title: string;
  description: string;
  location: string;
  listing_type_id: number | null;
  salary_range_min: string;
  salary_range_max: string;
  currency: string;
  requirements: string[];
  questions: string[];
}

interface ListingType {
  id: number;
  name: string;
}

interface Skill {
  id: number;
  name: string;
}

const MAX_DESCRIPTION_LENGTH = 2000;
const CURRENCIES = ["USD", "EUR", "MXN", "COP", "ARS", "CLP", "PEN"];

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { toast } = useToast();
  const [listingTypes, setListingTypes] = useState<ListingType[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<Skill[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    location: "",
    listing_type_id: null,
    salary_range_min: "",
    salary_range_max: "",
    currency: "USD",
    requirements: [],
    questions: [""]
  });

  useEffect(() => {
    const fetchListingTypes = async () => {
      const { data, error } = await supabase
        .from("listing_types")
        .select("id, name")
        .order("name");

      if (!error && data) {
        setListingTypes(data);
        if (data.length > 0 && !formData.listing_type_id) {
          setFormData((prev) => ({ ...prev, listing_type_id: data[0].id }));
        }
      }
    };

    if (isOpen) {
      fetchListingTypes();
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "description" && value.length > MAX_DESCRIPTION_LENGTH) {
      return;
    }

    setFormData({
      ...formData,
      [name]: name === "listing_type_id" ? parseInt(value) : value
    });
  };

  const handleSkillInputChange = async (value: string) => {
    setSkillInput(value);

    if (value.trim().length > 1) {
      const { data } = await supabase
        .from("skills")
        .select("id, name")
        .ilike("name", `%${value}%`)
        .limit(5);

      if (data) {
        setSkillSuggestions(data);
        setShowSuggestions(true);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const addSkill = (skillName: string) => {
    const trimmedSkill = skillName.trim();
    if (trimmedSkill && !formData.requirements.includes(trimmedSkill)) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, trimmedSkill]
      });
      setSkillInput("");
      setShowSuggestions(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter(
        (skill) => skill !== skillToRemove
      )
    });
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (skillInput.trim()) {
        addSkill(skillInput);
      }
    }
  };

  const handleArrayChange = async (
    index: number,
    value: string,
    field: "requirements" | "questions"
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: newArray
    });
  };

  const addArrayItem = (field: "requirements" | "questions") => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ""]
    });
  };

  const removeArrayItem = (
    index: number,
    field: "requirements" | "questions"
  ) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({
      ...formData,
      [field]: newArray
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast({
        title: MESSAGES.TITLE_REQUIRED_HEADER,
        description: MESSAGES.TITLE_REQUIRED_DESC,
        variant: "destructive"
      });
      return;
    }

    if (formData.title.trim().length < 3) {
      toast({
        title: MESSAGES.TITLE_TOO_SHORT_HEADER,
        description: MESSAGES.TITLE_TOO_SHORT_DESC,
        variant: "destructive"
      });
      return;
    }

    if (!formData.description?.trim()) {
      toast({
        title: MESSAGES.DESC_REQUIRED_HEADER,
        description: MESSAGES.DESC_REQUIRED_DESC,
        variant: "destructive"
      });
      return;
    }

    if (formData.description.trim().length < 50) {
      toast({
        title: MESSAGES.DESC_TOO_SHORT_HEADER,
        description: MESSAGES.DESC_TOO_SHORT_DESC,
        variant: "destructive"
      });
      return;
    }

    if (!formData.listing_type_id) {
      toast({
        title: MESSAGES.TYPE_REQUIRED_HEADER,
        description: MESSAGES.TYPE_REQUIRED_DESC,
        variant: "destructive"
      });
      return;
    }

    if (
      !formData.salary_range_min ||
      parseFloat(formData.salary_range_min) <= 0
    ) {
      toast({
        title: MESSAGES.MIN_SALARY_INVALID_HEADER,
        description: MESSAGES.MIN_SALARY_INVALID_DESC,
        variant: "destructive"
      });
      return;
    }

    if (
      formData.salary_range_max &&
      parseFloat(formData.salary_range_max) <
        parseFloat(formData.salary_range_min)
    ) {
      toast({
        title: MESSAGES.SALARY_RANGE_INVALID_HEADER,
        description: MESSAGES.SALARY_RANGE_INVALID_DESC,
        variant: "destructive"
      });
      return;
    }

    const cleanedRequirements = formData.requirements.filter(
      (r) => r.trim() !== ""
    );
    const cleanedQuestions = formData.questions.filter((q) => q.trim() !== "");

    if (cleanedRequirements.length === 0) {
      toast({
        title: MESSAGES.REQS_REQUIRED_HEADER,
        description: MESSAGES.REQS_REQUIRED_DESC,
        variant: "destructive"
      });
      return;
    }

    const cleanedData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location?.trim() || null,
      salary_range_min: parseFloat(formData.salary_range_min),
      salary_range_max: formData.salary_range_max
        ? parseFloat(formData.salary_range_max)
        : null,
      requirements: cleanedRequirements,
      questions: cleanedQuestions
    };

    onSubmit(cleanedData);

    // Reset form
    setSkillInput("");
    setFormData({
      title: "",
      description: "",
      location: "",
      listing_type_id: listingTypes[0]?.id || null,
      salary_range_min: "",
      salary_range_max: "",
      currency: "USD",
      requirements: [],
      questions: [""]
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative glass-effect rounded-2xl border border-blue-400/20 w-full max-w-3xl max-h-[90vh] flex flex-col"
          >
            <div className="flex-shrink-0 p-4 sm:p-6 pb-3 border-b border-blue-400/10">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl sm:text-3xl font-bold gradient-text pr-8">
                {TITLES.CREATE_JOB}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
                id="create-job-form"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      {LABELS.JOB_TITLE} *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                      placeholder={PLACEHOLDERS.JOB_TITLE}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      {LABELS.LOCATION}
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                      placeholder={PLACEHOLDERS.LOCATION}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">
                    {LABELS.CONTRACT_TYPE} *
                  </label>
                  <select
                    name="listing_type_id"
                    value={formData.listing_type_id || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                    required
                  >
                    <option value="">{LISTING_TYPE_PLACEHOLDER}</option>
                    {listingTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">
                    {LABELS.DESCRIPTION} * ({formData.description.length}/
                    {MAX_DESCRIPTION_LENGTH})
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    className="w-full px-4 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
                    placeholder={PLACEHOLDERS.DESCRIPTION}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      {LABELS.SALARY_MIN} *
                    </label>
                    <input
                      type="number"
                      name="salary_range_min"
                      value={formData.salary_range_min}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                      placeholder={PLACEHOLDERS.SALARY_MIN}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      {LABELS.SALARY_MAX}
                    </label>
                    <input
                      type="number"
                      name="salary_range_max"
                      value={formData.salary_range_max}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                      placeholder={PLACEHOLDERS.SALARY_MAX}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      {LABELS.CURRENCY} *
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-3 py-3 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                      required
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">
                    {LABELS.REQUIREMENTS}
                  </label>
                  <p className="text-xs text-slate-400 mb-3">
                    {MESSAGES.SKILL_HELP}
                  </p>

                  {/* Selected Skills Pills */}
                  {formData.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.requirements.map((skill, index) => (
                        <div
                          key={index}
                          className="group relative inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-sm text-slate-100 hover:bg-blue-500/30 transition-colors"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5 text-slate-300 hover:text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skill Input with Autocomplete */}
                  <div className="relative">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => handleSkillInputChange(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                      placeholder={PLACEHOLDERS.SKILLS}
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && skillSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-blue-400/20 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {skillSuggestions.map((skill) => (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => addSkill(skill.name)}
                            className="w-full px-4 py-2 text-left text-slate-100 hover:bg-blue-500/20 transition-colors text-sm"
                          >
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">
                    {LABELS.AI_QUESTIONS}
                  </label>
                  <p className="text-xs text-slate-400 mb-3">
                    {MESSAGES.AI_QUESTIONS_DESC}
                  </p>
                  <div className="space-y-2">
                    {formData.questions.map((question, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={question}
                          onChange={(e) =>
                            handleArrayChange(
                              index,
                              e.target.value,
                              "questions"
                            )
                          }
                          className="flex-1 px-4 py-2 rounded-lg bg-blue-950/20 border border-blue-400/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                          placeholder={PLACEHOLDERS.QUESTION_EXAMPLE}
                        />
                        {formData.questions.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeArrayItem(index, "questions")}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 px-3"
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
                      className="w-full border-blue-500/50 text-cyan-400 hover:bg-blue-500/10 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {BUTTONS.ADD_QUESTION}
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            <div className="flex-shrink-0 p-4 sm:p-6 pt-3 border-t border-blue-400/10 bg-slate-900/50">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-100/20 text-slate-100 hover:bg-slate-100/10"
                >
                  {BUTTONS.CANCEL}
                </Button>
                <Button
                  type="submit"
                  form="create-job-form"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  {BUTTONS.CREATE_JOB}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateJobModal;
