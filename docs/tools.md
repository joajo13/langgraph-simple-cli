# Catálogo de Herramientas

El agente viene pre-equipado con un set de herramientas "Core" para asistir en tareas diarias.

## 1. Búsqueda Web (Tavily)
- **ID**: `web_search`
- **Uso**: Obtener información de actualidad de internet.
- **Requisito**: `TAVILY_API_KEY`.

## 2. Wikipedia
- **ID**: `wikipedia`
- **Uso**: Consultar artículos de referencia y biografías.
- **Requisito**: Ninguno (gratuito).

## 3. Calculadora (MathJS)
- **ID**: `calculator`
- **Uso**: Operaciones matemáticas avanzadas, conversiones de unidades y estadística.
- **Ejemplo**: "Calcula el 15% de 2500" o "Convierte 5km a millas".

## 4. Fecha y Hora
- **ID**: `datetime`
- **Uso**: Obtener la hora actual en cualquier zona horaria.
- **Ejemplo**: "¿Qué hora es en Tokyo ahora mismo?".

## 5. Lector de URLs
- **ID**: `url_reader`
- **Uso**: Extrae el contenido de texto de una página web específica y lo resume.
- **Requisito**: OpenAI o LLM activo para el resumen.

## 6. Gmail
- **ID**: `gmail`
- **Uso**: Leer correos, buscar mensajes y redactar borradores.
- **Guía Específica**: [Integración con Google](./gmail-integration.md).

## 7. Calendar
- **ID**: `calendar`
- **Uso**: Consultar agenda, buscar eventos y agendar reuniones.
- **Requisito**: Autenticación con Google.

## 8. User Profile (Memory)
- **ID**: `user_profile`
- **Uso**: Permite al agente recordar tu nombre, preferencias y datos entre sesiones.
- **Requisito**: Ninguno.

---

## Degradación Graceful

Si una herramienta no tiene su API Key configurada, el sistema:
1. La marca como no disponible.
2. El comando `/tools` mostrará un ícono ❌ indicando la falta de configuración.
3. El agente seguirá funcionando normalmente con las herramientas que sí estén disponibles.
