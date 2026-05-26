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

// ---------- EVENTOS ----------

/**
 * Busca eventos com filtros avançados
 * @param {Object|number} optionsOrOffset - Opções de filtro ou offset (para compatibilidade)
 * @param {number} optionsOrOffset.offset - Paginação offset
 * @param {string} optionsOrOffset.termo - Termo de busca
 * @param {string} optionsOrOffset.categoria - Filtro por categoria
 * @param {string} optionsOrOffset.dataInicio - Filtro por data inicial (YYYY-MM-DD)
 * @param {string} optionsOrOffset.dataFim - Filtro por data final (YYYY-MM-DD)
 * @param {number} optionsOrOffset.lat - Latitude para filtro geográfico
 * @param {number} optionsOrOffset.lng - Longitude para filtro geográfico
 * @param {number} optionsOrOffset.raio - Raio em km para filtro geográfico
 */
export const getEventos = async (optionsOrOffset = {}) => {
  // Compatibilidade retroativa: aceita número (offset) ou objeto (options)
  const options = typeof optionsOrOffset === 'number' 
    ? { offset: optionsOrOffset }
    : optionsOrOffset;

  const {
    offset = 0,
    termo = "",
    categoria = "",
    dataInicio = "",
    dataFim = "",
    lat = null,
    lng = null,
    raio = null,
  } = options;

  try {
    let url = `${BASE_URL}/event/find?@select=id,name,shortDescription,description,location,occurrences,files,terms,subsiteIds,project,createTimestamp&@limit=${EVENTOS_LIMIT}&@offset=${offset}&@order=createTimestamp DESC`;

    // Filtro por termo
    if (termo) {
      url += `&@search=${encodeURIComponent(termo)}`;
    }

    // Filtro por categoria (term)
    if (categoria) {
      url += `&term=${encodeURIComponent(categoria)}`;
    }

    // Filtro por data
    if (dataInicio || dataFim) {
      const dateFilter = [];
      if (dataInicio) dateFilter(`@timestamp(createTimestamp):>=(${dataInicio})`);
      if (dataFim) dateFilter(`@timestamp(createTimestamp):<=(${dataFim})`);
      if (dateFilter.length > 0) url += `&${dateFilter.join('&')}`;
    }

    // Filtro geográfico (GeoJSON)
    if (lat !== null && lng !== null && raio !== null) {
      const geoJson = `{"type":"Point","coordinates":[${lng},${lat}]}`;
      url += `&@geoLocation=${encodeURIComponent(geoJson)}&@dwithin=${raio}`;
    }

    url = url.replace(/\n/g, "").replace(/\s+/g, "");

    const json = await safeFetch(url);
    return normalizeResponse(json);

  } catch (error) {
    console.log("Erro ao buscar eventos:", error);
    return [];
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
 * @param {string} optionsOrOffset.termo - Termo de busca
 * @param {number} optionsOrOffset.lat - Latitude para filtro geográfico
 * @param {number} optionsOrOffset.lng - Longitude para filtro geográfico
 * @param {number} optionsOrOffset.raio - Raio em km para filtro geográfico
 */
export const getEspacos = async (optionsOrOffset = {}) => {
  // Compatibilidade retroativa: aceita número (offset) ou objeto (options)
  const options = typeof optionsOrOffset === 'number' 
    ? { offset: optionsOrOffset }
    : optionsOrOffset;

  const {
    offset = 0,
    termo = "",
    lat = null,
    lng = null,
    raio = null,
  } = options;

  try {
    let url = `${BASE_URL}/space/find?@select=id,name,shortDescription,description,location,files,terms,createTimestamp&@limit=${ESPACOS_LIMIT}&@offset=${offset}&@order=createTimestamp DESC`;

    // Filtro por termo
    if (termo) {
      url += `&@search=${encodeURIComponent(termo)}`;
    }

    // Filtro geográfico (GeoJSON)
    if (lat !== null && lng !== null && raio !== null) {
      const geoJson = `{"type":"Point","coordinates":[${lng},${lat}]}`;
      url += `&@geoLocation=${encodeURIComponent(geoJson)}&@dwithin=${raio}`;
    }

    url = url.replace(/\n/g, "").replace(/\s+/g, "");

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
 * @param {string} options.termo - Termo de busca
 */
export const getAgentes = async (options = {}) => {
  const {
    offset = 0,
    termo = "",
  } = options;

  try {
    let url = `${BASE_URL}/agent/find?@select=id,name,shortDescription,description,files,terms,createTimestamp&@limit=${AGENTES_LIMIT}&@offset=${offset}&@order=createTimestamp DESC`;

    // Filtro por termo
    if (termo) {
      url += `&@search=${encodeURIComponent(termo)}`;
    }

    url = url.replace(/\n/g, "").replace(/\s+/g, "");

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
 * @param {string} options.termo - Termo de busca
 */
export const getProjetos = async (options = {}) => {
  const {
    offset = 0,
    termo = "",
  } = options;

  try {
    let url = `${BASE_URL}/project/find?@select=id,name,shortDescription,description,files,terms,createTimestamp&@limit=${AGENTES_LIMIT}&@offset=${offset}&@order=createTimestamp DESC`;

    // Filtro por termo
    if (termo) {
      url += `&@search=${encodeURIComponent(termo)}`;
    }

    url = url.replace(/\n/g, "").replace(/\s+/g, "");

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