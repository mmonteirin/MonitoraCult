# 📖 Guia de Uso - Novos Componentes de Comunidade

## CommunityCategorySection

### Uso Básico
```jsx
import CommunityCategorySection from "../components/CommunityCategorySection";

<CommunityCategorySection
  category="Shows"
  icon="music-note-outline"
  description="5 comunidades"
  groups={[
    {
      id: "1",
      name: "Festival de Shows",
      description: "Comunidade de shows independentes",
      membersCount: 234
    }
  ]}
  onGroupPress={(group) => console.log("Selecionado:", group)}
  checkIsMember={(group) => true}
/>
```

### Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `category` | string | Nome da categoria (ex: "Shows", "Teatro") |
| `icon` | string | Nome do ícone Material Community |
| `description` | string | Descrição exibida no header |
| `groups` | array | Array de grupos da categoria |
| `onGroupPress` | function | Callback ao selecionar um grupo |
| `onSeeAll` | function | Callback do botão "Ver Tudo" |
| `checkIsMember` | function | Função para verificar se é membro |

### Estilo
```javascript
// Tamanho padrão
marginBottom: 24,
marginHorizontal: 16,
borderRadius: 16,

// Cores customizáveis por categoria
categoryIcon: {
  width: 48,
  height: 48,
  borderRadius: 12
}
```

---

## CommunityCategoryFilter

### Uso Básico
```jsx
import CommunityCategoryFilter from "../components/CommunityCategoryFilter";

const [selected, setSelected] = useState([]);

<CommunityCategoryFilter
  selectedCategories={selected}
  onCategoryToggle={setSelected}
  allowMultiple={true}
/>
```

### Props

| Prop | Tipo | Descrição | Padrão |
|------|------|-----------|--------|
| `selectedCategories` | array | Categorias selecionadas | [] |
| `onCategoryToggle` | function | Callback ao mudar seleção | - |
| `allowMultiple` | boolean | Permite múltipla seleção | true |

### Categorias Pré-definidas
```javascript
CATEGORY_FILTERS = [
  {
    key: "shows",
    label: "Shows",
    icon: "music-note-outline",
    color: "#FF6B6B"
  },
  {
    key: "teatro",
    label: "Teatro",
    icon: "drama-masks",
    color: "#4ECDC4"
  },
  {
    key: "gastronomia",
    label: "Gastronomia",
    icon: "silverware-fork-knife",
    color: "#FFE66D"
  },
  // ... mais categorias
]
```

### Seleção Única vs Múltipla
```jsx
// Múltipla (padrão)
<CommunityCategoryFilter
  selectedCategories={["shows", "teatro"]}
  onCategoryToggle={setSelected}
  allowMultiple={true}
/>

// Única
<CommunityCategoryFilter
  selectedCategories={["shows"]}
  onCategoryToggle={setSelected}
  allowMultiple={false}
/>
```

---

## Integração em TelaComunidade

### Estrutura Completa
```jsx
import CommunityCategorySection from "../components/CommunityCategorySection";
import CommunityCategoryFilter from "../components/CommunityCategoryFilter";

export default function TelaComunidade() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // Agrupar grupos por categoria
  const groupedByCategory = useMemo(() => {
    const grouped = {};
    groups.forEach(group => {
      const genre = group.genre || "Outro";
      if (!grouped[genre]) grouped[genre] = [];
      grouped[genre].push(group);
    });
    return grouped;
  }, [groups, selectedCategories]);

  return (
    <ScrollView>
      {/* Filtro */}
      <CommunityCategoryFilter
        selectedCategories={selectedCategories}
        onCategoryToggle={setSelectedCategories}
      />

      {/* Seções por categoria */}
      {Object.entries(groupedByCategory).map(([category, groups]) => (
        <CommunityCategorySection
          key={category}
          category={category}
          icon={getCategoryIcon(category)}
          groups={groups}
          onGroupPress={handleGroupPress}
          checkIsMember={checkIsMember}
        />
      ))}
    </ScrollView>
  );
}
```

---

## Customização de Cores

### Adicionar Nova Categoria
```javascript
// Em CommunityCategorySection.js
const getCategoryColor = (categoryKey) => {
  const colorMap = {
    shows: "#FF6B6B",
    teatro: "#4ECDC4",
    gastronomia: "#FFE66D",
    // NOVA CATEGORIA
    "minha-categoria": "#NOVA_COR",
  };
  return colorMap[categoryKey?.toLowerCase()] || Colors.primary;
};
```

### Adicionar Novo Ícone
```javascript
// Em CommunityCategorySection.js
const getCategoryIcon = (categoryName) => {
  const iconMap = {
    shows: "music-note-outline",
    teatro: "drama-masks",
    gastronomia: "silverware-fork-knife",
    // NOVO ÍCONE
    "minha-categoria": "novo-icone",
  };
  return iconMap[categoryName?.toLowerCase()] || "folder-outline";
};
```

### Adicionar Filtro
```javascript
// Em CommunityCategoryFilter.js
const CATEGORY_FILTERS = [
  // ... filtros existentes
  {
    key: "minha-categoria",
    label: "Minha Categoria",
    icon: "novo-icone",
    color: "#NOVA_COR",
  },
];
```

---

## Performance

### Otimizações Aplicadas
1. **useMemo** para `groupedByCategory` - evita recálculos desnecessários
2. **Componentes Separados** - cada seção renderiza independentemente
3. **ScrollView Otimizado** - lista com altura definida

### Dicas
- Limite de 2 grupos expandidos por padrão (usar "Ver Tudo" para expandir)
- Ordene grupos por `membersCount` para melhor UX
- Use `ref` se precisar scroll programático

---

## Accessibility

### Suportes
- ✅ Ícones com labels
- ✅ Botões com tamanho >= 44x44 pontos
- ✅ Contraste de cores adequado
- ✅ Touch targets espaçados

### Para Melhorar
```jsx
// Adicionar acessibilidade
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Entrar na comunidade"
  accessibilityRole="button"
>
  {/* conteúdo */}
</TouchableOpacity>
```

---

## Troubleshooting

### Problema: Grupos não aparecem em nenhuma categoria
**Solução**: Verifique se o campo `genre` está preenchido nos documentos do Firebase

### Problema: Ícones não aparecem
**Solução**: Verifique se o nome do ícone existe em `@expo/vector-icons/MaterialCommunityIcons`

### Problema: Cores estranhas
**Solução**: Verifique os valores de `categoryColor` na função `getCategoryColor`

### Problema: Performance lenta
**Solução**: 
- Reduza número de grupos por renderização
- Use `FlatList` em vez de `map` para listas grandes
- Verifique se `useMemo` está funcionando

---

## Exemplos Práticos

### Exemplo 1: Filtrar por Interesse
```jsx
const [selectedCategories, setSelectedCategories] = useState(["shows", "teatro"]);

const filteredGroups = useMemo(() => {
  return groups.filter(group => {
    const groupCategory = group.genre?.toLowerCase();
    return selectedCategories.some(cat => groupCategory.includes(cat));
  });
}, [groups, selectedCategories]);
```

### Exemplo 2: Ordenar por Popularidade
```jsx
const sortedByMembers = groups.sort(
  (a, b) => (b.membersCount || 0) - (a.membersCount || 0)
);
```

### Exemplo 3: Contar Grupos por Categoria
```jsx
const categoryCounts = Object.entries(groupedByCategory).map(
  ([category, groups]) => ({
    category,
    count: groups.length
  })
);
```

---

## Links Úteis
- [Material Community Icons](https://pictogrammers.com/library/mdi/)
- [React Native Docs](https://reactnative.dev/)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)

---

**Última Atualização**: 25 de maio de 2026
