import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';

interface DialogContextProps {
  isOpen: boolean;
  openDialog: (content: ContentProps) => void;
  closeDialog: () => void;
  content: ContentProps | null;
}

interface ContentProps {
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  successButtonText?: string;
  cancelButtonText?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  customContent?: ReactNode;
  closeOnClickOutside?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  closeAfterMSeconds?: number;
  onClose?: () => void;
}

const DialogContext = createContext<DialogContextProps | undefined>(undefined);

/**
 * Diálogos em FILA, não em slot único.
 *
 * Antes, um openDialog novo substituía o que estivesse aberto — o pedido
 * persistente de permissão de localização era "engolido" por qualquer erro
 * que chegasse a seguir, e vários fluxos tinham coreografias frágeis para o
 * evitar (comentários "would clobber the persistent prompt" espalhados).
 * Agora o diálogo aberto termina o seu ciclo (toque, timeout ou botão) e só
 * então aparece o seguinte.
 *
 * Diálogos IDÊNTICOS consecutivos (mesmo título+subtítulo) não se acumulam:
 * três erros iguais em rajada mostram-se uma vez, não três.
 */
export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ContentProps | null>(null);
  const queueRef = useRef<ContentProps[]>([]);
  // O estado `content` fica obsoleto dentro de closures antigas; a ref é a
  // fonte de verdade síncrona para as decisões de fila.
  const currentRef = useRef<ContentProps | null>(null);

  const sameDialog = (a: ContentProps | null, b: ContentProps) =>
    !!a && a.title === b.title && a.subtitle === b.subtitle && !a.customContent && !b.customContent;

  const show = (next: ContentProps) => {
    currentRef.current = next;
    setContent(next);
    setIsOpen(true);
  };

  const openDialog = (next: ContentProps) => {
    if (!currentRef.current) {
      show(next);
      return;
    }
    // Já há um aberto: entra na fila (a não ser que seja um duplicado do
    // aberto ou do último em espera).
    const last = queueRef.current[queueRef.current.length - 1] ?? null;
    if (sameDialog(currentRef.current, next) || sameDialog(last, next)) return;
    queueRef.current.push(next);
  };

  const closeDialog = () => {
    const closing = currentRef.current;
    if (closing?.onClose) closing.onClose();

    const next = queueRef.current.shift() ?? null;
    if (next) {
      show(next);
      return;
    }
    currentRef.current = null;
    setIsOpen(false);
    setContent(null);
  };

  return (
    <DialogContext.Provider value={{ isOpen, openDialog, closeDialog, content }}>
      {children}
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextProps => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
