# Guía de la Interfaz CLI

La interfaz de comandos (CLI) es el punto de entrada principal para interactuar con el agente. Está diseñada para ser intuitiva, con estados visuales claros y comandos de utilidad.

## Interacción Básica

Al iniciar el agente con `npm run dev`, verás un header de bienvenida y un prompt de espera:

```text
You: _
```

Simplemente escribe tu consulta. El agente mostrará diferentes estados:
- **🔍 Pensando...**: Cuando el LLM está procesando la intención.
- **🔧 Ejecutando tools...**: Cuando se activan herramientas como búsqueda o cálculos.
- **🤖 Assistant**: La respuesta final sintetizada.

---

## Comandos Slash

Existen comandos especiales que comienzan con `/` para gestionar el estado de la aplicación:

| Comando | Descripción |
|---------|-------------|
| `/help` | Muestra la lista de comandos y herramientas disponibles. |
| `/config` | Abre el menú de configuración de API Keys y proveedores. |
| `/tools` | Muestra el estado de disponibilidad de cada herramienta. |
| `/clear` | Limpia la pantalla de la consola. |
| `/exit` | Cierra la aplicación de forma segura. |

---

## Estados Visuales

El CLI utiliza íconos y colores para facilitar la lectura:
- **✅ Verdes**: Operaciones exitosas o herramientas disponibles.
- **❌ Rojos**: Errores o herramientas deshabilitadas por falta de configuración.
- **🟡 Amarillos**: Operaciones en proceso (Spinners).
- **🌐, 📚, 🔢**: Íconos específicos para cada tipo de herramienta ejecutada.

---

## Soporte Multilineal

Actualmente, el CLI procesa entradas línea por línea. Si necesitas enviar un texto largo, te recomendamos copiarlo y pegarlo en una sola línea o enviarlo por partes (aunque el agente mantendrá el contexto, la interpretación es mejor por bloques lógicos).
