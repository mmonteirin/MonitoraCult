import {
  getCategoriaMapaCultural,
  getDescricaoMapaCultural,
  getEventos,
  getTituloMapaCultural,
} from "./mapaCulturalService";
import { gerarInsightsComOpenAI } from "./openaiService";

/**
 * Constrói uma justificativa de recomendação inteligente e contextual em português.
 * @param {Object} evento
 * @param {string} termoFoco
 * @param {number} horaAtual
 * @param {Object} userSignals - Sinais do usuário para personalização
 */
function obterMotivoIA(evento, termoFoco, horaAtual, userSignals = {}) {
  const titulo = (evento.tituloEvento || evento.titulo || "").toLowerCase();
  const categoria = (evento.categoria || "").toLowerCase();
  const local = (evento.localEvento || evento.nomeLocal || evento.local || "").toLowerCase();
  const desc = (evento.descricao || "").toLowerCase();
  const textoAnalise = `${titulo} ${categoria} ${local} ${desc}`;

  // Prioridade: sinais do usuário > termo foco > contexto temporal
  const catScore = userSignals.categories?.[categoria] || 0;
  const placeScore = userSignals.places?.[local] || 0;

  // Personalização baseada em sinais do usuário
  if (catScore >= 10) {
    return `✨ Perfeito para você! Você adora ${categoria} e este evento é uma ótima escolha.`;
  }
  if (placeScore >= 8) {
    return `📍 Você frequenta ${local} frequentemente - este evento combina com seu estilo!`;
  }
  if (userSignals.likedSet?.has(evento.id)) {
    return `❤️ Você já demonstrou interesse neste evento - não perca!`;
  }

  // Foco selecionado pelo usuário
  if (termoFoco) {
    const focoLower = termoFoco.toLowerCase();
    if (focoLower === "orla" || textoAnalise.includes("praia") || textoAnalise.includes("orla") || textoAnalise.includes("beira")) {
      return "🏖️ Perfeito para desfrutar da brisa e do visual incrível da orla de Fortaleza.";
    }
    if (focoLower === "gratuito" || evento.gratuito || evento.tipoEvento === "gratuito" || textoAnalise.includes("gratis") || textoAnalise.includes("gratuito")) {
      return "🎟️ Uma oportunidade cultural incrível com entrada totalmente gratuita!";
    }
    if (focoLower === "show" || textoAnalise.includes("musica") || textoAnalise.includes("show") || textoAnalise.includes("banda") || textoAnalise.includes("concerto")) {
      return "🎸 Recomendado para quem busca a energia vibrante de música ao vivo na cidade.";
    }
    if (focoLower === "teatro" || textoAnalise.includes("teatro") || textoAnalise.includes("drama") || textoAnalise.includes("peça") || textoAnalise.includes("espetáculo")) {
      return "🎭 Uma excelente produção cênica para enriquecer seu repertório artístico.";
    }
  }

  // Fallbacks contextuais baseados no horário
  if (horaAtual >= 18) {
    if (textoAnalise.includes("noite") || textoAnalise.includes("show") || textoAnalise.includes("bar")) {
      return "🌙 Selecionado especialmente como uma das melhores opções para curtir sua noite.";
    }
    return "✨ Perfeito para relaxar e aproveitar a vibe cultural noturna de Fortaleza.";
  } else if (horaAtual >= 12 && horaAtual < 18) {
    if (textoAnalise.includes("tarde") || textoAnalise.includes("parque") || textoAnalise.includes("praia")) {
      return "☀️ Ótima opção para aproveitar a energia e o movimento cultural da tarde.";
    }
    return "🎨 Excelente alternativa de lazer e cultura para o seu período vespertino.";
  } else {
    return "☕ Perfeito para iniciar o seu dia respirando arte e explorando Fortaleza.";
  }
}

/**
 * Calcula score de match personalizado baseado em sinais do usuário
 * @param {Object} evento
 * @param {Object} userSignals
 * @param {string} termoFoco
 */
function calcularMatchPersonalizado(evento, userSignals, termoFoco) {
  const categoria = evento.categoria || "";
  const local = evento.localEvento || evento.nomeLocal || evento.local || "";
  const textoAnalise = `${evento.tituloEvento || evento.titulo || ""} ${evento.descricao || ""} ${local} ${categoria}`.toLowerCase();

  let matchScore = 50; // Base score

  // Boost por sinais do usuário
  const catScore = userSignals.categories?.[categoria] || 0;
  const placeScore = userSignals.places?.[local] || 0;

  matchScore += catScore * 2; // Até 20 pontos por categoria
  matchScore += placeScore * 1.5; // Até 15 pontos por local

  // Boost por termo foco
  if (termoFoco && textoAnalise.includes(termoFoco.toLowerCase())) {
    matchScore += 25;
  }

  // Boost por evento já curtido
  if (userSignals.likedSet?.has(evento.id)) {
    matchScore += 15;
  }

  // Boost por trending/destaque
  if (evento.trending) matchScore += 10;
  if (evento.destaque) matchScore += 8;

  // Normaliza para 0-100
  return Math.min(99, Math.max(60, matchScore));
}

/**
 * Filtra e ranqueia eventos simulando uma recomendação inteligente de IA
 * @param {string} termoFoco - O termo vindo do chip selecionado (ex: 'orla', 'gratuito')
 * @param {Array} eventosAtuais - Lista de eventos que o componente já possui carregados
 * @param {Object} userSignals - Sinais do usuário para personalização
 */
export async function gerarInsightsCulturais(termoFoco, eventosAtuais = [], userSignals = {}) {
  try {
    let baseEventos = [...eventosAtuais];

    // 1. Se não houver eventos carregados na tela, busca direto do serviço principal
    if (baseEventos.length === 0) {
      const response = await getEventos();
      const lista = Array.isArray(response) ? response : response?.data || response?.results || [];

      baseEventos = lista.map((item, index) => ({
        id: item.id || `ai-${index}`,
        titulo: getTituloMapaCultural(item),
        descricao: getDescricaoMapaCultural(item, ""),
        local: item.location?.name || "Local não informado",
        categoria: getCategoriaMapaCultural(item, "Recomendado para Você"),
        gratuito: true,
        score: 50,
        original: item
      }));
    }

    // 2. Tenta usar OpenAI para insights mais sofisticados (se disponível)
    const openaiInsights = await gerarInsightsComOpenAI(baseEventos, userSignals, termoFoco);

    if (openaiInsights) {
      // Usa os eventos recomendados pelo OpenAI
      const eventosRecomendados = openaiInsights.eventosRecomendados || baseEventos.slice(0, 6);
      
      return eventosRecomendados.map((evento, index) => ({
        ...evento,
        matchPercent: calcularMatchPersonalizado(evento, userSignals, termoFoco),
        aiReason: openaiInsights.recomendacao || obterMotivoIA(evento, termoFoco, new Date().getHours(), userSignals),
        openaiGenerated: true,
      }));
    }

    // 3. Fallback para lógica existente se OpenAI não estiver disponível
    const horaAtual = new Date().getHours();
    const roteiroProcessado = baseEventos.map((evento, index) => {
      let scoreAdicional = 0;
      const titulo = evento.tituloEvento || evento.titulo || evento.name || "";
      const descricao = evento.descricao || evento.shortDescription || "";
      const local = evento.localEvento || evento.nomeLocal || evento.local || "";
      const textoAnalise = `${titulo} ${descricao} ${local} ${evento.categoria || ""}`.toLowerCase();

      if (termoFoco) {
        // Se o usuário selecionou uma tag específica, dá um boost enorme nos scores compatíveis
        if (textoAnalise.includes(termoFoco.toLowerCase())) {
          scoreAdicional += 50;
        }
      }

      // Boost com base no período do dia (ex: eventos noturnos ganham prioridade à noite)
      if (horaAtual >= 18) {
        if (textoAnalise.includes("noite") || textoAnalise.includes("show") || textoAnalise.includes("bar") || textoAnalise.includes("musica")) {
          scoreAdicional += 20;
        }
      } else if (horaAtual >= 12 && horaAtual < 18) {
        if (textoAnalise.includes("tarde") || textoAnalise.includes("praia") || textoAnalise.includes("parque")) {
          scoreAdicional += 20;
        }
      }

      // Cálculo de matchPercent personalizado com sinais do usuário
      const matchPercent = calcularMatchPersonalizado(evento, userSignals, termoFoco);

      const aiReason = obterMotivoIA(evento, termoFoco, horaAtual, userSignals);

      return {
        ...evento,
        score: (evento.score || 50) + scoreAdicional,
        matchPercent,
        aiReason,
        openaiGenerated: false,
      };
    });

    // 4. Ordena pelos maiores scores e retorna os 6 melhores resultados montados como roteiro exclusivo
    return roteiroProcessado
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

  } catch (error) {
    console.error("Erro no processamento do motor de IA:", error);
    throw error;
  }
}

/**
 * Gera insights de tendências culturais baseados em dados agregados
 * @param {Array} eventos - Lista de eventos para análise
 */
export function analisarTendenciasCulturais(eventos = []) {
  if (!eventos.length) return [];

  const categorias = {};
  const locais = {};
  const horarios = { manha: 0, tarde: 0, noite: 0 };

  eventos.forEach(evento => {
    const cat = evento.categoria || "Outros";
    const local = evento.localEvento || evento.nomeLocal || evento.local || "Outros";

    categorias[cat] = (categorias[cat] || 0) + 1;
    locais[local] = (locais[local] || 0) + 1;

    if (evento.dataInicio) {
      const hora = new Date(evento.dataInicio).getHours();
      if (hora >= 6 && hora < 12) horarios.manha++;
      else if (hora >= 12 && hora < 18) horarios.tarde++;
      else horarios.noite++;
    }
  });

  const topCategorias = Object.entries(categorias)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, count]) => ({ categoria: cat, count, percentual: Math.round((count / eventos.length) * 100) }));

  const topLocais = Object.entries(locais)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([local, count]) => ({ local, count, percentual: Math.round((count / eventos.length) * 100) }));

  const picoHorario = Object.entries(horarios)
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    topCategorias,
    topLocais,
    picoHorario,
    totalEventos: eventos.length
  };
}
