# Configuración y API Keys

El **Research Assistant** cuenta con un sistema de configuración interactivo que te guía en la configuración inicial y persiste tus credenciales de forma segura.

## Flujo de Inicio

Cuando ejecutas el agente por primera vez (o si falta el archivo de configuración), se activa automáticamente el **Setup Wizard**:

1. **Selección de Proveedor**: Eliges entre OpenAI, Anthropic o Google Gemini.
2. **Ingreso de API Key**: Se te solicita la key del proveedor elegido. El sistema valida la key realizando una pequeña llamada de prueba antes de guardarla.
3. **Herramientas Opcionales**: Puedes configurar servicios adicionales como Tavily (para búsqueda web).

---

## Persistencia de Datos

La configuración se guarda en un archivo JSON local:

- **Ruta**: `~/.research-assistant/config.json`
- **En Docker**: `/root/.research-assistant/config.json`

### Estructura del Config
```json
{
  "llmProvider": "openai",
  "llmModel": "gpt-4o-mini",
  "openaiApiKey": "sk-...",
  "tavilyApiKey": "tvly-...",
  "createdAt": "2025-01-27T...",
  "updatedAt": "2025-01-27T..."
}
```

---

## Reconfiguración

Puedes volver a configurar tus llaves en cualquier momento mediante el comando slash en la consola:

```bash
You: /config
```

Esto abrirá un menú para cambiar de proveedor, actualizar llaves o ver la configuración actual.

---

## Seguridad

- **Validación Local**: Las llaves se verifican antes de ser guardadas para evitar errores de conexión posteriores.
- **Entrada Segura**: En la consola, las llaves se ocultan mientras las escribes.
- **Sin Logs**: El sistema está diseñado para nunca imprimir tus API Keys en los logs o en la consola después de haber sido ingresadas.
