# 🎯 Roadmap de Otimizações Futuras

## Fase 2: Virtual Scrolling (Prioridade: ALTA)

### FlashList (Já está no package.json!)
```javascript
// Trocar FlatList por FlashList
import { FlashList } from "@shopify/flash-list";

// No lugar de:
// <FlatList data={eventos} renderItem={renderItem} />

// Usar:
<FlashList
  data={eventos}
  renderItem={renderItem}
  estimatedItemSize={450} // altura aproximada do card
  keyExtractor={(item) => item.id}
  onEndReached={handleEndReached}
  onEndReachedThreshold={0.3}
  scrollEventThrottle={16}
/>
```

**Benefício:** -80% itens renderizados, smooth 60fps

---

## Fase 3: Image Caching (Prioridade: ALTA)

### Instalação:
```bash
npm install react-native-fast-image
```

### Implementação em EventoCard:
```javascript
import FastImage from 'react-native-fast-image';

const EventoCard = memo(({ item }) => (
  <FastImage
    source={{
      uri: item.imagemEvento,
      priority: FastImage.priority.normal,
    }}
    style={{ width: 300, height: 420 }}
    resizeMode={FastImage.resizeMode.cover}
    // ✅ Cache automático!
  />
));
```

**Benefício:** Cache automático, -90% re-downloads

---

## Fase 4: Debouncing em Buscas (Prioridade: MÉDIA)

### Criar debounce helper:
```javascript
// utils/debounce.js
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
```

### Usar em TelaBusca:
```javascript
import { debounce } from '../utils/debounce';

const TelaBusca = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const performSearch = useCallback((query) => {
    if (!query) {
      setResultados([]);
      return;
    }
    
    // Fazer busca aqui
    buscaService.buscar(query);
  }, []);
  
  // ✅ Debounce de 300ms
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    [performSearch]
  );
  
  const handleSearch = (text) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };
  
  return (
    <SearchBar 
      onChangeText={handleSearch}
      value={searchQuery}
    />
  );
};
```

**Benefício:** -70% chamadas desnecessárias

---

## Fase 5: Lazy Loading de Imagens (Prioridade: MÉDIA)

```javascript
const LazyImage = memo(({ uri, style }) => {
  const [loading, setLoading] = useState(true);
  
  return (
    <View style={style}>
      {loading && (
        <ActivityIndicator 
          style={StyleSheet.absoluteFill}
          color={Colors.primary}
        />
      )}
      <FastImage
        source={{ uri }}
        style={style}
        onLoadEnd={() => setLoading(false)}
      />
    </View>
  );
});
```

---

## Fase 6: Analytics de Performance (Prioridade: BAIXA)

### Monitorar uso de RAM:
```javascript
// utils/memoryMonitor.js
export class MemoryMonitor {
  static startMonitoring() {
    if (Platform.OS === 'web') {
      setInterval(() => {
        const memory = performance.memory;
        const used = memory.usedJSHeapSize / 1048576;
        const limit = memory.jsHeapSizeLimit / 1048576;
        
        console.log(`📊 RAM: ${used.toFixed(0)}MB / ${limit.toFixed(0)}MB`);
        
        // Alertar se usar >75%
        if (used / limit > 0.75) {
          console.warn('⚠️ RAM em estado crítico!');
        }
      }, 10000);
    }
  }
}
```

### No App.js:
```javascript
import { MemoryMonitor } from './utils/memoryMonitor';

export default function App() {
  useEffect(() => {
    if (__DEV__) {
      MemoryMonitor.startMonitoring();
    }
  }, []);
  
  return <AppNavigator />;
}
```

---

## Fase 7: Web Workers para Processamento Pesado (Prioridade: BAIXA)

```javascript
// workers/imageProcessor.js
self.onmessage = async (event) => {
  const { uri, quality } = event.data;
  
  // Processar em background
  const processed = await processImage(uri, quality);
  
  self.postMessage({ success: true, data: processed });
};
```

### Usar:
```javascript
const processImageInWorker = (uri) => {
  return new Promise((resolve) => {
    const worker = new Worker('workers/imageProcessor.js');
    
    worker.onmessage = (event) => {
      resolve(event.data);
      worker.terminate();
    };
    
    worker.postMessage({ uri, quality: 0.7 });
  });
};
```

---

## 📋 Implementação Recomendada

### Timeline:
1. **Semana 1:** FlashList + FastImage (máximo impacto)
2. **Semana 2:** Debounce + Analytics
3. **Semana 3:** Lazy Loading + Testes

### Comandos úteis:

```bash
# Instalar dependências de Phase 2-3
npm install react-native-fast-image

# Profiling de performance
npx react-native run-android --variant=release --active

# DevTools
npx react-devtools

# Monitorar bundle size
npm run build && npm run analyze

# Testes de stress
npm test -- --coverage
```

---

## 🎯 Métricas de Sucesso

| Métrica | Target | Monitorar |
|---------|--------|-----------|
| FPS ao scroll | 60 | DevTools Profiler |
| RAM idle | <80MB | Memory Monitor |
| RAM ao carregar 50 eventos | <150MB | Memory Monitor |
| Tempo primeira carga | <2s | Network tab |
| Tempo login | <1s | DevTools |

---

## ⚠️ Possíveis Problemas e Soluções

### Problema: FlashList renderiza branco na primeira carga
```javascript
// Solução: Adicionar fallback
<FlashList
  data={eventos}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  ListEmptyComponent={
    loading ? <ActivityIndicator /> : <EmptyState />
  }
/>
```

### Problema: FastImage não atualiza cache
```javascript
// Solução: Forçar refresh
<FastImage
  source={{
    uri: imageUrl,
    priority: FastImage.priority.high,
  }}
  key={imageUrl} // Force re-render
/>
```

### Problema: Debounce causa delays perceptíveis
```javascript
// Solução: Usar immediate + debounce
const immediateSearch = (query) => {
  setResultados(getLocalResults(query)); // Instantâneo
};

const debouncedSearch = debounce((query) => {
  fetchRemoteResults(query); // Esperado
}, 300);

const handleSearch = (query) => {
  immediateSearch(query);
  debouncedSearch(query);
};
```

---

## 📚 Recursos Úteis

- [React Native Performance](https://reactnative.dev/docs/performance)
- [FlashList Docs](https://shopify.github.io/flash-list/)
- [FastImage Docs](https://github.com/DylanVann/react-native-fast-image)
- [Chrome DevTools Memory Profiler](https://developer.chrome.com/docs/devtools/memory-problems/)

---

**Atualizado:** 18 de Maio de 2026  
**Status:** Pronto para implementação
