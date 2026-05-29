/**
 * EXEMPLOS E DADOS DE TESTE PARA A COMUNIDADE
 * Use este arquivo para popular o Firebase Firestore com dados de teste
 */

// ============================================================
// EXEMPLO: CRIAR GRUPOS DE COMUNIDADE
// ============================================================
export const EXAMPLE_GROUPS = [
  {
    name: "Música Brasileira",
    genre: "Música",
    description: "Espaço dedicado a discussões, dicas e compartilhamento sobre música brasileira",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop",
    membersCount: 1250,
  },
  {
    name: "Dança Contemporânea",
    genre: "Dança",
    description: "Comunidade de dançarinos e entusiastas de dança contemporânea",
    image: "https://images.unsplash.com/photo-1508700115892-9b3c1b9c9c7a?w=400&h=200&fit=crop",
    membersCount: 890,
  },
  {
    name: "Teatro Independente",
    genre: "Teatro",
    description: "Grupos de teatro independente compartilhando experiências e oportunidades",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop",
    membersCount: 620,
  },
  {
    name: "Cinema e Audiovisual",
    genre: "Cinema",
    description: "Discussões sobre filmes, produção audiovisual e crítica cinematográfica",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=200&fit=crop",
    membersCount: 1500,
  },
  {
    name: "Literatura Brasileira",
    genre: "Literatura",
    description: "Club do livro e discussões sobre autores brasileiros",
    image: "https://images.unsplash.com/photo-150784272343-583f20270319?w=400&h=200&fit=crop",
    membersCount: 780,
  },
  {
    name: "Artes Visuais",
    genre: "Artes Visuais",
    description: "Compartilhamento de obras de arte, técnicas e inspiração",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop",
    membersCount: 950,
  },
  {
    name: "Culinária Criativa",
    genre: "Gastronomia",
    description: "Receitas, técnicas culinárias e discussões sobre gastronomia artística",
    image: "https://images.unsplash.com/photo-1495195134817-aeb325ef3d61?w=400&h=200&fit=crop",
    membersCount: 1100,
  },
];

// ============================================================
// EXEMPLO: CRIAR CRIADORES EM DESTAQUE
// ============================================================
export const EXAMPLE_CREATORS = [
  {
    name: "Marina Silva",
    genre: "Música",
    description: "Compositora e produtora de músicas independentes. Especializada em eletrônico e indie pop.",
    profileImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
    viewsCount: 5230,
    followersCount: 2340,
  },
  {
    name: "Lucas Oliveira",
    genre: "Dança",
    description: "Coreógrafo e dançarino profissional com 15 anos de experiência em dança contemporânea.",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    viewsCount: 4120,
    followersCount: 1890,
  },
  {
    name: "Carla Mendes",
    genre: "Teatro",
    description: "Atriz e diretora de teatro experimental, pioneira em produções independentes.",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    viewsCount: 3890,
    followersCount: 1650,
  },
  {
    name: "Roberto Costa",
    genre: "Cinema",
    description: "Diretor de fotografia e cineasta independente com 8 filmes produzidos.",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    viewsCount: 6150,
    followersCount: 3120,
  },
  {
    name: "Ananda Santos",
    genre: "Artes Visuais",
    description: "Artista plástica e muralista. Suas obras exploram identidade cultural e meio ambiente.",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    viewsCount: 4560,
    followersCount: 2100,
  },
];

// ============================================================
// EXEMPLO: CRIAR TÓPICOS DE FÓRUM
// ============================================================
export const EXAMPLE_FORUM_THREADS = [
  {
    title: "Qual é a melhor forma de iniciar uma carreira em música?",
    description: "Estou pensando em começar a fazer música profissionalmente mas tenho muitas dúvidas. Qual é o caminho mais viável? Devo estudar em conservatório ou posso aprender sozinho?",
    authorName: "João Pedro",
    repliesCount: 23,
    likesCount: 45,
  },
  {
    title: "Dicas de produção de áudio caseira",
    description: "Compartilhando algumas dicas que aprendi sobre como montar um estúdio caseiro com orçamento limitado. Espero que ajude quem está começando!",
    authorName: "Fernanda Costa",
    repliesCount: 15,
    likesCount: 67,
  },
  {
    title: "Discussão: Inteligência Artificial na criação musical",
    description: "O que vocês acham sobre o uso de IA para gerar música? É uma ferramenta ou uma ameaça para artistas?",
    authorName: "Marc Thompson",
    repliesCount: 42,
    likesCount: 89,
  },
  {
    title: "Recomendações de equipamento de áudio",
    description: "Alguém pode recomendar microfones bons para começar? Meu orçamento é de até R$500.",
    authorName: "Alice Souza",
    repliesCount: 8,
    likesCount: 34,
  },
  {
    title: "Encontro de produtores musicais - São Paulo",
    description: "Estou organizando um encontro de produtores musicais em São Paulo no próximo mês. Interessados?",
    authorName: "Rafael Silva",
    repliesCount: 12,
    likesCount: 28,
  },
];

// ============================================================
// EXEMPLO: CRIAR RESPOSTAS DE FÓRUM
// ============================================================
export const EXAMPLE_FORUM_REPLIES = [
  {
    content: "Ótima pergunta! Eu comecei estudando sozinho e depois fiz cursos online. O importante é praticar constantemente e buscar feedback.",
    authorName: "Marina Silva",
  },
  {
    content: "Recomendo combinar: aprenda os fundamentos em cursos e aplique na prática criando suas próprias músicas. Assim você evolui rápido!",
    authorName: "Lucas Oliveira",
  },
  {
    content: "Concordo com os colegas! Hoje em dia tem vários recursos online gratuitos. A dedicação é mais importante que onde você aprende.",
    authorName: "Carla Mendes",
  },
  {
    content: "Muito bom ter essas dicas! Vou começar a implementar algumas aqui. Obrigado!",
    authorName: "João Pedro",
  },
  {
    content: "Para quem está começando, recomendo também assistir tutoriais no YouTube. Tem muita qualidade lá!",
    authorName: "Roberto Costa",
  },
];

// ============================================================
// EXEMPLO: CRIAR NOTÍCIAS DE COMUNIDADE
// ============================================================
export const EXAMPLE_NEWS = [
  {
    title: "Festival de Música Independente acontece este fim de semana",
    excerpt: "Uma das maiores reuniões de artistas independentes do país está de volta com edição especial...",
    content: `O Festival de Música Independente retorna com força total para sua 15ª edição. O evento, que reúne os principais artistas emergentes do Brasil, acontecerá nos dias 24 e 25 de maio.

Com mais de 50 artistas confirmados, o festival promete ser uma celebração da criatividade musical brasileira. Entre os destaques estão bandas de diversos gêneros, desde indie rock até trap nacional.

A programação inclui também workshops com produtores renomados, rodas de conversa sobre a indústria musical e oportunidades de networking entre artistas.

Ingressos disponíveis no site oficial do evento.`,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=300&fit=crop",
    authorName: "Redação MonitoraCult",
    viewsCount: 1250,
    likesCount: 342,
  },
  {
    title: "Artista brasileira ganha reconhecimento internacional",
    excerpt: "Obra de Marina Silva é selecionada para exposição em Berlim...",
    content: `A artista plástica Marina Silva teve sua obra selecionada para participar da renomada Berlinale Gallery, em Berlim, Alemanha.

A seleção acontece após meses de avaliação por um júri internacional de especialistas em arte contemporânea. A obra, intitulada "Raízes", explora temas relacionados à identidade cultural brasileira.

Marina compartilha: "Estar em uma galeria de renome internacional representa uma grande oportunidade para ampliar o alcance da minha mensagem artística. Estou muito honrada com essa seleção."

A exposição acontecerá de junho a setembro de 2026.`,
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=300&fit=crop",
    authorName: "Redação MonitoraCult",
    viewsCount: 890,
    likesCount: 267,
  },
  {
    title: "Novo estúdio de dança abre em Santo Amaro",
    excerpt: "Espaço dedicado ao ensino de dança contemporânea inaugura com programação especial...",
    content: `O estúdio "Movimento Contemporâneo" foi inaugurado na região de Santo Amaro, São Paulo. O espaço oferece aulas de dança contemporânea, ballet e outras modalidades.

Com instrutores renomados e infraestrutura moderna, o estúdio busca democratizar o acesso ao ensino de dança de qualidade.

A inauguração contou com apresentação de ex-alunos e uma masterclass com o coreógrafo Lucas Oliveira. O estúdio já recebeu mais de 200 inscrições para o semestre que começa em junho.`,
    image: "https://images.unsplash.com/photo-1508700115892-9b3c1b9c9c7a?w=500&h=300&fit=crop",
    authorName: "Redação MonitoraCult",
    viewsCount: 654,
    likesCount: 189,
  },
  {
    title: "Programa de mentorias conecta criadores experientes com iniciantes",
    excerpt: "Iniciativa oferece orientação profissional gratuita para artistas em desenvolvimento...",
    content: `A comunidade MonitoraCult lança um programa de mentorias onde criadores experientes orientam artistas em desenvolvimento.

O programa é gratuito e oferece sessões individuais de orientação em diversas áreas: música, dança, teatro, artes visuais e gastronomia.

As inscrições estão abertas para mentores e mentorandos. Interessados podem se registrar através do portal da comunidade. O programa tem duração de 3 meses.`,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop",
    authorName: "Redação MonitoraCult",
    viewsCount: 1120,
    likesCount: 445,
  },
  {
    title: "Documentário sobre cinema independente brasileiro estreia em festival",
    excerpt: "Produção acompanha histórias de cineastas que fazem diferença na indústria...",
    content: `O documentário "Câmera Livre: Vidas em Movimento" estreou no Festival de Cinema de Brasília com excelente recepção.

O filme acompanha as jornadas de cinco cineastas independentes brasileiros que lutam para manter suas produções vivas. Roberto Costa é um dos entrevistados.

A produção já conquistou duas prêmios no festival e segue para seleção em outros eventos cinematográficos internacionais.`,
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&h=300&fit=crop",
    authorName: "Redação MonitoraCult",
    viewsCount: 945,
    likesCount: 321,
  },
];

// ============================================================
// CÓDIGO PARA POPULAR O FIREBASE FIRESTORE
// ============================================================
/**
 * Use este código em um arquivo de setup/admin para popular o banco:
 
import { createCommunityGroup, createHighlightedCreator, createCommunityNews } from '../services/communityService';

// Criar grupos
for (const group of EXAMPLE_GROUPS) {
  await createCommunityGroup(group);
}

// Criar criadores em destaque
for (const creator of EXAMPLE_CREATORS) {
  await createHighlightedCreator(creator);
}

// Criar notícias (você precisará do groupId)
// for (const news of EXAMPLE_NEWS) {
//   await createCommunityNews(groupId, news);
// }

 */

// ============================================================
// ESTRUTURA DE DADOS ESPERADA
// ============================================================
/**
 * GRUPOS (communityGroups collection):
 * {
 *   id: string (auto-gerado)
 *   name: string
 *   genre: string
 *   description: string
 *   image: string (URL)
 *   members: array<string> (UIDs dos membros)
 *   membersCount: number
 *   createdAt: timestamp
 *   updatedAt: timestamp
 * }
 *
 * TÓPICOS DE FÓRUM (communityGroups/{groupId}/forum):
 * {
 *   id: string (auto-gerado)
 *   title: string
 *   description: string
 *   authorId: string
 *   repliesCount: number
 *   likesCount: number
 *   createdAt: timestamp
 *   updatedAt: timestamp
 * }
 *
 * RESPOSTAS DE FÓRUM (communityGroups/{groupId}/forum/{threadId}/replies):
 * {
 *   id: string (auto-gerado)
 *   content: string
 *   authorId: string
 *   createdAt: timestamp
 * }
 *
 * CRIADORES EM DESTAQUE (highlightedCreators collection):
 * {
 *   id: string (auto-gerado)
 *   name: string
 *   genre: string
 *   description: string
 *   profileImage: string (URL)
 *   viewsCount: number
 *   followersCount: number
 *   createdAt: timestamp
 * }
 *
 * NOTÍCIAS (communityGroups/{groupId}/news):
 * {
 *   id: string (auto-gerado)
 *   title: string
 *   excerpt: string
 *   content: string
 *   image: string (URL)
 *   authorId: string
 *   viewsCount: number
 *   likesCount: number
 *   createdAt: timestamp
 * }
 */
