import { useState, useEffect } from "react";

const TOAST_LIMIT = 1;

let count = 0;
function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ToastState = {
  toasts: any[];
};

const toastStore: {
  state: ToastState;
  listeners: Array<(state: ToastState) => void>;
  getState: () => ToastState;
  setState: (
    nextState: ToastState | ((state: ToastState) => ToastState)
  ) => void;
  subscribe: (listener: (state: ToastState) => void) => () => void;
} = {
  state: {
    toasts: []
  },
  listeners: [],

  getState: () => toastStore.state,

  setState: (nextState) => {
    if (typeof nextState === "function") {
      toastStore.state = nextState(toastStore.state);
    } else {
      toastStore.state = { ...toastStore.state, ...nextState };
    }

    toastStore.listeners.forEach((listener) => listener(toastStore.state));
  },

  subscribe: (listener) => {
    toastStore.listeners.push(listener);
    return () => {
      toastStore.listeners = toastStore.listeners.filter((l) => l !== listener);
    };
  }
};

export const toast = ({ ...props }: any) => {
  const id = generateId();

  const update = (props: any) =>
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.map((t: any) =>
        t.id === id ? { ...t, ...props } : t
      )
    }));

  const dismiss = () =>
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.filter((t: any) => t.id !== id)
    }));

  toastStore.setState((state) => ({
    ...state,
    toasts: [{ ...props, id, dismiss }, ...state.toasts].slice(0, TOAST_LIMIT)
  }));

  return {
    id,
    dismiss,
    update
  };
};

export function useToast() {
  const [state, setState] = useState(toastStore.getState());

  useEffect(() => {
    const unsubscribe = toastStore.subscribe((state) => {
      setState(state);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    state.toasts.forEach((toast: any) => {
      if (toast.duration === Infinity) {
        return;
      }

      const timeout = setTimeout(() => {
        toast.dismiss();
      }, toast.duration || 5000);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [state.toasts]);

  return {
    toast,
    toasts: state.toasts
  };
}
