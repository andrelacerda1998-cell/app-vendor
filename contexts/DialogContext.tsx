import React, { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';

interface DialogContextProps {
  isOpen: boolean;
  openDialog: (content: ContentProps) => void;
  /** Fecha o diálogo. `depois` corre quando ele acabar de se esconder (ver `dialogEscondido`). */
  closeDialog: (depois?: () => void) => void;
  /** Chamado pelo anfitrião quando o diálogo acabou de sair do ecrã. */
  dialogEscondido: () => void;
  content: ContentProps | null;
  /** O anfitrião que desenha agora (o mais recente a montar). Ver `registarAnfitriao`. */
  anfitriaoAtivo: number | null;
  registarAnfitriao: () => { id: number; sair: () => void };
}

interface ContentProps {
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  successButtonText?: string;
  cancelButtonText?: string;
  /**
   * Cancelar em vermelho, para diálogos onde recusar é a decisão que se quer
   * sublinhar. NÃO é o default: na maioria dos diálogos cancelar é a ação
   * SEGURA, e vermelho reservado para o destrutivo (apagar, cancelar serviço).
   */
  dangerCancel?: boolean;
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

  /**
   * PILHA DE ANFITRIÕES: onde é que o diálogo é desenhado.
   *
   * O diálogo é um `Modal` nativo, e um `Modal` nativo é apresentado pelo
   * ecrã que o contém. Havia um só, na raiz da app -- e todos os ecrãs de
   * `(modals)/` são eles próprios apresentados como modal por cima da raiz.
   * Com um desses abertos, a raiz já está a apresentar uma coisa e o iOS não a
   * deixa apresentar outra: o diálogo falhava EM SILÊNCIO.
   *
   * Era isso que impedia gravar o Editar perfil e a Morada de faturação: os
   * dois pedem confirmação antes de gravar, e a confirmação nunca aparecia. O
   * técnico carregava em "Guardar alterações" e não acontecia nada.
   *
   * Cada contexto modal monta o seu `<Dialog/>`, e desenha SÓ o mais recente a
   * montar -- o mais fundo. Os outros ficam calados, por isso nunca há dois
   * diálogos nem dois temporizadores a fechar o mesmo. Quando o modal fecha,
   * o anfitrião dele sai e volta a desenhar o de baixo.
   */
  const pilhaRef = useRef<number[]>([]);
  const proximoIdRef = useRef(1);
  const [anfitriaoAtivo, setAnfitriaoAtivo] = useState<number | null>(null);

  const registarAnfitriao = useCallback(() => {
    const id = proximoIdRef.current++;
    pilhaRef.current = [...pilhaRef.current, id];
    setAnfitriaoAtivo(id);
    return {
      id,
      sair: () => {
        pilhaRef.current = pilhaRef.current.filter((x) => x !== id);
        setAnfitriaoAtivo(pilhaRef.current[pilhaRef.current.length - 1] ?? null);
      },
    };
  }, []);

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

  /**
   * O QUE O DIÁLOGO MANDA FAZER AO FECHAR CORRE DEPOIS DE ELE SAIR DO ECRÃ.
   *
   * O `onClose` (e o `onSuccess`/`onCancel` dos botões) corria antes de o
   * diálogo começar a esconder-se. Quase sempre é navegação -- "gravado, volta
   * atrás". Com o diálogo desenhado DENTRO de um modal (ver a pilha de
   * anfitriões), navegar para trás fechava esse modal com o diálogo ainda a
   * animar a saída: o diálogo ficava órfão, invisível, por cima de tudo, e a
   * app deixava de responder a toques. Agora a navegação espera que ele saia.
   *
   * Rede de segurança de 700 ms (a animação de saída tem 300): se nenhum
   * anfitrião avisar -- não havia nenhum a desenhar -- corre na mesma, para
   * nunca perder um `onClose`.
   */
  const pendentesRef = useRef<(() => void)[]>([]);
  const segurancaRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const correrPendentes = () => {
    if (segurancaRef.current) {
      clearTimeout(segurancaRef.current);
      segurancaRef.current = null;
    }
    const pendentes = pendentesRef.current;
    pendentesRef.current = [];
    pendentes.forEach((f) => f());
  };

  const closeDialog = (depois?: () => void) => {
    const closing = currentRef.current;
    const acoes = [closing?.onClose, depois].filter(Boolean) as (() => void)[];

    const next = queueRef.current.shift() ?? null;
    if (next) {
      // Aparece outro no mesmo sítio: o modal não chega a fechar, e não há
      // saída nenhuma por que esperar.
      acoes.forEach((f) => f());
      show(next);
      return;
    }
    currentRef.current = null;
    setIsOpen(false);
    setContent(null);

    if (acoes.length > 0) {
      pendentesRef.current.push(...acoes);
      if (segurancaRef.current) clearTimeout(segurancaRef.current);
      segurancaRef.current = setTimeout(correrPendentes, 700);
    }
  };

  const dialogEscondido = () => correrPendentes();

  return (
    <DialogContext.Provider value={{ isOpen, openDialog, closeDialog, dialogEscondido, content, anfitriaoAtivo, registarAnfitriao }}>
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
