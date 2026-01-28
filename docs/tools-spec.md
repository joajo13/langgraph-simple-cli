# Tools Specification

## Overview

El agente cuenta con 5 herramientas que pueden ejecutarse en paralelo para responder consultas del usuario.

---

## 1. Web Search Tool

**Archivo**: `src/tools/web-search.tool.ts`

### Propósito
Búsqueda en tiempo real en la web para obtener información actualizada.

### API
- **Provider**: Tavily
- **Requiere**: `TAVILY_API_KEY`

### Schema
```typescript
{
  query: z.string().describe("Search query"),
  maxResults: z.number().optional().default(5)
}
```

### Ejemplo de Uso
```
Input: { query: "últimas noticias sobre AI 2024", maxResults: 3 }
Output: Array de resultados con title, url, content
```

---

## 2. Wikipedia Tool

**Archivo**: `src/tools/wikipedia.tool.ts`

### Propósito
Consultar artículos de Wikipedia para información de referencia.

### API
- **Provider**: Wikipedia API (paquete `wikipedia`)
- **Requiere**: Nada (gratis)

### Schema
```typescript
{
  topic: z.string().describe("Topic to search on Wikipedia"),
  language: z.enum(["en", "es"]).optional().default("es")
}
```

### Ejemplo de Uso
```
Input: { topic: "Inteligencia Artificial", language: "es" }
Output: Summary del artículo (primeros 500 caracteres)
```

---

## 3. Calculator Tool

**Archivo**: `src/tools/calculator.tool.ts`

### Propósito
Realizar cálculos matemáticos, conversiones y operaciones numéricas.

### API
- **Provider**: math.js (local)
- **Requiere**: Nada

### Schema
```typescript
{
  expression: z.string().describe("Mathematical expression to evaluate")
}
```

### Operaciones Soportadas
- Aritmética básica: `2 + 2`, `100 / 4`
- Porcentajes: `15% of 200`
- Funciones: `sqrt(16)`, `sin(45 deg)`
- Conversiones: `5 km to miles`

### Ejemplo de Uso
```
Input: { expression: "sqrt(144) + 5^2" }
Output: "37"
```

---

## 4. DateTime Tool

**Archivo**: `src/tools/datetime.tool.ts`

### Propósito
Obtener fecha y hora actual en diferentes zonas horarias.

### API
- **Provider**: Intl.DateTimeFormat (built-in)
- **Requiere**: Nada

### Schema
```typescript
{
  timezone: z.string().optional().describe("IANA timezone, e.g. America/New_York"),
  format: z.enum(["full", "date", "time"]).optional().default("full")
}
```

### Zonas Horarias Comunes
- `America/Buenos_Aires`
- `America/New_York`
- `Europe/London`
- `Asia/Tokyo`

### Ejemplo de Uso
```
Input: { timezone: "Asia/Tokyo", format: "full" }
Output: "Lunes, 27 de enero de 2025, 22:45:00 JST"
```

---

## 5. URL Reader Tool

**Archivo**: `src/tools/url-reader.tool.ts`

### Propósito
Leer y resumir contenido de páginas web.

### API
- **Provider**: Cheerio + OpenAI
- **Requiere**: `OPENAI_API_KEY`

### Schema
```typescript
{
  url: z.string().url().describe("URL to read"),
  summarize: z.boolean().optional().default(true)
}
```

### Funcionamiento
1. Fetch del contenido HTML
2. Extracción de texto con Cheerio
3. Resumen con LLM si `summarize: true`

### Ejemplo de Uso
```
Input: { url: "https://example.com/article", summarize: true }
Output: "Resumen: Este artículo habla sobre..."
```

---

## Tool Registry

**Archivo**: `src/tools/index.ts`

```typescript
export const tools = [
  webSearchTool,
  wikipediaTool,
  calculatorTool,
  datetimeTool,
  urlReaderTool,
];

export function getAvailableTools(config: Config): Tool[] {
  return tools.filter(tool => tool.isAvailable(config));
}
```

### Degradación Graceful

Si falta una API key, la tool correspondiente se deshabilita pero el agente sigue funcionando con las demás.

| Tool | Sin OpenAI Key | Sin Tavily Key |
|------|---------------|----------------|
| web_search | ✅ | ❌ |
| wikipedia | ✅ | ✅ |
| calculator | ✅ | ✅ |
| datetime | ✅ | ✅ |
| url_reader | ❌ | ✅ |
