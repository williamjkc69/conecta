import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Edit, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { TITLES, MESSAGES, BUTTONS, LABELS } from "@/constants/text";
import { JOB_STATUS_LABELS, CONTRACT_TYPE_LABELS } from "@/constants/options";
import { JOB_STATUS } from "@/constants/status";

interface FormData {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  salary: string;
  requirements: string[];
  questions: string[];
  status: string;
  [key: string]: any;
}

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  onSubmit: (data: any) => void;
  onDelete: (id: string) => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({
  isOpen,
  onClose,
  job,
  onSubmit,
  onDelete
}) => {
  const [formData, setFormData] = useState<FormData>({
    id: "",
    title: "",
    description: "",
    location: "",
    type: "Full-time",
    salary: "",
    requirements: [""],
    questions: [""],
    status: JOB_STATUS.ACTIVE
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (job) {
      setFormData({
        id: job.id,
        title: job.title || "",
        description: job.description || "",
        location: job.location || "",
        type: job.type || "Full-time",
        salary: job.salary || "",
        requirements: job.requirements || [""],
        questions: job.questions || [""],
        status: job.status || JOB_STATUS.ACTIVE
      });
      setIsEditing(false); // Reset editing state when a new job is selected
    }
  }, [job]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (index: number, value: string, field: string) => {
    const newArray = [...(formData[field] as string[])];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: string) => {
    setFormData({
      ...formData,
      [field]: [...(formData[field] as string[]), ""]
    });
  };

  const removeArrayItem = (index: number, field: string) => {
    if ((formData[field] as string[]).length <= 1) return;
    const newArray = (formData[field] as string[]).filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, [field]: newArray });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast({
        title: MESSAGES.FIELDS_REQUIRED_TITLE,
        description: MESSAGES.FIELDS_INCOMPLETE_DESC_SIMPLE,
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
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(job.id);
    setShowDeleteConfirm(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const renderField = (value: string | undefined, isTextarea = false) => {
    if (isEditing) return null;
    return (
      <div
        className={`w-full px-4 py-3 rounded-lg text-slate-300 min-h-[44px] ${isTextarea ? "whitespace-pre-wrap" : ""}`}
      >
        {value || "-"}
      </div>
    );
  };

  const renderList = (items: string[]) => {
    if (isEditing) return null;
    if (!items || items.length === 0)
      return <div className="text-slate-400 px-4 py-2">-</div>;
    return (
      <ul className="list-disc list-inside space-y-1 px-4 py-2 text-slate-300">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <form onSubmit={handleSubmit}>
                <div className="flex justify-between items-start mb-6">
                  {isEditing ? (
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="text-3xl font-bold gradient-text bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                      required
                    />
                  ) : (
                    <h2 className="text-3xl font-bold gradient-text">
                      {job?.title}
                    </h2>
                  )}
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Edit className="w-4 h-4 mr-2" /> {BUTTONS.EDIT}
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" /> {BUTTONS.SAVE}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> {BUTTONS.DELETE}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-400">
                        {LABELS.LOCATION}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      ) : (
                        renderField(formData.location)
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-400">
                        {LABELS.CONTRACT_TYPE}
                      </label>
                      {isEditing ? (
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                        >
                          <option value="Full-time">
                            {CONTRACT_TYPE_LABELS.FULL_TIME}
                          </option>
                          <option value="Part-time">
                            {CONTRACT_TYPE_LABELS.PART_TIME}
                          </option>
                          <option value="Contract">
                            {CONTRACT_TYPE_LABELS.CONTRACT}
                          </option>
                          <option value="Freelance">
                            {CONTRACT_TYPE_LABELS.FREELANCE}
                          </option>
                        </select>
                      ) : (
                        renderField(formData.type)
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-400">
                        {LABELS.SALARY_RANGE}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="salary"
                          value={formData.salary}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      ) : (
                        renderField(formData.salary)
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-400">
                        {LABELS.STATUS}
                      </label>
                      {isEditing ? (
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                        >
                          <option value={JOB_STATUS.ACTIVE}>
                            {JOB_STATUS_LABELS.ACTIVE}
                          </option>
                          <option value={JOB_STATUS.INACTIVE}>
                            {JOB_STATUS_LABELS.INACTIVE}
                          </option>
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1.5 rounded-full text-sm font-semibold ${formData.status === JOB_STATUS.ACTIVE ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}
                        >
                          {formData.status === JOB_STATUS.ACTIVE
                            ? JOB_STATUS_LABELS.ACTIVE
                            : JOB_STATUS_LABELS.INACTIVE}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-400">
                      {LABELS.DESCRIPTION} *
                    </label>
                    {isEditing ? (
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                      />
                    ) : (
                      renderField(formData.description, true)
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-400">
                      {LABELS.REQUIREMENTS}
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        {formData.requirements?.map((req, index) => (
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
                              className="flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeArrayItem(index, "requirements")
                              }
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addArrayItem("requirements")}
                          className="w-full border-blue-500/50 text-cyan-400 hover:bg-blue-500/10"
                        >
                          <Plus className="w-4 h-4 mr-2" />{" "}
                          {BUTTONS.ADD_REQUIREMENT}
                        </Button>
                      </div>
                    ) : (
                      renderList(formData.requirements)
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-400">
                      {LABELS.AI_QUESTIONS}
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        {formData.questions?.map((q, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={q}
                              onChange={(e) =>
                                handleArrayChange(
                                  index,
                                  e.target.value,
                                  "questions"
                                )
                              }
                              className="flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeArrayItem(index, "questions")
                              }
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addArrayItem("questions")}
                          className="w-full border-blue-500/50 text-cyan-400 hover:bg-blue-500/10"
                        >
                          <Plus className="w-4 h-4 mr-2" />{" "}
                          {BUTTONS.ADD_QUESTION}
                        </Button>
                      </div>
                    ) : (
                      renderList(formData.questions)
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" />
              {TITLES.DELETE_JOB_CONFIRM}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {MESSAGES.CONFIRM_DELETE_JOB}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{BUTTONS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {BUTTONS.CONFIRM_DELETE}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default JobDetailModal;
