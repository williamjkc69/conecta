import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { TITLES, MESSAGES, BUTTONS } from "@/constants/text";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isDeleting?: boolean;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Reusable delete confirmation dialog
 * Shows a modal with warning message and confirm/cancel buttons
 *
 * @example
 * <DeleteConfirmationDialog
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   isDeleting={isDeleting}
 *   title="¿Eliminar vacante?"
 *   description="Esta acción no se puede deshacer..."
 * />
 */
export const DeleteConfirmationDialog: React.FC<
  DeleteConfirmationDialogProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  title = TITLES.CONFIRM_DELETE_USER, // Using a generic one or existing
  description = MESSAGES.SOMETHING_WENT_WRONG, // Will add generic later if needed
  isDeleting = false,
  confirmText = BUTTONS.CONFIRM_DELETE,
  cancelText = BUTTONS.CANCEL
}) => {
  if (!isOpen) return null;

  const loadingText = BUTTONS.DELETING;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-slate-800 rounded-xl p-6 max-w-md w-full border border-red-500/20"
        >
          <h3 className="text-xl font-bold text-slate-100 mb-2 flex items-center gap-2">
            <Trash2 className="text-red-500" />
            {title}
          </h3>
          <p className="text-slate-300 mb-6">{description}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1"
            >
              {cancelText}
            </Button>
            <LoadingButton
              variant="destructive"
              onClick={onConfirm}
              isLoading={isDeleting}
              loadingText={loadingText}
              className="flex-1"
            >
              {confirmText}
            </LoadingButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteConfirmationDialog;
