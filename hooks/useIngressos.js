/**
 * 🎫 HOOK PARA GERENCIAR INGRESSOS
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  comprarIngressos,
  obterIngressosUsuario,
  verificarIngresso,
  TIPOS_INGRESSO,
} from "../services/ingressoServiceV2";

export const useIngressos = () => {
  const [ingressos, setIngressos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const isMountedRef = useRef(true);

  // Cleanup + limpa carrinho ao desmontar a tela
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      setCarrinho([]);
    };
  }, []);

  // Carregar ingressos do usuário
  const carregarIngressos = useCallback(async (userId, filtro = "todos") => {
    if (!userId || !isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const dados = await obterIngressosUsuario(userId, filtro);

      if (isMountedRef.current) {
        setIngressos(dados);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Adicionar ao carrinho
  const adicionarAoCarrinho = useCallback((tipo, quantidade = 1, precoUnitario) => {
    setCarrinho(prev => {
      const existe = prev.find(item => item.tipo === tipo);

      if (existe) {
        return prev.map(item =>
          item.tipo === tipo
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      }

      return [
        ...prev,
        {
          tipo,
          quantidade,
          precoUnitario,
          desconto: TIPOS_INGRESSO[tipo.toUpperCase()]?.desconto || 0,
        },
      ];
    });
  }, []);

  // Remover do carrinho
  const removerDoCarrinho = useCallback(tipo => {
    setCarrinho(prev => prev.filter(item => item.tipo !== tipo));
  }, []);

  // Atualizar quantidade no carrinho
  const atualizarQuantidade = useCallback((tipo, quantidade) => {
    if (quantidade <= 0) {
      removerDoCarrinho(tipo);
      return;
    }

    setCarrinho(prev =>
      prev.map(item =>
        item.tipo === tipo ? { ...item, quantidade } : item
      )
    );
  }, [removerDoCarrinho]);

  // Limpar carrinho
  const limparCarrinho = useCallback(() => {
    setCarrinho([]);
  }, []);

  // Calcular total
  const calcularTotal = useCallback(() => {
    return carrinho.reduce((total, item) => {
      const precoComDesconto = item.precoUnitario * (1 - item.desconto);
      return total + precoComDesconto * item.quantidade;
    }, 0);
  }, [carrinho]);

  // Comprar ingressos
  const comprar = useCallback(
    async (eventoId, userId, userName, userEmail, userPhoto, metodoPagamento) => {
      if (!carrinho.length) {
        throw new Error("Carrinho vazio");
      }

      setLoading(true);
      setError(null);

      try {
        const resultado = await comprarIngressos({
          eventoId,
          userId,
          userName,
          userEmail,
          userPhoto,
          ingressos: carrinho,
          valorTotal: calcularTotal(),
          metodoPagamento,
        });

        if (isMountedRef.current) {
          limparCarrinho();
          setIngressos(prev => [...prev, resultado]);
        }

        return resultado;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message);
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [carrinho, calcularTotal, limparCarrinho]
  );

  // Verificar ingresso
  const verificar = useCallback(async (codigoIngresso, eventoId) => {
    setLoading(true);
    setError(null);

    try {
      const resultado = await verificarIngresso(codigoIngresso, eventoId);

      if (isMountedRef.current) {
        if (!resultado.valido) {
          setError(resultado.mensagem);
        }
      }

      return resultado;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  return {
    // Estado
    ingressos,
    carrinho,
    loading,
    error,

    // Métodos
    carregarIngressos,
    adicionarAoCarrinho,
    removerDoCarrinho,
    atualizarQuantidade,
    limparCarrinho,
    comprar,
    verificar,

    // Cálculos
    total: calcularTotal(),
    quantidadeTotal: carrinho.reduce((acc, item) => acc + item.quantidade, 0),
  };
};