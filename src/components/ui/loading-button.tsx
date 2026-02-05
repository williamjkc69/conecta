import React from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Reusable button component with loading state
 * Automatically shows spinner and disables when loading
 *
 * @example
 * <LoadingButton
 *   isLoading={isSubmitting}
 *   loadingText="Guardando..."
 *   onClick={handleSubmit}
 * >
 *   Guardar
 * </LoadingButton>
 */
export const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  LoadingButtonProps
>(
  (
    { isLoading = false, loadingText, icon, children, disabled, ...props },
    ref
  ) => {
    return (
      <Button ref={ref} disabled={disabled || isLoading} {...props}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export default LoadingButton;
