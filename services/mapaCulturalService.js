const BASE_URL =
  "https://mapacultural.secult.ce.gov.br/api";

// Limites de segurança
const EVENTOS_LIMIT = 50;
const ESPACOS_LIMIT = 50;

const TIMEOUT = 10000;

// ---------- FETCH SEGURO ----------

const safeFetch = async (url) => {

  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () => controller.abort(),
      TIMEOUT
    );

  try {

    const response =
      await fetch(url, {
        signal:
          controller.signal,
      });

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }

    return await response.json();

  } finally {

    clearTimeout(
      timeoutId
    );

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

export const getEventos =
async (offset = 0) => {

  try {

    const url =

`${BASE_URL}/event/find
?@select=id,name,shortDescription,location,occurrences,files
&@limit=${EVENTOS_LIMIT}
&@offset=${offset}
&@order=createTimestamp DESC`

      .replace(/\n/g, "");

    const json =
      await safeFetch(
        url
      );

    return normalizeResponse(
      json
    );

  } catch (error) {

    console.log(
      "Erro ao buscar eventos:",
      error
    );

    return [];
  }
};

// ---------- ESPAÇOS ----------

export const getEspacos =
async (offset = 0) => {

  try {

    const url =

`${BASE_URL}/space/find
?@select=id,name,location,files
&@limit=${ESPACOS_LIMIT}
&@offset=${offset}
&@order=createTimestamp DESC`

      .replace(/\n/g, "");

    const json =
      await safeFetch(
        url
      );

    return normalizeResponse(
      json
    );

  } catch (error) {

    console.log(
      "Erro ao buscar espaços:",
      error
    );

    return [];
  }
};