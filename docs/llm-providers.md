# Proveedores de LLM

El **Simple CLI** es agnóstico del modelo, lo que significa que puedes alternar entre los principales proveedores de IA del mercado.

## Proveedores Soportados

| Provider | Modelos Recomendados | Características |
|----------|----------------------|-----------------|
| **OpenAI** | `gpt-4o`, `gpt-4o-mini` | Excelente soporte de herramientas y structured output. |
| **Anthropic** | `claude-3-5-sonnet` | Gran razonamiento y seguimiento de instrucciones. |
| **Google** | `gemini-1.5-pro`, `gemini-1.5-flash` | Ventana de contexto masiva y eficiente. |

---

## Cómo Cambiar de Proveedor

No necesitas reiniciar la aplicación para probar un modelo diferente. En la consola interactiva:

1. Escribe `/config`.
2. Selecciona **"Cambiar LLM Provider"**.
3. Elige el nuevo proveedor e ingresa la API Key correspondiente si no ha sido configurada.
4. El agente validará la conexión y aplicará el cambio inmediatamente para la siguiente consulta.

---

## Selección de Modelo

Dentro de cada proveedor, el Setup Wizard te permite elegir entre modelos de alto rendimiento (ej. `gpt-4o`) o modelos más económicos y rápidos (ej. `gpt-4o-mini`).

Si deseas usar un modelo que no figura en la lista predefinida del Wizard, puedes editar directamente el archivo `config.json` y reiniciar la app.

---

## Detalles Técnicos

El sistema utiliza `@langchain/openai`, `@langchain/anthropic` y `@langchain/google-genai` bajo el capó. La lógica de creación de los modelos se centraliza en `src/llm/llm-factory.ts`.
