import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmPrompt from "../components/ConfirmPrompt";

const ConfirmPromptContext = createContext(null);

export const ConfirmPromptProvider = ({ children }) => {
  const [isShowing, setIsShowing] = useState(false);
  const [message, setMessage] = useState("");
  const [resolvePromise, setResolvePromise] = useState(null);

  const show = useCallback((message) => {
    setMessage(message);
    setIsShowing(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const hide = useCallback(() => {
    setIsShowing(false);
    if (resolvePromise) {
      resolvePromise(false); // Default action when modal is closed without confirmation
    }
  }, [resolvePromise]);

  const confirm = useCallback(() => {
    setIsShowing(false);
    if (resolvePromise) {
      resolvePromise(true);
    }
  }, [resolvePromise]);

  const cancel = useCallback(() => {
    setIsShowing(false);
    if (resolvePromise) {
      resolvePromise(false);
    }
  }, [resolvePromise]);

  return (
    <ConfirmPromptContext.Provider value={{ show, hide, confirm, cancel }}>
      {children}
      <ConfirmPrompt
        isShowing={isShowing}
        hide={hide}
        onConfirm={confirm}
        onCancel={cancel}
        message={message}
      />
    </ConfirmPromptContext.Provider>
  );
};

export const useConfirmPrompt = () => {
  return useContext(ConfirmPromptContext);
};
