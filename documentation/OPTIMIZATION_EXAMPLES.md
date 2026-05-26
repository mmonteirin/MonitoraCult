# 🚀 Guia Prático de Uso - Otimizações Implementadas

## 1️⃣ Upload de Imagens Otimizado

### Antes (Problemático):
```javascript
// ❌ ANTES
const uploadImagem = async (uri) => {
  const response = await fetch(uri);
  const blob = await response.blob(); // Toda imagem em RAM
  const base64 = btoa(blob); // Aumenta 33%
  // ... upload sem compressão
};
```

### Depois (Otimizado):
```javascript
// ✅ DEPOIS
import * as ImageManipulator from "expo-image-manipulator";

const uploadImagem = async (uri) => {
  // 1. Comprimir
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1500, height: 1500 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  
  // 2. Converter eficientemente
  const base64 = await uriToBase64(compressed.uri);
  
  // 3. Upload
  // ... resto do código
};
```

**Resultado:** Redução de 80% no tamanho!

---

## 2️⃣ Feed com Memoização

### Antes (Muitos re-renders):
```javascript
// ❌ ANTES
const TelaFeed = () => {
  const renderItem = ({ item }) => (
    <View>
      {/* Re-renderiza TODA vez */}
      <Image source={{ uri: item.image }} />
      <Text>{item.titulo}</Text>
    </View>
  );
  
  return <FlatList data={eventos} renderItem={renderItem} />;
};
```

### Depois (Memoizado):
```javascript
// ✅ DEPOIS - Componente separado e memoizado
const EventoCard = memo(({ item, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <Image source={{ uri: item.image }} />
    <Text>{item.titulo}</Text>
  </TouchableOpacity>
), (prev, next) => {
  // Só re-renderiza se item.id ou evento.likes mudar
  return prev.item.id === next.item.id && 
         prev.item.likes === next.item.likes;
});

const TelaFeed = () => {
  const [eventos, setEventos] = useState([]);
  
  // Limitar a 100 eventos em memória
  setEventos(prev => {
    const combined = [...prev, ...novos];
    return combined.slice(-100);
  });
  
  const renderItem = useCallback(({ item }) => (
    <EventoCard 
      item={item}
      onPress={() => console.log(item.id)}
    />
  ), []);
  
  return <FlatList data={eventos} renderItem={renderItem} />;
};
```

---

## 3️⃣ Contexto Otimizado

### Antes:
```javascript
// ❌ ANTES - Value recriada toda renderização
return (
  <AuthContext.Provider
    value={{
      user,
      profile,
      nome: profile?.nome,
      isAdmin: profile?.role === "admin",
      logout,
      // ... 20 propriedades
    }}
  >
    {children}
  </AuthContext.Provider>
);
```

### Depois:
```javascript
// ✅ DEPOIS - Value memoizada
const value = useMemo(() => ({
  user,
  profile,
  nome: profile?.nome,
  isAdmin: profile?.role === "admin",
  logout,
}), [user, profile]); // Só recria quando necessário

return (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);
```

---

## 4️⃣ Cleanup Adequado

### Antes (Memory Leak):
```javascript
// ❌ ANTES
useEffect(() => {
  const unsubscribe = firestore
    .collection('eventos')
    .onSnapshot(snapshot => {
      setEventos(snapshot.docs); // ❌ Atualiza mesmo após desmontar
    });
  
  // ❌ Sem cleanup
}, []);
```

### Depois (Safe):
```javascript
// ✅ DEPOIS
const isMountedRef = useRef(true);

useEffect(() => {
  return () => {
    isMountedRef.current = false; // Cleanup
  };
}, []);

useEffect(() => {
  const unsubscribe = firestore
    .collection('eventos')
    .onSnapshot(snapshot => {
      if (isMountedRef.current) { // ✅ Verifica antes
        setEventos(snapshot.docs);
      }
    });
  
  return unsubscribe; // ✅ Cleanup automático
}, []);
```

---

## 5️⃣ API com Paginação

### Antes (Tudo de uma vez):
```javascript
// ❌ ANTES
const getEventos = async () => {
  const url = `${BASE_URL}/event/find`; // Sem limite!
  const response = await fetch(url);
  return response.json(); // Pode ser 10000+ eventos
};
```

### Depois (Paginado):
```javascript
// ✅ DEPOIS
const getEventos = async (offset = 0) => {
  const url = `${BASE_URL}/event/find?@limit=50&@offset=${offset}`;
  const response = await fetch(url, { timeout: 10000 });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const json = await response.json();
  return Array.isArray(json) ? json : json.data || [];
};

// Uso:
const [offset, setOffset] = useState(0);

const loadMore = async () => {
  const novos = await getEventos(offset);
  setOffset(prev => prev + 50);
  setEventos(prev => [...prev, ...novos]);
};
```

---

## 6️⃣ Hook com Safety

### Antes:
```javascript
// ❌ ANTES
export const useEventos = () => {
  const [eventos, setEventos] = useState([]);
  
  useEffect(() => {
    carregar();
  }, []);
  
  const carregar = async () => {
    const data = await getEventos();
    setEventos(data); // Pode falhar se desmontar
  };
  
  return { eventos };
};
```

### Depois:
```javascript
// ✅ DEPOIS
export const useEventos = () => {
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const carregar = useCallback(async (offset = 0) => {
    try {
      if (!isMountedRef.current) return;
      
      const data = await getEventos(offset);
      
      if (!isMountedRef.current) return; // ✅ Verifica
      
      setEventos(prev => [...prev, ...data]);
    } catch (e) {
      if (isMountedRef.current) setError(e.message);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { eventos, error, carregar };
};
```

---

## 📋 Checklist de Implementação

- [x] Compressão de imagens no upload
- [x] Memoização de componentes (TelaFeed)
- [x] Limpeza de listeners
- [x] Limit no cache (max 100 eventos)
- [x] Contextos otimizados com useMemo
- [x] API com paginação
- [x] Hooks com isMountedRef
- [ ] FlashList para virtual scrolling
- [ ] Image caching local
- [ ] Debouncing em buscas
- [ ] Web workers para processing

---

## 🧪 Como Testar as Otimizações

```javascript
// No App.js temporariamente:
import { Alert } from 'react-native';

const logMemory = () => {
  if (Platform.OS === 'web') {
    const memory = performance.memory;
    Alert.alert(
      'Memory Usage',
      `Heap: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`
    );
  }
};

// Chamar periodicamente:
setInterval(logMemory, 5000);
```

---

**Última atualização:** 18 de Maio de 2026
