import { Colors } from "../../styles/Colors";

const DEFAULT_IMAGE = "https://placehold.co/600x400?text=Evento";

export const categoriasHome = [
  "Todos",
  "Shows",
  "Teatro",
  "Arte",
  "Gastronomia",
  "Festival",
];

export const countdownTones = {
  neutral: {
    background: Colors.glass,
    border: Colors.glassBorder,
    icon: Colors.textPrimary,
  },
  live: {
    background: Colors.success,
    border: Colors.success,
    icon: Colors.textPrimary,
  },
  soon: {
    background: Colors.warning,
    border: Colors.warning,
    icon: Colors.textPrimary,
  },
};

// ─── Normalização de datas e eventos ─────────────────────────────────────────

export function toDateValue(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeEvento(item) {
  const dataInicio = toDateValue(
    item.dataInicio ||
      item.dataEvento ||
      item.startDate ||
      item.inicio ||
      item.date
  );

  const capacidade = Number(item.capacidade || item.totalIngressos || 0);
  const vendidos = Number(item.ingressosVendidos || item.vendidos || 0);
  const precoBase = Number(item.precoInteira ?? item.preco ?? item.valor ?? 0);

  const gratuito =
    item.gratuito === true ||
    item.tipoEvento === "gratuito" ||
    precoBase === 0 ||
    String(item.tipoIngresso || "").toLowerCase().includes("grat");

  return {
    id: item.id,
    titulo: item.tituloEvento || item.titulo || item.name || "Evento",
    imagem:
      item.imagemEvento ||
      item.imagem ||
      item.files?.header?.url ||
      item.image ||
      DEFAULT_IMAGE,
    videoUrl: item.videoTeaserUrl || item.videoUrl || item.teaserUrl || null,
    local:
      item.localEvento ||
      item.nomeLocal ||
      item.local ||
      item.location?.name ||
      "Local",
    bairro:
      item.bairro || item.endereco?.bairro || item.location?.address || "",
    categoria: item.categoria || item.tipoEvento || item.type || "Outros",
    latitude: item.latitude ?? item.location?.latitude ?? null,
    longitude: item.longitude ?? item.location?.longitude ?? null,
    score: item.score || 0,
    mediaAvaliacoes: item.avaliacoesResumo?.media || item.mediaAvaliacoes || 0,
    dataInicio,
    capacidade,
    ingressosVendidos: vendidos,
    gratuito,
    precoInteira: precoBase,
    destaque: item.destaque === true || item.featured === true,
    trending: item.trending === true,
    views: Number(item.views || 0),
    likes: Number(item.likes || 0),
    original: item,
  };
}

// ─── Formatação ───────────────────────────────────────────────────────────────

export function formatarDistancia(distancia) {
  if (distancia == null) return "Distância indisponível";
  if (distancia < 1) return `${Math.round(distancia * 1000)} m`;
  return `${distancia.toFixed(1)} km`;
}

export function getCountdownInfo(evento, now = new Date()) {
  if (!evento?.dataInicio) {
    return {
      label: evento?.gratuito ? "Gratuito" : "Em destaque",
      tone: "neutral",
    };
  }

  const diffMs = evento.dataInicio.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes <= 0) return { label: "Ao vivo agora", tone: "live" };
  if (diffMinutes < 60)
    return { label: `Começa em ${diffMinutes} min`, tone: "soon" };
  if (diffMinutes < 24 * 60)
    return {
      label: `Começa em ${Math.round(diffMinutes / 60)}h`,
      tone: "soon",
    };
  return {
    label: `${Math.round(diffMinutes / 1440)} dias`,
    tone: "neutral",
  };
}

export function getTicketSignal(evento) {
  const tipoLabel = evento?.gratuito ? "Gratuito" : "Pago";
  if (!evento?.capacidade) return tipoLabel;

  const restante = evento.capacidade - evento.ingressosVendidos;
  const ratio = restante / evento.capacidade;

  if (restante <= 0) return "Esgotado";
  if (ratio <= 0.18) return "Últimos ingressos";
  return tipoLabel;
}

// ─── Motor de sinais do usuário ───────────────────────────────────────────────

/**
 * Constrói o mapa de preferências do usuário a partir de todas as fontes de sinal.
 *
 * Hierarquia de pesos (do mais forte ao mais fraco):
 *   Frequentou (10) > Inscrito (8) > Curtiu (7) > Interação like (5)
 *   > Interação view/stay (3) > Interação click (2)
 */
export function buildUserSignals({
  likes = [],
  interactions = [],
  likedEvents = [],
  subscribedEvents = [],
  attendedEvents = [],
}) {
  const likedSet = new Set(likes);
  const categories = {};
  const places = {};
  const eventIds = {};

  const boostCategory = (categoria, weight) => {
    if (!categoria) return;
    categories[categoria] = (categories[categoria] || 0) + weight;
  };

  const boostPlace = (local, weight) => {
    if (!local) return;
    places[local] = (places[local] || 0) + weight;
  };

  const boostEventId = (id, weight) => {
    if (!id) return;
    eventIds[id] = (eventIds[id] || 0) + weight;
  };

  // Curtidas
  likedEvents.forEach((evento) => {
    boostCategory(evento.categoria, 7);
    boostPlace(evento.local, 3);
    boostEventId(evento.id, 7);
  });

  // Inscrições (intenção declarada — sinal forte)
  subscribedEvents.forEach((evento) => {
    boostCategory(evento.categoria || evento.tipoEvento, 8);
    boostPlace(evento.localEvento || evento.nomeLocal || evento.local, 4);
    boostEventId(evento.eventoId || evento.id, 8);
  });

  // Frequência presencial (sinal mais forte de todas — gosto confirmado)
  attendedEvents.forEach((evento) => {
    boostCategory(evento.categoria || evento.tipoEvento, 10);
    boostPlace(
      evento.eventoLocal || evento.localEvento || evento.local,
      6
    );
  });

  // Interações implícitas (cliques, views, tempo de leitura)
  interactions.forEach((interaction) => {
    const weight =
      interaction.action === "like"
        ? 5
        : interaction.action === "view"
        ? 3
        : interaction.action === "stay"
        ? Math.min(6, 1 + Number(interaction.durationMs || 0) / 20000)
        : 2; // click

    boostCategory(interaction.categoria, weight);
    boostPlace(interaction.local, weight);
    boostEventId(interaction.eventoId, weight);
  });

  // Resumo descritivo para a UI ("Para você porque…")
  const historySummary = _buildHistorySummary(categories, places, likes.length);

  return { likedSet, categories, places, eventIds, historySummary };
}

function _buildHistorySummary(categories, places, totalLikes) {
  const topCat = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => cat);

  const topLocal = Object.entries(places)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1)
    .map(([local]) => local);

  const parts = [];
  if (topCat.length) parts.push(`curtiu ${topCat.join(" e ")}`);
  if (topLocal.length) parts.push(`frequenta ${topLocal[0]}`);
  if (totalLikes > 0) parts.push(`${totalLikes} curtida${totalLikes > 1 ? "s" : ""}`);

  return parts.length ? parts.join(" · ") : null;
}

// ─── Pontuação de recomendação ─────────────────────────────────────────────────

/**
 * Calcula a pontuação de relevância personalizada de um evento para o usuário.
 *
 * Componentes do score:
 *  • score base       — popularidade do evento (likes, views, comentários)
 *  • categoryScore    — afinidade categoria × 5
 *  • placeScore       — afinidade local × 3
 *  • likedBoost       — já curtiu o evento (promoção por familiaridade)
 *  • distanceScore    — proximidade física (0-8 pontos)
 *  • trendingBoost    — evento marcado como trending
 *  • featuredBoost    — evento em destaque pela curadoria
 *  • ratingBoost      — avaliação média × 2
 *  • noveltyBoost     — evento recente que o usuário ainda não viu
 *  • repeatPenalty    — penalidade para eventos já interagidos (evita repetição)
 */
export function scoreRecommendation(evento, signals) {
  if (!evento || !signals) return 0;

  const categoryAffinity = signals.categories[evento.categoria] || 0;
  const placeAffinity = signals.places[evento.local] || 0;
  const interactionWeight = signals.eventIds[evento.id] || 0;

  // Sinais positivos
  const categoryScore = categoryAffinity * 5;
  const placeScore = placeAffinity * 3;
  const likedBoost = signals.likedSet?.has(evento.id) ? 8 : 0;
  const trendingBoost = evento.trending ? 12 : 0;
  const featuredBoost = evento.destaque ? 10 : 0;
  const ratingBoost = Number(evento.mediaAvaliacoes || 0) * 2;

  // Boost por proximidade física (0-8 pontos, cai linearmente até 8km)
  const distanceScore =
    typeof evento.distancia === "number"
      ? Math.max(0, 8 - evento.distancia)
      : 0;

  // Boost de novidade: eventos recentes sem interação prévia sobem
  const isNew =
    evento.dataInicio instanceof Date &&
    Date.now() - evento.dataInicio.getTime() < 7 * 24 * 60 * 60 * 1000;
  const noveltyBoost = isNew && !interactionWeight ? 6 : 0;

  // Penalidade suave para eventos já muito interagidos (evita sempre mostrar os mesmos)
  // Mantém no feed se ainda for relevante, mas com desconto
  const repeatPenalty = interactionWeight > 0 ? Math.min(interactionWeight * 2, 15) : 0;

  return (
    evento.score +
    categoryScore +
    placeScore +
    likedBoost +
    distanceScore +
    trendingBoost +
    featuredBoost +
    ratingBoost +
    noveltyBoost -
    repeatPenalty
  );
}

// ─── Motivo da recomendação (para o card) ─────────────────────────────────────

/**
 * Retorna o motivo mais específico e personalizado para exibir no card.
 * Prioridade: categoria afim > local afim > proximidade > trending > fallback
 */
export function getRecommendationReason(evento, signals) {
  if (!evento || !signals) return "Evento em destaque";

  const catScore = signals.categories?.[evento.categoria] || 0;
  const placeScore = signals.places?.[evento.local] || 0;

  // Categoria com alta afinidade
  if (catScore >= 10)
    return `Seu estilo favorito: ${evento.categoria}`;
  if (catScore > 0)
    return `Porque você curtiu ${evento.categoria}`;

  // Local com alta afinidade
  if (placeScore >= 8)
    return `Você frequenta ${evento.local}`;
  if (placeScore > 0)
    return `Conecta com ${evento.local}`;

  // Já curtiu o evento
  if (signals.likedSet?.has(evento.id))
    return "Você curtiu este evento";

  // Próximo fisicamente
  if (typeof evento.distancia === "number" && evento.distancia < 2)
    return "A menos de 2 km de você";
  if (typeof evento.distancia === "number" && evento.distancia < 5)
    return "Perto de você agora";

  // Trending / destaque
  if (evento.trending) return "Em alta na cidade";
  if (evento.destaque) return "Selecionado pela curadoria";

  // Avaliação alta
  if (Number(evento.mediaAvaliacoes) >= 4.5)
    return "Muito bem avaliado";

  return "Parecido com eventos em alta";
}

// ─── Métricas de perfil ────────────────────────────────────────────────────────

/**
 * Retorna um número de 0-100 indicando o quão "rico" é o perfil de preferências.
 * Usado para decidir se exibe ou não a seção "Para você" vs fallback de popularidade.
 */
export function getProfileStrength(signals) {
  if (!signals) return 0;

  const categoriesScore = Math.min(
    Object.values(signals.categories || {}).reduce((s, v) => s + v, 0) / 3,
    40
  );
  const placesScore = Math.min(
    Object.values(signals.places || {}).reduce((s, v) => s + v, 0) / 5,
    20
  );
  const likesScore = Math.min((signals.likedSet?.size || 0) * 4, 25);
  const interactionsScore = Math.min(
    Object.keys(signals.eventIds || {}).length * 2,
    15
  );

  return Math.round(categoriesScore + placesScore + likesScore + interactionsScore);
}

/**
 * Retorna as top N categorias e locais do usuário para exibição
 * nos pills de insight da seção "Para você".
 */
export function getTopAffinities(signals, n = 3) {
  const topCategorias = Object.entries(signals.categories || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([cat]) => cat);

  const topLocais = Object.entries(signals.places || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([local]) => local);

  return { topCategorias, topLocais };
}

// ─── Cores de categoria ────────────────────────────────────────────────────────

export function getCategoryColor(categoria = "") {
  const cat = categoria.toLowerCase();
  if (cat.includes("show")) return Colors.primary;
  if (cat.includes("festival")) return Colors.primaryLight;
  if (cat.includes("teatro")) return Colors.warning;
  if (cat.includes("arte")) return Colors.success;
  if (cat.includes("gastro")) return "#F97316";
  return Colors.textMuted;
}
