# Research Assistant - Índice de Documentación

Bienvenido a la documentación técnica del **Research Assistant**, un agente de investigación inteligente construido con LangGraph, soporte multi-LLM y un sistema modular de habilidades (Skills).

## Introducción

Este proyecto es un agente de CLI diseñado para ayudar en tareas de investigación mediante el uso de herramientas especializadas (Web Search, Wikipedia, etc.) y la orquestación de flujos de trabajo complejos mediante Grafos de Estado.

---

## Guías del Usuario

- **[Instalación y Configuración](./api-keys.md)**: Cómo configurar tus API keys y el entorno inicial.
- **[Uso de la Interfaz CLI](./cli.md)**: Comandos disponibles y guía de interacción interactiva.
- **[Ejecución con Docker](./docker.md)**: Guía para desplegar el agente en contenedores.

## Guías del Desarrollador

- **[Arquitectura General](./architecture.md)**: Principios de diseño, flujo de datos y tecnologías clave.
- **[Sistema de Skills](./skills.md)**: Cómo funciona el sistema modular de habilidades y herramientas.
- **[Orquestación del Grafo (LangGraph)](./graph.md)**: Detalles sobre el estado, los nodos y los bordes del agente.
- **[Proveedores de LLM](./llm-providers.md)**: Configuración y soporte para OpenAI, Anthropic y Google Gemini.
- **[Catálogo de Herramientas](./tools.md)**: Especificaciones técnicas de las herramientas integradas.
- **[Pruebas y Verificación](./testing.md)**: Cómo ejecutar el suite de pruebas para validar cambios.
- **[Integración con Gmail](./gmail-integration.md)**: Detalles sobre el ecosistema de Google.

---

## Primeros Pasos (Quick Start)

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar el Wizard de Configuración**:
   ```bash
   npm run dev
   ```

3. **Ejecutar el Agente**:
   Una vez configurado, el comando anterior te llevará directamente a la consola interactiva.

---

## Estado del Proyecto

Actualmente, el proyecto cuenta con:
- ✅ **Base Sólida**: LangGraph + TypeScript + Zod.
- ✅ **Multi-LLM**: Soporte para los 3 proveedores principales.
- ✅ **6 Herramientas Core**: Wikipedia, Tavily, MathJS, DateTime, URL Reader y Gmail (en progreso).
- ✅ **CLI Premium**: Interfaz colorida con spinners y estados visuales.
