import { Colors } from "../../styles/Colors";

const DEFAULT_IMAGE =
  "https://placehold.co/600x400?text=Evento";

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

export function toDateValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

export function normalizeEvento(item) {
  const dataInicio = toDateValue(
    item.dataInicio ||
      item.dataEvento ||
      item.startDate ||
      item.inicio ||
      item.date
  );

  const capacidade = Number(
    item.capacidade ||
      item.totalIngressos ||
      0
  );

  const vendidos = Number(
    item.ingressosVendidos ||
      item.vendidos ||
      0
  );

  const precoBase = Number(
    item.precoInteira ??
      item.preco ??
      item.valor ??
      0
  );

  const gratuito =
    item.gratuito === true ||
    item.tipoEvento === "gratuito" ||
    precoBase === 0 ||
    String(
      item.tipoIngresso || ""
    )
      .toLowerCase()
      .includes("grat");

  return {
    id: item.id,

    titulo:
      item.tituloEvento ||
      item.titulo ||
      item.name ||
      "Evento",

    imagem:
      item.imagemEvento ||
      item.imagem ||
      item.files?.header?.url ||
      item.image ||
      DEFAULT_IMAGE,

    videoUrl:
      item.videoTeaserUrl ||
      item.videoUrl ||
      item.teaserUrl ||
      null,

    local:
      item.localEvento ||
      item.nomeLocal ||
      item.local ||
      item.location?.name ||
      "Local",

    bairro:
      item.bairro ||
      item.endereco?.bairro ||
      item.location?.address ||
      "",

    categoria:
      item.categoria ||
      item.tipoEvento ||
      item.type ||
      "Outros",

    latitude:
      item.latitude ??
      item.location?.latitude ??
      null,

    longitude:
      item.longitude ??
      item.location?.longitude ??
      null,

    score: item.score || 0,

    dataInicio,

    capacidade,

    ingressosVendidos: vendidos,

    gratuito,

    precoInteira: precoBase,

    destaque:
      item.destaque === true ||
      item.featured === true,

    trending:
      item.trending === true,

    views: Number(item.views || 0),

    likes: Number(item.likes || 0),

    original: item,
  };
}

export function formatarDistancia(distancia) {
  if (distancia == null) {
    return "Distância indisponível";
  }

  if (distancia < 1) {
    return `${Math.round(
      distancia * 1000
    )} m`;
  }

  return `${distancia.toFixed(1)} km`;
}

export function getCountdownInfo(
  evento,
  now = new Date()
) {
  if (!evento?.dataInicio) {
    return {
      label: evento?.gratuito
        ? "Gratuito"
        : "Em destaque",

      tone: "neutral",
    };
  }

  const diffMs =
    evento.dataInicio.getTime() -
    now.getTime();

  const diffMinutes = Math.round(
    diffMs / 60000
  );

  if (diffMinutes <= -180) {
    return {
      label: "Ao vivo agora",
      tone: "live",
    };
  }

  if (diffMinutes <= 0) {
    return {
      label: "Ao vivo agora",
      tone: "live",
    };
  }

  if (diffMinutes < 60) {
    return {
      label: `Começa em ${diffMinutes} min`,
      tone: "soon",
    };
  }

  if (diffMinutes < 24 * 60) {
    return {
      label: `Começa em ${Math.round(
        diffMinutes / 60
      )}h`,
      tone: "soon",
    };
  }

  return {
    label: `${Math.round(
      diffMinutes / 1440
    )} dias`,

    tone: "neutral",
  };
}

export function getTicketSignal(evento) {
  const tipoLabel = evento?.gratuito
    ? "Gratuito"
    : "Pago";

  if (!evento?.capacidade) {
    return tipoLabel;
  }

  const restante =
    evento.capacidade -
    evento.ingressosVendidos;

  const ratio =
    restante / evento.capacidade;

  if (restante <= 0) {
    return "Esgotado";
  }

  if (ratio <= 0.18) {
    return "Últimos ingressos";
  }

  return tipoLabel;
}

export function buildUserSignals({
  likes = [],
  interactions = [],
}) {
  const likedSet = new Set(likes);

  const categories = {};

  const places = {};

  const eventIds = {};

  interactions.forEach((interaction) => {
    const weight =
      interaction.action === "like"
        ? 5
        : interaction.action === "view"
        ? 3
        : interaction.action === "stay"
        ? Math.min(
            6,
            1 +
              Number(
                interaction.durationMs || 0
              ) / 20000
          )
        : 2;

    if (interaction.categoria) {
      categories[interaction.categoria] =
        (categories[
          interaction.categoria
        ] || 0) + weight;
    }

    if (interaction.local) {
      places[interaction.local] =
        (places[
          interaction.local
        ] || 0) + weight;
    }

    if (interaction.eventoId) {
      eventIds[interaction.eventoId] =
        (eventIds[
          interaction.eventoId
        ] || 0) + weight;
    }
  });

  return {
    likedSet,
    categories,
    places,
    eventIds,
  };
}

export function scoreRecommendation(
  evento,
  signals
) {
  const categoryScore =
    signals.categories[
      evento.categoria
    ] || 0;

  const placeScore =
    signals.places[evento.local] || 0;

  const likedScore =
    signals.likedSet.has(evento.id)
      ? 8
      : 0;

  const distanceScore =
    typeof evento.distancia === "number"
      ? Math.max(
          0,
          8 - evento.distancia
        )
      : 0;

  const trendingBoost = evento.trending
    ? 12
    : 0;

  const featuredBoost = evento.destaque
    ? 10
    : 0;

  return (
    evento.score +
    categoryScore * 5 +
    placeScore * 3 +
    likedScore +
    distanceScore +
    trendingBoost +
    featuredBoost
  );
}

export function getRecommendationReason(
  evento,
  signals
) {
  if (
    signals.categories[
      evento.categoria
    ]
  ) {
    return `Porque você curtiu ${evento.categoria}`;
  }

  if (
    signals.places[evento.local]
  ) {
    return `Porque você foi ao ${evento.local}`;
  }

  if (
    typeof evento.distancia ===
      "number" &&
    evento.distancia < 4
  ) {
    return "Perto de você agora";
  }

  if (evento.trending) {
    return "Evento em alta na cidade";
  }

  return "Parecido com eventos em alta";
}

export function getCategoryColor(
  categoria = ""
) {
  const cat =
    categoria.toLowerCase();

  if (cat.includes("show")) {
    return Colors.primary;
  }

  if (cat.includes("festival")) {
    return Colors.primaryLight;
  }

  if (cat.includes("teatro")) {
    return Colors.warning;
  }

  if (cat.includes("arte")) {
    return Colors.success;
  }

  if (cat.includes("gastro")) {
    return "#F97316";
  }

  return Colors.textMuted;
}
