# Arquitectura del Sistema

Este documento describe la arquitectura y los principios de diseño que rigen el **Simple CLI**.

## Principios de Diseño

El proyecto sigue los principios de **Arquitectura Limpia (Clean Architecture)** y **SOLID** para asegurar que el sistema sea escalable, testeable y fácil de mantener.

### 1. Estructura Modular (Hexagonal)
El código está organizado por módulos de dominio/funcionalidad en lugar de capas técnicas puras:
- `src/skills`: Define las capacidades del agente (Skills y Tools).
- `src/nodes`: Unidades de lógica del grafo de estados.
- `src/config`: Manejo de configuración y persistencia.
- `src/llm`: Abstracción de proveedores de IA.
- `src/cli`: Interfaz de usuario de consola.

### 2. Inyección de Dependencias
Las dependencias (como la `Config` o el `LLM`) se inyectan en los componentes para facilitar el desacoplamiento y las pruebas unitarias.

### 3. Tipado Estricto con Zod
- **Validación de Runtime**: Usamos Schemas de Zod para validar la configuración cargada desde archivos.
- **Salidas Estructuradas**: Las decisiones del Router y las herramientas usan Zod para asegurar que el LLM responda con el formato correcto.

---

## Flujo de Datos

El ciclo de vida de una consulta sigue este flujo:

1. **Entrada**: El usuario escribe un mensaje en la CLI (`src/cli/console.ts`).
2. **Estado**: Se inicializa o actualiza el `AgentState` (`src/state.ts`).
3. **Orquestación (LangGraph)**:
   - **Summarizer Node**: Verifica si el historial es muy largo y lo resume para ahorrar tokens.
   - **Router Node**: Analiza la intención y decide si requiere herramientas.
   - **Tool Executor Node**: Ejecuta las herramientas seleccionadas en paralelo.
   - **Generator Node**: Sintetiza la respuesta final.
   - **Memory Node**: Extrae y aprende información del usuario en segundo plano.
4. **Salida**: La respuesta se imprime por consola mediante el `Renderer`.

---

## Tecnologías Clave

| Tecnología | Propósito |
|------------|-----------|
| **LangGraph** | Orquestación de máquinas de estado para el agente. |
| **LangChain** | Abstracción de modelos y herramientas de IA. |
| **TypeScript** | Lenguaje principal con tipado estático. |
| **Zod** | Esquemas y validación de datos. |
| **Docker** | Contenerización y despliegue consistente. |

---

## Diagrama de Carpetas Principal

```text
src/
├── cli/           # Interfaz de comandos (REPL, Renderer, Commmands)
├── config/        # Setup Wizard, Validadores y Config Store
├── llm/           # Factory para OpenAI, Anthropic y Google
├── nodes/         # Nodos del grafo (Router, Executor, Generator, Info, Memory)
├── skills/        # Core de habilidades y catálogo modular
├── tools/         # Implementaciones de herramientas base
├── graph.ts       # Definición y compilación del flujo LangGraph
├── state.ts       # Definición del esquema del estado del agente
└── index.ts       # Punto de entrada principal
```
