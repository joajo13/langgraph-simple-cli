# Gmail Integration Specification

## Overview
This document outlines the technical specification for integrating Gmail into the LangGraph agent. The goal is to allow individual users to link their personal Google accounts, enabling the agent to read and draft emails on their behalf.

## Prerequisites & Setup
Before implementing the code, you must set up a project in the Google Cloud Console.

### 1. Google Cloud Project
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., `langgraph-agent-gmail`).
3.  Select the project.

### 2. Enable Gmail API
1.  In the sidebar, go to **APIs & Services** > **Library**.
2.  Search for **Gmail API**.
3.  Click **Enable**.

### 3. Configure OAuth Consent Screen
Since this app will access user data, you need to configure the consent screen.
1.  Go to **APIs & Services** > **OAuth consent screen**.
2.  Choose **External** (unless you are in a G-Suite organization and only strictly internal users need access).
3.  Fill in the required fields:
    *   **App Name**: LangGraph Agent
    *   **User Support Email**: Your email
    *   **Developer Contact Information**: Your email
4.  **Scopes**: Click "Add or Remove Scopes" and add:
    *   `.../auth/gmail.readonly`
    *   `.../auth/gmail.compose`
    *   `.../auth/gmail.send`
    *   `.../auth/gmail.modify`
5.  **Test Users**: Add your own email address to the list of test users. *This is crucial while the app is in "Testing" mode.*

### 4. Create Credentials
1.  Go to **APIs & Services** > **Credentials**.
2.  Click **Create Credentials** > **OAuth client ID**.
3.  **Application Type**:
    *   If this is purely CLI/Script: Choose **Desktop app**.
    *   If there is a web UI: Choose **Web application**.
4.  Name it (e.g., `Desktop Client`).
5.  **Authorized redirect URIs** (Crucial Step):
    *   Click **Add URI**.
    *   Enter: `http://localhost:3000/oauth2callback`
    *   *Note: Even though we are running a CLI, the library and Google flow often default to a localhost server to capture the code cleanly.*
6.  Click **Create**.
7.  **Download the JSON file** or copy the **Client ID** and **Client Secret**.
    *   Save these securely; you will need them for the environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

## User Experience (UX) Flow
1.  **Initiation**: User runs a command (e.g., `/auth gmail`) or the agent requests permission when a mail-related task is detected.
2.  **Authorization**: The system generates a Google OAuth 2.0 consent URL.
3.  **Consent**: User clicks the URL, logs in to Google, and authorizes the requested scopes.
4.  **Token Exchange**: The user receives a code (or the app captures the redirect if a web server is involved) and pastes it back/app verifies it.
5.  **Usage**: The agent can now use Gmail tools authenticated as that user.

## Technical Architecture

### 1. Authentication: 3-Legged OAuth 2.0
Since we need to access *users'* data, we must use 3-legged OAuth, not a Service Account.

*   **Platform**: Google Cloud Console
*   **Credentials Needed**: `Client ID` and `Client Secret` (configured as a Desktop App or Web App depending on deployment).
*   **Scopes**:
    *   `https://www.googleapis.com/auth/gmail.readonly` (Read emails)
    *   `https://www.googleapis.com/auth/gmail.compose` (Draft emails)
    *   `https://www.googleapis.com/auth/gmail.send` (Send emails - handle with caution)
    *   `https://www.googleapis.com/auth/gmail.modify` (Archive/Trash)

### 2. Dependencies
To implement this, we will use the official LangChain community integrations.

*   `googleapis`: Core Google SDK.
*   `@langchain/community`: Contains `GmailToolkit`.
*   `@langchain/core`: Core interfaces.

### 3. Implementation Strategy

#### A. Token Management for CLI
For a CLI/Desktop context:
1.  The app tries to read a stored `tokens.json`.
2.  If missing/expired, generate an Auth URL using `google.auth.OAuth2`.
3.  Prompt user to visit URL and paste the authorization code.
4.  Exchange code for Tokens (Access + Refresh).
5.  Store Refresh Token securely.

#### B. Tool Integration
We will wrap the `GmailToolkit` into our Agent's toolset.

```typescript
import { GmailToolkit } from "@langchain/community/tools/gmail";
import { google } from "googleapis";

// 1. Setup Auth
const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
auth.setCredentials({ access_token, refresh_token });

// 2. Initialize Toolkit
const toolkit = new GmailToolkit({ auth });
const tools = toolkit.getTools();
// Tools include: GmailGetMessage, GmailSearch, GmailSendMessage, etc.
```

### 4. Component Changes

#### `src/config/index.ts`
*   Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to environment validation.

#### `src/tools/index.ts`
*   Add logic to initialize `GmailToolkit`.
*   *Note*: Since tools need user-specific tokens, tool initialization might need to happen dynamically per request or load from a persistent user session storage.

#### `src/nodes/auth_node.ts` (Potential New Node)
*   A node dedicated to handling the "I need to login" state if a tool throws an authentication error.

## Security Considerations
*   **Token Storage**: Tokens should be stored securely (e.g., encrypted local file or secure database).
*   **Least Privilege**: Only request scopes necessary for the specific tasks (e.g., if only reading is needed, don't ask for send).
*   **App Verification**: The Google Cloud project will need to pass basic verification if used by external users, or be in "Testing" mode for internal dev.
