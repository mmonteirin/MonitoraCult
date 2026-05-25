import { getEventos } from "./mapaCulturalService";

/**
 * Constrói uma justificativa de recomendação inteligente e contextual em português.
 * @param {Object} evento 
 * @param {string} termoFoco 
 * @param {number} horaAtual 
 */
function obterMotivoIA(evento, termoFoco, horaAtual) {
  const titulo = (evento.tituloEvento || evento.titulo || "").toLowerCase();
  const categoria = (evento.categoria || "").toLowerCase();
  const local = (evento.localEvento || evento.nomeLocal || evento.local || "").toLowerCase();
  const desc = (evento.descricao || "").toLowerCase();
  const textoAnalise = `${titulo} ${categoria} ${local} ${desc}`;

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
 * Filtra e ranqueia eventos simulando uma recomendação inteligente de IA
 * @param {string} termoFoco - O termo vindo do chip selecionado (ex: 'orla', 'gratuito')
 * @param {Array} eventosAtuais - Lista de eventos que o componente já possui carregados
 */
export async function gerarInsightsCulturais(termoFoco, eventosAtuais = []) {
  try {
    let baseEventos = [...eventosAtuais];

    // 1. Se não houver eventos carregados na tela, busca direto do serviço principal
    if (baseEventos.length === 0) {
      const response = await getEventos();
      const lista = Array.isArray(response) ? response : response?.data || response?.results || [];
      
      baseEventos = lista.map((item, index) => ({
        id: item.id || `ai-${index}`,
        titulo: item.name || "Evento Cultural",
        descricao: item.shortDescription || item.description || "",
        local: item.location?.name || "Local não informado",
        categoria: "Recomendado para Você",
        gratuito: true, 
        score: 50,
        original: item
      }));
    }

    // 2. Lógica de Filtragem e Atribuição de Score Inteligente baseado no Foco e Horário
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

      // Cálculo realista e dinâmico de matchPercent (entre 76% e 99%)
      const baseMatch = 76 + (index % 12); // Padrão dinâmico pseudo-aleatório baseado no índice do card
      const boostMatch = termoFoco && textoAnalise.includes(termoFoco.toLowerCase()) ? 10 : 0;
      const matchPercent = Math.min(99, baseMatch + boostMatch + Math.floor(scoreAdicional * 0.15));

      const aiReason = obterMotivoIA(evento, termoFoco, horaAtual);

      return {
        ...evento,
        score: (evento.score || 50) + scoreAdicional,
        matchPercent,
        aiReason
      };
    });

    // 3. Ordena pelos maiores scores e retorna os 6 melhores resultados montados como roteiro exclusivo
    return roteiroProcessado
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

  } catch (error) {
    console.error("Erro no processamento do motor de IA:", error);
    throw error;
  }
}