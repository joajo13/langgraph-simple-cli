# Standardized Skills System Design

## Contexto y Estandarización
Basado en la investigación de frameworks estándar de industria (Semantic Kernel, LangChain, OpenAI Plugins), diferenciamos claramente entre **Tool** y **Skill**:

-   **Tool (Herramienta)**: Una función ejecutable atómica ("las manos"). Ej: `gmail_send_message`.
-   **Skill (Habilidad/Plugin)**: Una colección modular de herramientas, lógica, prompts y configuración que dota al agente de una *capacidad* completa ("el saber hacer").

Este diseño sigue el patrón de **Plugins** (Semantic Kernel) o **Toolkits** (LangChain), pero mantenemos el nombre **Skill** por preferencia del usuario, definiéndolo como una unidad lógica de "expertise".

## Arquitectura Propuesta

### 1. Interface Base (`src/skills/core/skill.ts`)

Una Skill no solo expone herramientas, sino que define *cómo* el agente debe usarlas (via instrucciones).

```typescript
import { StructuredTool } from "@langchain/core/tools";
import { Config } from "../../config";

export interface SkillMetadata {
  name: string;      // Identificador único (ej: "gmail", "web_search")
  description: string; // Descripción general para el orquestador
  icon: string;
  version: string;
}

export interface Skill {
  /**
   * Metadatos para registro y UI
   */
  getMetadata(): SkillMetadata;

  /**
   * Valida si la skill puede activarse (ej. tiene API keys, servicios dependientes)
   */
  isAvailable(config: Config): boolean;

  /**
   * Retorna las herramientas atómicas que esta skill provee al LLM.
   */
  getTools(config: Config): StructuredTool[];

  /**
   * (Crucial para estandarización) 
   * Retorna instrucciones de sistema específicas para esta skill.
   * Esto inyecta el "conocimiento" de cómo usar las herramientas o reglas de negocio.
   * Ej: "Cuando busques en Google, prefiere fuentes recientes..."
   */
  getSystemInstructions?(): string;
}
```

### 2. Estructura de Directorios (Modular Monolith)

Cada skill es un módulo autocontenido.

```
src/
  skills/
    core/
      skill.ts       # Definición de contrato
      registry.ts    # Service Locator / Registry
    
    // Skill Modules
    gmail/
      index.ts       # Implementación de Skill
      tools/         # Definiciones de LangChain Tools específicas
      prompts.ts     # System prompts específicos de Gmail
      types.ts
    
    web-search/
      index.ts
      tools/
      
    common/          # Utilidades compartidas entre skills (si necesario)
```

### 4. Documentación como Código (`README.md`)

Para que el agente "sepa" cómo usar una Skill de manera más natural (como un agente de código), cada Skill puede tener un archivo `README.md` o `USAGE.md` en su directorio.

### 4. Definition Format (`SKILL.md`)

Adoptamos el estándar de **Claude Code** usando archivos `SKILL.md`.

**Estructura:**
```
src/skills/gmail/
  index.ts       # Logic / Tool definitions
  SKILL.md       # Instructions & Metadata
  tools/
```

**Formato `SKILL.md`:**
Debe tener YAML Frontmatter + Instrucciones.

```markdown
---
name: gmail
description: Gmail integration for reading, searching, and sending emails.
version: 1.0.0
---
## Usage Instructions
- **Check Auth first**: Before trying to read or send emails...
- **Search Queries**: Use strict Gmail query syntax...
```

**Inyección:**
El `SkillRegistry` o la clase `GmailSkill`:
1.  Lee `SKILL.md`.
2.  Parsea el Frontmatter (para metadatos).
3.  Usa el cuerpo del markdown como `System Instructions`.



El registro central actúa como el orquestador de capacidades.

```typescript
export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();

  register(skill: Skill) {
    this.skills.set(skill.getMetadata().name, skill);
  }

  /**
   * Obtiene todas las herramientas activas de todas las skills disponibles
   */
  getActiveTools(config: Config): StructuredTool[] {
    return Array.from(this.skills.values())
      .filter(s => s.isAvailable(config))
      .flatMap(s => s.getTools(config));
  }

  /**
   * Compila el System Prompt global concatenando instrucciones de skills activas
   */
  getCombinedSystemInstructions(config: Config): string {
    return Array.from(this.skills.values())
      .filter(s => s.isAvailable(config))
      .map(s => s.getSystemInstructions?.() || "")
      .join("\n\n");
  }
}
```

## Plan de Migración (Refinado)

1.  **Infraestructura**: Crear `src/skills/core` (Interfaces + Registry).
2.  **Wrappers**: Migrar herramientas actuales a `src/skills/<name>`.
    *   *Nota*: No cambiaremos la lógica interna de las tools de LangChain todavía, solo las envolveremos en Skills.
3.  **Prompt Injection**: Modificar `src/graph.ts` para que obtenga no solo las tools, sino también las `SystemInstructions` del Registry y las inyecte al prompt del sistema.

## Estrategias de Inyección de Instrucciones

Existen dos enfoques para que el agente acceda a las instrucciones de las Skills:

### Enfoque 1: Pre-Inyección (Original)

Las instrucciones de todas las skills activas se concatenan e inyectan en el **system prompt** al inicio de la conversación.

```
┌──────────────────────────────────────────────────────────┐
│                    SYSTEM PROMPT                          │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │
│  │ Gmail SKILL.md │ │ Search SKILL.md│ │ Calc SKILL.md  │ │
│  └────────────────┘ └────────────────┘ └────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Pros:**
- Simple de implementar
- El agente siempre tiene contexto completo
- Comportamiento predecible

**Contras:**
- Consume tokens del contexto (cada mensaje incluye todas las instrucciones)
- No escala bien con muchas skills (20+)

### Enfoque 2: Acceso On-Demand (Recomendado para escalabilidad)

El agente recibe solo un **índice** de skills disponibles y puede consultar instrucciones detalladas cuando las necesita usando tools dedicados.

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM PROMPT (Ligero)                   │
│  "Tienes acceso a las siguientes skills: gmail, web_search, │
│   calculator. Usa `list_skills` para ver detalles y         │
│   `read_skill(name)` para obtener instrucciones específicas"│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ Cuando necesita usar Gmail
                    ┌─────────────────────┐
                    │  read_skill("gmail")│
                    └─────────────────────┘
                              │
                              ▼
                    Instrucciones completas
                    de gmail/SKILL.md
```

**Pros:**
- Ahorra tokens significativamente
- Escala a muchas skills
- El agente es "consciente" de buscar ayuda

**Contras:**
- Requiere tool calls adicionales
- El agente podría olvidar consultar instrucciones

---

## Tools de Acceso a Skills

### `list_skills`

Retorna un índice compacto de todas las skills disponibles con su metadata básica.

```typescript
// Respuesta ejemplo:
{
  skills: [
    { name: "gmail", description: "Email integration", icon: "📧" },
    { name: "web_search", description: "Search the web", icon: "🔍" },
    { name: "calculator", description: "Math operations", icon: "🧮" }
  ]
}
```

### `read_skill`

Lee las instrucciones detalladas de una skill específica (el contenido de su `SKILL.md`).

```typescript
// Input: { skillName: "gmail" }
// Output: El contenido markdown del SKILL.md de Gmail
```

---

## Beneficios del Estándar
1.  **Separación de "Tools" vs "Behavior"**: Las tools son tontas, la Skill aporta la inteligencia via prompts.
2.  **Portabilidad**: Podríamos empaquetar una skill como librería npm en futuro.
3.  **Context Aware**: El agente sabe "qué puede hacer" más allá de la lista de funciones JSON.
4.  **Escalabilidad**: Con acceso on-demand, el sistema puede crecer a decenas de skills sin saturar el contexto.
