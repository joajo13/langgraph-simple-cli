# Sistema de Skills

Una de las características más potentes de este agente es su sistema modular de **Skills** (Habilidades).

## ¿Qué es una Skill?

Diferenciamos claramente entre dos conceptos:
- **Tool (Herramienta)**: Una función técnica atómica. Ejemplo: `gmail_send_message`.
- **Skill (Habilidad)**: Un módulo que agrupa herramientas relacionadas, instrucciones de comportamiento (prompts) y metadatos (íconos, descripción).

---

## Estructura de una Skill

Cada skill reside en su carpeta dentro de `src/skills/` y debe seguir la interfaz definida en `src/skills/core/skill.ts`:

- `getMetadata()`: Retorna el nombre, descripción e ícono.
- `isAvailable(config)`: Verifica si la skill tiene las API keys necesarias.
- `getTools(config)`: Retorna el array de herramientas de LangChain.
- `getSystemInstructions()`: Retorna prompts específicos que se inyectan en el cerebro del agente cuando la skill está activa.

---

## Creación de una Nueva Skill

Para añadir una capacidad (ejemplo: "Spotify Skill"):

1. Crea la carpeta `src/skills/spotify/`.
2. Implementa las herramientas de LangChain en `src/skills/spotify/tools/`.
3. Crea la clase que implemente la interfaz `Skill`.
4. Regístrala en el `SkillRegistry` global (`src/skills/index.ts`).

---

## Registry y Orquestación

El `SkillRegistry` actúa como un catálogo central. El agente consulta este registro para:
1. Listar las herramientas disponibles para el LLM.
2. Recopilar todas las instrucciones de sistema de las habilidades activas para configurar el prompt del asistente.
