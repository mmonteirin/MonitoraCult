import { useState, useCallback, useRef, useEffect } from "react";
import {
  enviarMensagem,
  obterMensagens,
  marcarComolidas,
  deletarMensagem,
  editarMensagem,
  escutarMensagens,
  escutarConversas,
  obterOuCriarConversa,
  deletarConversaParaUsuario,
  restaurarConversa,
} from "../services/dmService";

// ─── Hook: lista de conversas ─────────────────────────────────────────────────

export const useDirectMessages = (userId) => {
  const [conversas, setConversas]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState(null);
  const [naoLidas, setNaoLidas]     = useState(0);
  const [conversasDeletadas, setConversasDeletadas] = useState(new Set());

  // Um único ref — nunca duplicar o useEffect de cleanup
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Garante reset ao trocar de userId
    isMountedRef.current = true;
    setConversasDeletadas(new Set());

    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let unsubscribe = () => {};

    try {
      unsubscribe = escutarConversas(userId, (novasConversas) => {
        if (!isMountedRef.current) return;

        // Filtrar conversas deletadas localmente
        const conversasFiltradas = novasConversas.filter(
          (c) => !conversasDeletadas.has(c.id)
        );

        setConversas(conversasFiltradas);
        setLoading(false);

        let total = 0;
        conversasFiltradas.forEach((c) => {
          total += c.naoLido?.[userId] || 0;
        });
        setNaoLidas(total);
      });
    } catch (err) {
      if (isMountedRef.current) {
        setErro(err.message);
        setLoading(false);
      }
    }

    // Único ponto de cleanup
    return () => {
      isMountedRef.current = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [userId]); // Só re-executa se userId mudar

  const iniciarConversa = useCallback(
    async (outroUserId, outroUserName, outroUserPhoto) => {
      try {
        return await obterOuCriarConversa(userId, outroUserId, outroUserName, outroUserPhoto);
      } catch (err) {
        console.error("Erro ao iniciar conversa:", err);
        return { success: false, error: err.message };
      }
    },
    [userId]
  );

  const deletarConversa = useCallback(
    async (conversaId) => {
      try {
        console.log("Deletando conversa:", conversaId, "para usuário:", userId);
        const resultado = await deletarConversaParaUsuario(conversaId, userId);
        console.log("Resultado da deleção:", resultado);
        if (resultado.success) {
          // Adicionar à lista de deletadas localmente
          setConversasDeletadas(prev => new Set(prev).add(conversaId));
          // Remover da lista local imediatamente
          setConversas(prev => prev.filter(c => c.id !== conversaId));
          console.log("Conversa removida da lista local");
        }
        return resultado;
      } catch (err) {
        console.error("Erro ao deletar conversa:", err);
        return { success: false, error: err.message };
      }
    },
    [userId]
  );

  const restaurarConversaFn = useCallback(
    async (conversaId) => {
      try {
        const resultado = await restaurarConversa(conversaId, userId);
        if (resultado.success) {
          // Remover da lista de deletadas localmente
          setConversasDeletadas(prev => {
            const novoSet = new Set(prev);
            novoSet.delete(conversaId);
            return novoSet;
          });
        }
        return resultado;
      } catch (err) {
        console.error("Erro ao restaurar conversa:", err);
        return { success: false, error: err.message };
      }
    },
    [userId]
  );

  return { conversas, loading, erro, naoLidas, iniciarConversa, deletarConversa, restaurarConversaFn };
};

// ─── Hook: conversa individual ────────────────────────────────────────────────

export const useConversation = (userId, conversaId) => {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [erro, setErro]           = useState(null);
  const [enviando, setEnviando]   = useState(false);

  // Um único ref
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Reset ao trocar de conversa
    isMountedRef.current = true;
    setMensagens([]);
    setErro(null);

    if (!conversaId || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let unsubscribe = () => {};

    // Fetch inicial do histórico
    obterMensagens(conversaId, 100)
      .then((msgs) => {
        if (isMountedRef.current) {
          setMensagens(msgs);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          setErro(err.message);
          setLoading(false);
        }
      });

    // Listener em tempo real
    try {
      unsubscribe = escutarMensagens(conversaId, (novasMensagens) => {
        if (!isMountedRef.current) return;
        setMensagens(novasMensagens);
        // Marcar como lidas sem bloquear
        marcarComolidas(conversaId, userId).catch(() => {});
      });
    } catch (err) {
      if (isMountedRef.current) {
        setErro(err.message);
        setLoading(false);
      }
    }

    // Único ponto de cleanup
    return () => {
      isMountedRef.current = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [conversaId, userId]); // Só re-executa ao trocar conversa ou usuário

  const enviar = useCallback(
    async (dados) => {
      if (!conversaId || !userId) return { success: false };
      try {
        setEnviando(true);
        const resultado = await enviarMensagem({ remetenteId: userId, ...dados, conversaId });
        if (isMountedRef.current) {
          setEnviando(false);
          if (!resultado.success) setErro(resultado.error);
        }
        return resultado;
      } catch (err) {
        if (isMountedRef.current) { setEnviando(false); setErro(err.message); }
        return { success: false, error: err.message };
      }
    },
    [conversaId, userId]
  );

  const deletar = useCallback(
    async (mensagemId) => {
      try {
        const resultado = await deletarMensagem(conversaId, mensagemId, userId);
        if (resultado.success && isMountedRef.current) {
          setMensagens((prev) =>
            prev.map((m) =>
              m.id === mensagemId ? { ...m, deletado: true, texto: "[Mensagem deletada]" } : m
            )
          );
        }
        return resultado;
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [conversaId, userId]
  );

  const editar = useCallback(
    async (mensagemId, novoTexto) => {
      try {
        const resultado = await editarMensagem(conversaId, mensagemId, novoTexto, userId);
        if (resultado.success && isMountedRef.current) {
          setMensagens((prev) =>
            prev.map((m) =>
              m.id === mensagemId ? { ...m, texto: novoTexto, editado: true } : m
            )
          );
        }
        return resultado;
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [conversaId, userId]
  );

  return {
    mensagens,
    loading,
    erro,
    enviando,
    enviar,
    deletar,
    editar,
    totalMensagens: mensagens.length,
  };
};

export default useDirectMessages;