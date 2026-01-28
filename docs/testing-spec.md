# Testing & Verification Specification

## Overview

Especificación de pruebas que el proyecto debe pasar antes de considerarse completo.

---

## 🔑 API Keys for Testing

> **Instrucciones**: Pegá tus API keys abajo. Yo las leeré de aquí para ejecutar los tests.

```
LLM_PROVIDER=google
LLM_API_KEY=your-api-key
TAVILY_API_KEY=your-tavily-key
```

| Campo | Valores válidos |
|-------|-----------------|
| `LLM_PROVIDER` | `openai`, `anthropic`, o `google` |
| `LLM_API_KEY` | La key correspondiente al provider elegido |
| `TAVILY_API_KEY` | Opcional, para web_search tool |

---

## Test Suite

### Test 1: Build Success

**Criterio**: El proyecto debe compilar sin errores.

```bash
npm run build
```

**Resultado esperado**:
- Exit code: 0
- Sin errores de TypeScript
- Carpeta `dist/` generada

---

### Test 2: Setup Wizard

**Criterio**: El wizard debe solicitar y validar API keys correctamente.

```bash
npm run dev
```

**Flujo esperado**:
1. Muestra header del wizard
2. Solicita selección de LLM provider
3. Solicita API key del provider elegido
4. Valida la key con test call
5. Opcionalmente solicita Tavily key
6. Guarda config en `~/.research-assistant/config.json`
7. Muestra mensaje de éxito

**Verificar**:
- [ ] Se muestra lista de providers (OpenAI, Claude, Gemini)
- [ ] Input de API key oculta caracteres
- [ ] Validación funciona (key inválida = error)
- [ ] Config se persiste correctamente

---

### Test 3: Tools Individuales

**Criterio**: Cada tool debe funcionar correctamente.

| Tool | Test Query | Resultado Esperado |
|------|------------|-------------------|
| `calculator` | `2 + 2 * 3` | `8` |
| `datetime` | Hora en Buenos Aires | Hora actual correcta |
| `wikipedia` | "Albert Einstein" | Resumen del artículo |
| `web_search` | "noticias hoy" | Lista de resultados |
| `url_reader` | URL válida | Contenido/resumen |

---

### Test 4: Conversation Flow

**Criterio**: El agente debe responder correctamente a consultas.

**Test Cases**:

```
# Caso 1: Respuesta directa (sin tools)
You: Hola, ¿cómo estás?
Expected: Respuesta conversacional amigable

# Caso 2: Tool única
You: ¿Cuánto es 15% de 200?
Expected: Usa calculator, responde "30"

# Caso 3: Paralelización
You: ¿Qué hora es en Tokyo y en Londres?
Expected: Usa datetime 2 veces en paralelo, muestra ambas horas

# Caso 4: Búsqueda + síntesis
You: ¿Quién ganó el último mundial de fútbol?
Expected: Usa web_search, sintetiza respuesta

# Caso 5: Combinación de tools
You: Busca en Wikipedia qué es la inflación y calcula 5% de 1000
Expected: Usa wikipedia + calculator, respuesta combinada
```

---

### Test 5: CLI Commands

**Criterio**: Los comandos slash deben funcionar.

| Comando | Resultado Esperado |
|---------|-------------------|
| `/help` | Muestra lista de comandos |
| `/tools` | Muestra tools activas |
| `/config` | Permite reconfigurar |
| `/clear` | Limpia pantalla |
| `/exit` | Sale de la aplicación |

---

### Test 6: Docker

**Criterio**: El contenedor debe construir y ejecutar correctamente.

```bash
# Build
docker-compose build

# Run interactivo
docker-compose run --rm research-assistant
```

**Verificar**:
- [ ] Build sin errores
- [ ] Contenedor inicia setup wizard en primera ejecución
- [ ] Config persiste entre reinicios (volumen)
- [ ] Input/output funciona correctamente (TTY)

---

### Test 7: Provider Switch

**Criterio**: Debe poder cambiar de LLM provider.

```
You: /config
> Cambiar LLM provider
> Seleccionar: Anthropic
> Ingresar key: sk-ant-...
> Validando... ✅
```

**Verificar**:
- [ ] Se puede cambiar de OpenAI a Claude
- [ ] Se puede cambiar de Claude a Gemini
- [ ] Después del cambio, el agente responde usando el nuevo modelo

---

## Acceptance Criteria

El proyecto está **COMPLETO** cuando:

- [ ] ✅ Test 1: Build exitoso
- [ ] ✅ Test 2: Setup wizard funcional
- [ ] ✅ Test 3: Todas las tools funcionan
- [ ] ✅ Test 4: Todos los test cases pasan
- [ ] ✅ Test 5: Todos los comandos funcionan
- [ ] ✅ Test 6: Docker funciona
- [ ] ✅ Test 7: Cambio de provider funciona

---

## Iteration Protocol

Si algún test falla:

1. Identificar el componente que falla
2. Revisar la especificación correspondiente
3. Corregir la implementación
4. Re-ejecutar el test
5. Repetir hasta que pase

**No se considera completo hasta que TODOS los tests pasen.**
