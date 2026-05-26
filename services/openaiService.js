/**
 * Serviço de integração com OpenAI para insights culturais avançados
 * Requer configuração de API key em ambiente de produção
 */

// Configuração - em produção, use variáveis de ambiente
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = "gpt-4o-mini"; // Modelo mais econômico para produção
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

/**
 * Gera insights culturais usando OpenAI GPT
 * @param {Array} eventos - Lista de eventos para análise
 * @param {Object} userSignals - Sinais do usuário para personalização
 * @param {string} termoFoco - Termo de foco opcional
 */
export async function gerarInsightsComOpenAI(eventos = [], userSignals = {}, termoFoco = "") {
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API key não configurada, usando fallback");
    return null;
  }

  try {
    // Prepara o contexto do usuário
    const topCategorias = Object.entries(userSignals.categories || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const topLocais = Object.entries(userSignals.places || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([local]) => local);

    const userContext = `
Perfil do usuário:
- Categorias favoritas: ${topCategorias.join(", ") || "Não identificado"}
- Locais frequentados: ${topLocais.join(", ") || "Não identificado"}
- Total de curtidas: ${userSignals.likedSet?.size || 0}
${termoFoco ? `- Foco atual: ${termoFoco}` : ""}
`;

    // Prepara os eventos para análise
    const eventosContexto = eventos.slice(0, 10).map((e, i) => 
      `${i + 1}. ${e.tituloEvento || e.titulo} - ${e.categoria} - ${e.localEvento || e.local}`
    ).join("\n");

    const systemPrompt = `Você é um assistente cultural especializado em recomendar eventos em Fortaleza, Brasil.
Seu objetivo é fornecer recomendações personalizadas e insights culturais relevantes.
Responda em português brasileiro de forma amigável e entusiasmada.
Mantenha as respostas concisas (máximo 2-3 frases).`;

    const userPrompt = `${userContext}

Eventos disponíveis:
${eventosContexto}

Com base no perfil do usuário e os eventos disponíveis, gere uma recomendação personalizada e um insight cultural relevante.
Se houver um termo de foco, priorize eventos relacionados a ele.
Formato de resposta (JSON):
{
  "recomendacao": "Frase de recomendação personalizada",
  "insight": "Insight cultural relevante",
  "eventosRecomendados": [índices dos 3 melhores eventos]
}`;

    const response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    // Mapeia índices para eventos reais
    const eventosRecomendados = (result.eventosRecomendados || [])
      .map(idx => eventos[idx])
      .filter(Boolean);

    return {
      recomendacao: result.recomendacao,
      insight: result.insight,
      eventosRecomendados,
    };
  } catch (error) {
    console.error("Erro ao gerar insights com OpenAI:", error);
    return null;
  }
}

/**
 * Gera descrição personalizada de evento usando OpenAI
 * @param {Object} evento - Evento para descrever
 * @param {Object} userSignals - Sinais do usuário
 */
export async function gerarDescricaoPersonalizada(evento, userSignals = {}) {
  if (!OPENAI_API_KEY) {
    return null;
  }

  try {
    const catScore = userSignals.categories?.[evento.categoria] || 0;
    const placeScore = userSignals.places?.[evento.local] || 0;
    const liked = userSignals.likedSet?.has(evento.id);

    const userContext = `
Relação do usuário com este evento:
- Afinidade com categoria: ${catScore > 0 ? "Alta" : "Baixa"}
- Afinidade com local: ${placeScore > 0 ? "Alta" : "Baixa"}
- Já curtiu: ${liked ? "Sim" : "Não"}
`;

    const systemPrompt = `Você é um assistente cultural especializado.
Gere uma descrição personalizada e atraente para um evento cultural.
Responda em português brasileiro.
Máximo 2 frases.`;

    const userPrompt = `${userContext}

Evento: ${evento.tituloEvento || evento.titulo}
Categoria: ${evento.categoria}
Local: ${evento.localEvento || evento.local}
Descrição original: ${evento.descricao || "Sem descrição"}

Gere uma descrição personalizada que destaque por que este evento seria interessante para este usuário específico.`;

    const response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Erro ao gerar descrição personalizada:", error);
    return null;
  }
}

/**
 * Analisa sentimento de avaliações de eventos
 * @param {Array} avaliacoes - Lista de avaliações para analisar
 */
export async function analisarSentimentoAvaliacoes(avaliacoes = []) {
  if (!OPENAI_API_KEY || !avaliacoes.length) {
    return null;
  }

  try {
    const avaliacoesTexto = avaliacoes
      .slice(0, 10)
      .map((a, i) => `${i + 1}. "${a.comentario || a.texto || ""}"`)
      .join("\n");

    const systemPrompt = `Você é um analista de sentimento especializado em avaliações culturais.
Analise o sentimento geral das avaliações e identifique pontos positivos e negativos.
Responda em português brasileiro em formato JSON.`;

    const userPrompt = `Analise as seguintes avaliações de eventos culturais:

${avaliacoesTexto}

Formato de resposta (JSON):
{
  "sentimentoGeral": "positivo|neutro|negativo",
  "pontosPositivos": ["ponto 1", "ponto 2"],
  "pontosNegativos": ["ponto 1", "ponto 2"],
  "resumo": "Resumo em uma frase"
}`;

    const response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 250,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Erro ao analisar sentimento:", error);
    return null;
  }
}
