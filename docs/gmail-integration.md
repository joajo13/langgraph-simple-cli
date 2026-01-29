# Guía de Integración con Google (Gmail & Calendar)

Este documento detalla los pasos para habilitar la integración de Gmail y Calendar en el **Simple CLI**, permitiendo al agente gestionar tu agenda y correos electrónicos.

## Requisitos Previos en Google Cloud

Para que el agente pueda conectarse, debes configurar un proyecto en la [Google Cloud Console](https://console.cloud.google.com/):

### 1. Crear el Proyecto
1. Crea un nuevo proyecto (ej. `langgraph-agent-google`).
2. Habilita las siguientes APIs desde la biblioteca:
   - **Gmail API**
   - **Google Calendar API**

### 2. Configurar Pantalla de Consentimiento (OAuth)
1. Ve a "APIs & Services" > "OAuth consent screen".
2. Configura una aplicación de tipo **External**.
3. Añade los siguientes alcances (Scopes):
   - `.../auth/gmail.readonly`
   - `.../auth/gmail.compose`
   - `.../auth/gmail.send`
   - `.../auth/gmail.modify`
   - `.../auth/calendar`

### 3. Crear Credenciales
1. Crea una credencial de tipo **OAuth client ID**.
2. Tipo de aplicación: **Desktop app**.
3. Descarga el archivo JSON de credenciales o anota el `Client ID` y el `Client Secret`.

---

## Configuración en el Agente

Una vez tengas las credenciales de Google:

1. **Variables de Entorno**: Añade `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` a tu archivo `.env`.
2. **Autenticación**:
   - La primera vez que uses una herramienta de Gmail, el agente te proporcionará una URL de Google.
   - Visita la URL, autoriza el acceso y copia el código resultante.
   - Pega el código en la consola del agente.

El sistema guardará un token de acceso localmente para no pedirte permiso en cada sesión.

---

## Capacidades de la Skill Gmail

Una vez autenticado, puedes pedirle al agente cosas como:
- "¿Tengo correos sin leer de [Nombre]?"
- "Redacta un borrador para [Email] agradeciendo la reunión de ayer."
- "Busca correos que hablen sobre 'presupuesto' de la semana pasada."

---

## Seguridad y Privacidad

- **Tokens Locales**: Tus tokens de acceso se guardan en tu máquina y nunca se envían a servidores de terceros (excepto a Google para la validación).
- **Mínimo Privilegio**: El agente solo solicita permisos para leer y redactar borradores. No tiene permiso para "Borrar permanentemente" correos a menos que se configure explícitamente.
