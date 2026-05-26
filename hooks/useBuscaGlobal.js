import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

const HISTORY_KEY = "@monitoracult_busca_global";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200";

const normalizar = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;

  const brDate = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDate) {
    const [, day, month, year] = brDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isThisWeekend = (date) => {
  if (!date) return false;

  const now = new Date();
  const day = now.getDay();
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + ((6 - day + 7) % 7));
  saturday.setHours(0, 0, 0, 0);

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  sunday.setHours(23, 59, 59, 999);

  return date >= saturday && date <= sunday;
};

export const mapEventoBusca = (item) => {
  const preco = Number(item.precoInteira ?? item.preco ?? 0);
  const gratuito =
    item.gratuito === true ||
    item.tipoEvento === "gratuito" ||
    preco === 0;

  const mediaAvaliacoes = Number(
    item.avaliacoesResumo?.media ??
      item.mediaAvaliacoes ??
      item.notaMedia ??
      0
  );

  const totalAvaliacoes = Number(
    item.avaliacoesResumo?.total ??
      item.totalAvaliacoes ??
      item.avaliacoesCount ??
      0
  );

  const score =
    item.score ??
    (item.likes || 0) * 3 +
      (item.comentarios || 0) * 4 +
      (item.views || 0) * 0.3 +
      (gratuito ? 2 : 4) +
      mediaAvaliacoes * 4;

  return {
    id: item.id,
    titulo: item.tituloEvento || item.titulo || item.name || "Evento",
    descricao:
      item.descricao || item.shortDescription || "Evento cultural.",
    imagem:
      item.imagemEvento || item.files?.header?.url || item.image?.url || DEFAULT_IMAGE,
    local: item.localEvento || item.nomeLocal || item.location?.name || "",
    cidade: item.cidade || "",
    bairro: item.bairro || "",
    uf: item.uf || "",
    categoria: item.categoria || "Outros",
    dataEvento: item.dataEvento || item.startDate || null,
    dataEventoTimestamp: item.dataEventoTimestamp || item.startDate || null,
    preco,
    gratuito,
    likes: item.likes || 0,
    views: item.views || 0,
    score,
    mediaAvaliacoes,
    totalAvaliacoes,
    origem: item.origem || "app",
    possuiImagem: item.possuiImagem,
    original: item.original || item,
  };
};

export function useBuscaGlobal(filtros = {}, eventosExternos = []) {
  const [eventosFirestore, setEventosFirestore] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY)
      .then((value) => {
        if (value) setHistorico(JSON.parse(value));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const constraints = [orderBy("createdAt", "desc"), limit(80)];
    const q = query(collection(db, "eventos"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs
          .map((document) =>
            mapEventoBusca({
              id: document.id,
              ...document.data(),
            })
          )
          .filter((item) => item.original?.ativo !== false);

        setEventosFirestore(lista);
        setLoading(false);
      },
      (err) => {
        console.log("Erro na busca em tempo real:", err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const salvarBusca = useCallback(async (termo, extras = {}) => {
    const texto = termo?.trim();
    if (!texto) return;

    const entrada = {
      termo: texto,
      filtros: extras,
      createdAt: new Date().toISOString(),
    };

    setHistorico((atual) => {
      const proximo = [
        entrada,
        ...atual.filter((item) => normalizar(item.termo) !== normalizar(texto)),
      ].slice(0, 8);

      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(proximo)).catch(() => {});
      return proximo;
    });
  }, []);

  const limparHistorico = useCallback(async () => {
    setHistorico([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  }, []);

  const resultados = useMemo(() => {
    const {
      query: termo = "",
      categoria = "Todos",
      data = "todos",
      localizacao = "",
      preco = "todos",
    } = filtros;

    const termoBusca = normalizar(termo);
    const localBusca = normalizar(localizacao);
    const hoje = new Date();

    return [...eventosFirestore, ...eventosExternos.map(mapEventoBusca)]
      .filter((evento) => {
        if (categoria !== "Todos" && evento.categoria !== categoria) {
          return false;
        }

        if (preco === "gratuito" && !evento.gratuito) return false;
        if (preco === "pago" && evento.gratuito) return false;

        if (localBusca) {
          const alvoLocal = normalizar(
            `${evento.local} ${evento.bairro} ${evento.cidade} ${evento.uf}`
          );
          if (!alvoLocal.includes(localBusca)) return false;
        }

        const dataEvento = toDate(evento.dataEventoTimestamp || evento.dataEvento);
        if (data === "hoje" && !isSameDay(dataEvento, hoje)) return false;
        if (data === "proximos" && dataEvento && dataEvento < hoje) return false;
        if (data === "fimDeSemana" && !isThisWeekend(dataEvento)) return false;

        if (!termoBusca) return true;

        const alvo = normalizar(
          `${evento.titulo} ${evento.descricao} ${evento.local} ${evento.categoria}`
        );
        return alvo.includes(termoBusca);
      })
      .sort((a, b) => {
        if (a.origem === "app" && b.origem !== "app") return -1;
        if (a.origem !== "app" && b.origem === "app") return 1;
        return (b.score || 0) - (a.score || 0);
      });
  }, [eventosFirestore, eventosExternos, filtros]);

  return {
    resultados,
    eventosFirestore,
    historico,
    loading,
    error,
    salvarBusca,
    limparHistorico,
  };
}
