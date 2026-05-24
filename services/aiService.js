import { getEventos } from "./mapaCulturalService";
// Se você tiver uma função para pegar eventos do firestore, pode importar aqui
// import { getEventosFirestore } from "./firestoreService";

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

    // 2. Lógica de Filtragem e Atribuição de Score Inteligente baseado no Prompt
    const roteiroProcessado = baseEventos.map(evento => {
      let scoreAdicional = 0;
      const textoAnalise = `${evento.titulo} ${evento.descricao} ${evento.local}`.toLowerCase();

      if (termoFoco) {
        // Se o usuário selecionou uma tag específica, dá um boost enorme nos scores compatíveis
        if (textoAnalise.includes(termoFoco.toLowerCase())) {
          scoreAdicional += 50;
        }
      }

      // Boost com base no período do dia (ex: eventos noturnos ganham prioridade à noite)
      const horaAtual = new Date().getHours();
      if (horaAtual >= 18) {
        if (textoAnalise.includes("noite") || textoAnalise.includes("show") || textoAnalise.includes("bar")) {
          scoreAdicional += 15;
        }
      } else if (horaAtual >= 12 && horaAtual < 18) {
        if (textoAnalise.includes("tarde") || textoAnalise.includes("praia") || textoAnalise.includes("parque")) {
          scoreAdicional += 15;
        }
      }

      return {
        ...evento,
        score: (evento.score || 50) + scoreAdicional
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