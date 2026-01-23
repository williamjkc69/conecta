import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <span className="text-sm text-slate-400">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        Siguiente
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;
