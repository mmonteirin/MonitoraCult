import { getEventosMapaVivoMock } from "./mapaVivoService";

const BASE_URL =
  "https://mapacultural.secult.ce.gov.br/api";

// Limites de segurança
const EVENTOS_LIMIT = 50;
const ESPACOS_LIMIT = 50;
const AGENTES_LIMIT = 50;

const TIMEOUT = 15000;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000;

// ---------- FETCH SEGURO COM RETRY ----------

const safeFetch = async (url, retries = RETRY_ATTEMPTS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    clearTimeout(timeoutId);

    if (retries > 0 && !error.name.includes('AbortError')) {
      console.log(`Retrying fetch (${retries} attempts left)...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return safeFetch(url, retries - 1);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// ---------- NORMALIZADOR ----------

const normalizeResponse =
  (json) => {

    if (
      Array.isArray(json)
    )
      return json;

    if (json?.data)
      return json.data;

    if (json?.results)
      return json.results;

    return [];
};

const hasUsefulEventFields = (evento) => {
  const source = getEntitySource(evento);
  return Boolean(
    source?.name ||
    source?.title ||
    source?.titulo ||
    source?.nome ||
    source?.shortDescription ||
    source?.description ||
    source?.occurrences?.length ||
    source?.location?.name
  );
};

const normalizarEventoMapaVivoFallback = (evento) => ({
  id: evento.id,
  name: evento.title,
  shortDescription: evento.description,
  location: {
    name: evento.address || "Fortaleza",
    latitude: evento.location?.latitude,
    longitude: evento.location?.longitude,
  },
  occurrences: [
    {
      startDate: evento.date,
      startsOn: evento.date,
      start: evento.date,
    },
  ],
  terms: {
    linguagem: [evento.genre || "Cultura"],
  },
  fromMapaVivoFallback: true,
});

const getFallbackEventosMapaVivo = () =>
  getEventosMapaVivoMock().map(normalizarEventoMapaVivoFallback);

const CATEGORY_KEYWORDS = [
  { label: "Música", words: ["música", "musica", "show", "concerto", "banda", "cantor", "cantora"] },
  { label: "Teatro", words: ["teatro", "peça", "peca", "drama", "espetáculo", "espetaculo"] },
  { label: "Exposição", words: ["exposição", "exposicao", "mostra", "galeria"] },
  { label: "Cinema", words: ["cinema", "filme", "audiovisual", "curta", "longa"] },
  { label: "Dança", words: ["dança", "danca", "ballet", "balé", "coreografia"] },
  { label: "Literatura", words: ["literatura", "livro", "leitura", "poesia", "saraus", "sarau"] },
  { label: "Gastronomia", words: ["gastronomia", "comida", "culinária", "culinaria"] },
  { label: "Festival", words: ["festival", "feira", "festa"] },
  { label: "Fotografia", words: ["fotografia", "foto"] },
  { label: "Artes Visuais", words: ["artes visuais", "arte visual", "artes plásticas", "artes plasticas"] },
  { label: "Cultura Popular", words: ["cultura popular", "tradição", "tradicao", "folclore"] },
];

const GENERIC_CATEGORY_VALUES = new Set([
  "evento",
  "eventos",
  "evento cultural",
  "eventos culturais",
  "cultura",
  "cultural",
]);

const getTextValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return getTextValue(value.find((item) => getTextValue(item)));
  }
  if (typeof value === "object") {
    const namedValue = getTextValue(
      value.name ||
      value.title ||
      value.label ||
      value.nome ||
      value.value ||
      value.term
    );
    if (namedValue) return namedValue;

    const firstValue = Object.values(value).find((item) => getTextValue(item));
    if (firstValue) return getTextValue(firstValue);

    return Object.keys(value).find(Boolean) || "";
  }
  return "";
};

const getTermValue = (terms, key) => {
  if (!terms) return "";

  if (Array.isArray(terms)) {
    const found = terms.find((term) => {
      const group = getTextValue(term?.taxonomy || term?.group || term?.slug || term?.key);
      return group.toLowerCase().includes(key.toLowerCase());
    });
    return getTextValue(found);
  }

  return getTextValue(terms[key]);
};

const getEntitySource = (evento) => {
  if (!evento || Array.isArray(evento) || typeof evento !== "object") return evento;

  if (
    evento.name ||
    evento.title ||
    evento.titulo ||
    evento.nome ||
    evento.shortDescription ||
    evento.description ||
    evento.terms
  ) {
    return evento;
  }

  const nestedEntity = Object.values(evento).find(
    (value) =>
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (
        value.name ||
        value.title ||
        value.titulo ||
        value.nome ||
        value.shortDescription ||
        value.description ||
        value.terms
      )
  );

  return nestedEntity || evento;
};

const inferCategoryFromText = (text = "") => {
  const normalizedText = text.toLowerCase();
  const match = CATEGORY_KEYWORDS.find(({ words }) =>
    words.some((word) => normalizedText.includes(word))
  );
  return match?.label || "";
};

export const getTituloMapaCultural = (evento, fallback = "Evento sem título") =>
  {
    const source = getEntitySource(evento);
    return (
      getTextValue(
        source?.name ||
        source?.title ||
        source?.titulo ||
        source?.nome ||
        source?.["@name"]
      ) ||
      getTextValue(source?.shortDescription || source?.description).slice(0, 80) ||
      fallback
    );
  };

export const getDescricaoMapaCultural = (evento, fallback = "Evento cultural disponível.") =>
  {
    const source = getEntitySource(evento);
    return getTextValue(source?.shortDescription || source?.description || source?.resumo) || fallback;
  };

export const getCategoriaMapaCultural = (evento, fallback = "Cultura") => {
  const source = getEntitySource(evento);
  const terms = source?.terms || source?.termos || {};
  const termCandidates = [
    getTermValue(terms, "linguagem"),
    getTermValue(terms, "area"),
    getTermValue(terms, "Área de Atuação"),
    getTermValue(terms, "segmento"),
    getTermValue(terms, "tag"),
  ];

  const directCandidates = [
    source?.categoria,
    source?.category,
    source?.linguagem,
    source?.type?.name,
    source?.type?.label,
    source?.type,
  ];

  const category = [...termCandidates, ...directCandidates]
    .map(getTextValue)
    .find((value) => value && !GENERIC_CATEGORY_VALUES.has(value.toLowerCase()));

  if (category) return category;

  return inferCategoryFromText(
    `${getTituloMapaCultural(evento, "")} ${getDescricaoMapaCultural(evento, "")}`
  ) || fallback;
};

export const getImagemMapaCultural = (evento) =>
  {
    const source = getEntitySource(evento);
    return getTextValue(
      source?.files?.avatar?.url ||
      source?.files?.avatar ||
      source?.files?.header?.url ||
      source?.files?.header ||
      source?.files?.[0]?.url ||
      source?.files?.[0] ||
      source?.imagem ||
      source?.image
    );
  };

// ---------- EVENTOS ----------

/**
 * Busca eventos com filtros avançados
 * @param {Object|number} optionsOrOffset - Opções de filtro ou offset (para compatibilidade)
 * @param {number} optionsOrOffset.offset - Paginação offset
 * @param {number} optionsOrOffset.page - Paginação por página (alternativa ao offset)
 * @param {string} optionsOrOffset.termo - Termo de busca (usa @search)
 * @param {string} optionsOrOffset.categoria - Filtro por categoria/taxonomia (usa term:linguagem)
 * @param {string} optionsOrOffset.dataInicio - Filtro por data inicial (YYYY-MM-DD)
 * @param {string} optionsOrOffset.dataFim - Filtro por data final (YYYY-MM-DD)
 * @param {number} optionsOrOffset.lat - Latitude para filtro geográfico
 * @param {number} optionsOrOffset.lng - Longitude para filtro geográfico
 * @param {number} optionsOrOffset.raio - Raio em metros para filtro geográfico
 * @param {string} optionsOrOffset.files - Configuração de arquivos (ex: 'header.header,avatar.avatarBig')
 * @param {number} optionsOrOffset.projectId - Filtrar por projeto específico
 * @param {string} optionsOrOffset.select - Campos personalizados para @select
 */
export const getEventos = async (optionsOrOffset = {}) => {
  // Compatibilidade retroativa: aceita número (offset) ou objeto (options)
  const options = typeof optionsOrOffset === 'number' 
    ? { offset: optionsOrOffset }
    : optionsOrOffset;

  const {
    offset = 0,
    page = null,
    termo = "",
    categoria = "",
    dataInicio = "",
    dataFim = "",
    lat = null,
    lng = null,
    raio = null,
    files = "",
    projectId = null,
    select = "id,name,shortDescription,location,occurrences,terms,createTimestamp",
  } = options;

  try {
    let url = `${BASE_URL}/event/find?@select=${encodeURIComponent(select)}&@limit=${EVENTOS_LIMIT}&@offset=${offset}&@order=createTimestamp DESC`;

    // Paginação por página (alternativa ao offset)
    if (page !== null) {
      url += `&@page=${page}`;
    }

    // Filtro por termo (busca textual)
    if (termo) {
      url += `&@search=${encodeURIComponent(termo)}`;
    }

    // Filtro por categoria/taxonomia (usando sintaxe oficial)
    if (categoria) {
      url += `&term:linguagem=${encodeURIComponent(`LIKE(${categoria})`)}`;
    }

    // Filtro por projeto (relacionamento)
    if (projectId) {
      url += `&project=${encodeURIComponent(`EQ(@Project:${projectId})`)}`;
    }

    // Filtro por data (usando operadores BET)
    if (dataInicio || dataFim) {
      const dateFilters = [];
      if (dataInicio && dataFim) {
        dateFilters.push(`id:BET(${dataInicio},${dataFim})`);
      } else if (dataInicio) {
        dateFilters.push(`createTimestamp:>=(${dataInicio})`);
      } else if (dataFim) {
        dateFilters.push(`createTimestamp:<=(${dataFim})`);
      }
      if (dateFilters.length > 0) url += `&${dateFilters.join('&')}`;
    }

    // Filtro geográfico (usando sintaxe oficial _geoLocation e GEONEAR)
    if (lat !== null && lng !== null && raio !== null) {
      url += `&_geoLocation=${encodeURIComponent(`GEONEAR(${lng},${lat},${raio})`)}`;
    }

    // Configuração de arquivos (URLs)
    if (files) {
      url += `&@files=${encodeURIComponent(files)}`;
    }

    const json = await safeFetch(url);
    const eventos = normalizeResponse(json);

    if (eventos.length > 0 && !eventos.some(hasUsefulEventFields)) {
      const fallbackUrl = url.replace(
        `@select=${encodeURIComponent(select)}&`,
        ""
      );
      const fallbackJson = await safeFetch(fallbackUrl);
      const fallbackEventos = normalizeResponse(fallbackJson);

      if (fallbackEventos.length > 0 && !fallbackEventos.some(hasUsefulEventFields)) {
        const hidratados = await Promise.all(
          fallbackEventos.map(async (evento) => {
            const id =
              getTextValue(evento?.id || evento?.["@id"]) ||
              (
                evento &&
                typeof evento === "object" &&
                !Array.isArray(evento)
                  ? Object.keys(evento)[0]
                  : ""
              );

            if (!id) return evento;

            const eventoCompleto = await getEventoById(id);
            return eventoCompleto || evento;
          })
        );

        return hidratados.some(hasUsefulEventFields)
          ? hidratados
          : getFallbackEventosMapaVivo();
      }

      return fallbackEventos;
    }

    return eventos.length > 0 ? eventos : getFallbackEventosMapaVivo();

  } catch (error) {
    console.log("Erro ao buscar eventos:", error);
    return getFallbackEventosMapaVivo();
  }
};

/**
 * Busca eventos por ID específico
 */
export const getEventoById = async (id) => {
  try {
    const url = `${BASE_URL}/event/${id}?@select=*`;
    const json = await safeFetch(url);
    return json;
  } catch (error) {
    console.log("Erro ao buscar evento por ID:", error);
    return null;
  }
};

/**
 * Busca eventos futuros (a partir de hoje)
 */
export const getEventosFuturos = async (offset = 0) => {
  const hoje = new Date().toISOString().split('T')[0];
  return getEventos({
    offset,
    dataInicio: hoje,
  });
};

/**
 * Busca eventos de hoje
 */
export const getEventosHoje = async (offset = 0) => {
  const hoje = new Date().toISOString().split('T')[0];
  return getEventos({
    offset,
    dataInicio: hoje,
    dataFim: hoje,
  });
};

// ---------- ESPAÇOS ----------

/**
 * Busca espaços com filtros avançados
 * @param {Object|number} optionsOrOffset - Opções de filtro ou offset (para compatibilidade)
 * @param {number} optionsOrOffset.offset - Paginação offset
 * @param {number} optionsOrOffset.page - Paginação por página (alternativa ao offset)
 * @param {string} optionsOrOffset.termo - Termo de busca
 * @param {number} optionsOrOffset.lat - Latitude para filtro geográfico
 * @param {number} optionsOrOffset.lng - Longitude para filtro geográfico
 * @param {number} optionsOrOffset.raio - Raio em metros para filtro geográfico
 * @param {string} optionsOrOffset.files - Configuração de arquivos (ex: 'avatar.avatarSmall,downloads')
 * @param {number} optionsOrOffset.ownerId - Filtrar por proprietário (agente)
 * @param {string} optionsOrOffset.select - Campos personalizados para @select
 */
export const getEspacos = async (optionsOrOffset = {}) => {
  // Compatibilidade retroativa: aceita número (offset) ou objeto (options)
  const options = typeof optionsOrOffset === 'number' 
    ? { offset: optionsOrOffset }
    : optionsOrOffset;

  const {
    offset = 0,
    page = null,
    termo = "",
    lat = null,
    lng = null,
    raio = null,
    files = "",
    ownerId = null,
    select = "id,name,shortDescription,description,location,files,terms,createTimestamp",
  } = options;

  try {
    let url = `${BASE_URL}/space/find?@select=${encodeURIComponent(select)}&@limit=${ESPACOS_LIMIT}&@offset=${offset}&@order=createTimestamp DESC`;

    // Paginação por página (alternativa ao offset)
    if (page !== null) {
      url += `&@page=${page}`;
    }

    // Filtro por termo
    if (termo) {
      url += `&@search=${encodeURIComponent(termo)}`;
    }

    // Filtro por proprietário (relacionamento)
    if (ownerId) {
      url += `&owner=${encodeURIComponent(`EQ(@Agent:${ownerId})`)}`;
    }

    // Filtro geográfico (usando sintaxe oficial _geoLocation e GEONEAR)
    if (lat !== null && lng !== null && raio !== null) {
      url += `&_geoLocation=${encodeURIComponent(`GEONEAR(${lng},${lat},${raio})`)}`;
    }

    // Configuração de arquivos (URLs)
    if (files) {
      url += `&@files=${encodeURIComponent(files)}`;
    }

    const json = await safeFetch(url);
    return normalizeResponse(json);

  } catch (error) {
    console.log("Erro ao buscar espaços:", error);
    return [];
  }
};

/**
 * Busca espaço por ID específico
 */
export const getEspacoById = async (id) => {
  try {
    const url = `${BASE_URL}/space/${id}?@select=*`;
    const json = await safeFetch(url);
    return json;
  } catch (error) {
    console.log("Erro ao buscar espaço por ID:", error);
    return null;
  }
};

// ---------- AGENTES ----------

/**
 * Busca agentes (organizadores, artistas, etc.) com filtros
 * @param {Object} options - Opções de filtro
 * @param {number} options.offset - Paginação offset
 * @param {number} options.page - Paginação por página (alternativa ao offset)
 * @param {string} options.termo - Termo de busca
 * @param {string} options.email - Filtro por email (usando LIKE)
 * @param {number} options.idMin - ID mínimo (usando BET)
 * @param {number} options.idMax - ID máximo (usando BET)
 * @param {string} options.files - Configuração de arquivos (ex: 'avatar,avatar.avatarSmall')
 * @param {string} options.select - Campos personalizados para @select
 */
export const getAgentes = async (options = {}) => {
  const {
    offset = 0,
    page = null,
    termo = "",
    email = "",
    idMin = null,
    idMax = null,
    files = "",
    select = "id,name,shortDescription,description,files,terms,createTimestamp",
  } = options;

  try {
    let url = `${BASE_URL}/agent/find?@select=${encodeURIComponent(select)}&@limit=${AGENTES_LIMIT}&@offset=${offset}&@order=createTimestamp DESC`;

    // Paginação por página (alternativa ao offset)
    if (page !== null) {
      url += `&@page=${page}`;
    }

    // Filtro por termo
    if (termo) {
      url += `&@search=${encodeURIComponent(termo)}`;
    }

    // Filtro por email (usando operador LIKE)
    if (email) {
      url += `&email=${encodeURIComponent(`LIKE(*${email}*)`)}`;
    }

    // Filtro por intervalo de ID (usando operador BET)
    if (idMin !== null && idMax !== null) {
      url += `&id=${encodeURIComponent(`BET(${idMin},${idMax})`)}`;
    } else if (idMin !== null) {
      url += `&id=${encodeURIComponent(`>=(${idMin})`)}`;
    } else if (idMax !== null) {
      url += `&id=${encodeURIComponent(`<=(${idMax})`)}`;
    }

    // Configuração de arquivos (URLs)
    if (files) {
      url += `&@files=${encodeURIComponent(files)}`;
    }

    const json = await safeFetch(url);
    return normalizeResponse(json);

  } catch (error) {
    console.log("Erro ao buscar agentes:", error);
    return [];
  }
};

/**
 * Busca agente por ID específico
 */
export const getAgenteById = async (id) => {
  try {
    const url = `${BASE_URL}/agent/${id}?@select=*`;
    const json = await safeFetch(url);
    return json;
  } catch (error) {
    console.log("Erro ao buscar agente por ID:", error);
    return null;
  }
};

// ---------- PROJETOS ----------

/**
 * Busca projetos com filtros
 * @param {Object} options - Opções de filtro
 * @param {number} options.offset - Paginação offset
 * @param {number} options.page - Paginação por página (alternativa ao offset)
 * @param {string} options.termo - Termo de busca
 * @param {string} options.files - Configuração de arquivos
 * @param {string} options.select - Campos personalizados para @select
 */
export const getProjetos = async (options = {}) => {
  const {
    offset = 0,
    page = null,
    termo = "",
    files = "",
    select = "id,name,shortDescription,description,files,terms,createTimestamp",
  } = options;

  try {
    let url = `${BASE_URL}/project/find?@select=${encodeURIComponent(select)}&@limit=${AGENTES_LIMIT}&@offset=${offset}&@order=createTimestamp DESC`;

    // Paginação por página (alternativa ao offset)
    if (page !== null) {
      url += `&@page=${page}`;
    }

    // Filtro por termo
    if (termo) {
      url += `&@search=${encodeURIComponent(termo)}`;
    }

    // Configuração de arquivos (URLs)
    if (files) {
      url += `&@files=${encodeURIComponent(files)}`;
    }

    const json = await safeFetch(url);
    return normalizeResponse(json);

  } catch (error) {
    console.log("Erro ao buscar projetos:", error);
    return [];
  }
};

/**
 * Busca projeto por ID específico
 */
export const getProjetoById = async (id) => {
  try {
    const url = `${BASE_URL}/project/${id}?@select=*`;
    const json = await safeFetch(url);
    return json;
  } catch (error) {
    console.log("Erro ao buscar projeto por ID:", error);
    return null;
  }
};

// ---------- PAGINAÇÃO AUTOMÁTICA ----------

/**
 * Busca todos os eventos com paginação automática
 * @param {Object} options - Opções de filtro
 * @param {number} maxResults - Limite máximo de resultados (padrão: 200)
 */
export const getAllEventos = async (options = {}, maxResults = 200) => {
  const allEventos = [];
  let offset = 0;

  try {
    while (allEventos.length < maxResults) {
      const eventos = await getEventos({ ...options, offset });
      
      if (eventos.length === 0) break;
      
      allEventos.push(...eventos);
      offset += eventos.length;

      // Se retornou menos que o limite, chegamos ao fim
      if (eventos.length < EVENTOS_LIMIT) break;
    }

    return allEventos.slice(0, maxResults);
  } catch (error) {
    console.log("Erro ao buscar todos os eventos:", error);
    return allEventos;
  }
};

// ---------- SISTEMA ----------

/**
 * Obtém a versão da instalação do Mapas Culturais
 */
export const getVersao = async () => {
  try {
    const url = `${BASE_URL}/site/version`;
    const json = await safeFetch(url);
    return json;
  } catch (error) {
    console.log("Erro ao obter versão:", error);
    return null;
  }
};

// ---------- UTILITÁRIOS ----------

/**
 * Extrai a próxima ocorrência de um evento
 */
export const getProximaOcorrencia = (evento) => {
  if (!evento?.occurrences || !Array.isArray(evento.occurrences)) {
    return null;
  }

  const agora = new Date();
  const ocorrenciasFuturas = evento.occurrences
    .map(occ => ({
      ...occ,
      dataInicio: new Date(occ.startsAt || occ.timestamp),
    }))
    .filter(occ => occ.dataInicio >= agora)
    .sort((a, b) => a.dataInicio - b.dataInicio);

  return ocorrenciasFuturas[0] || null;
};

/**
 * Verifica se um evento está ocorrendo agora
 */
export const isEventoOcorrendoAgora = (evento) => {
  const proxima = getProximaOcorrencia(evento);
  if (!proxima) return false;

  const agora = new Date();
  const inicio = new Date(proxima.startsAt || proxima.timestamp);
  const fim = new Date(proxima.endsAt || inicio.getTime() + 3 * 60 * 60 * 1000); // 3h padrão

  return agora >= inicio && agora <= fim;
};

/**
 * Formata a data de ocorrência para exibição
 */
export const formatarDataOcorrencia = (ocorrencia) => {
  if (!ocorrencia) return "Data não informada";

  const data = new Date(ocorrencia.startsAt || ocorrencia.timestamp);
  const opcoes = { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return data.toLocaleDateString('pt-BR', opcoes);
};
