import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { exec } from 'child_process';
import { logger } from '../logger';
import { Config } from '../config/schema';

const TOKEN_PATH = path.join(process.cwd(), '.token.json');

export class AuthService {
  private oauth2Client: OAuth2Client;
  private scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar',
  ];

  constructor(private config: Config) {
    if (!config.googleClientId || !config.googleClientSecret) {
      console.log('[AuthService] Missing Google Client ID or Secret in config!');
      logger.warn('Google Client ID/Secret not configured. Gmail integration disabled.');
      // Initialize with dummy values to prevent crash, check later
      this.oauth2Client = new google.auth.OAuth2(
        'dummy',
        'dummy',
        config.gmailRedirectUri
      );
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.gmailRedirectUri
    );
  }

  public getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent', // Force to get refresh token
    });
  }

  public async getTokensFromCode(code: string): Promise<boolean> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      this.saveTokens(tokens);
      logger.info('Successfully authenticated with Google.');
      return true;
    } catch (error) {
      logger.error('Error retrieving access token', error);
      return false;
    }
  }

  public loadTokens(): boolean {
    try {
        if (fs.existsSync(TOKEN_PATH)) {
            const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
            this.oauth2Client.setCredentials(tokens);
            logger.info('Loaded Google tokens from storage.');
            return true;
        }
    } catch (error) {
        logger.error('Error loading tokens', error);
    }
    return false;
  }

  private saveTokens(tokens: any) {
    try {
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      logger.info('Tokens stored to ' + TOKEN_PATH);
    } catch (error) {
      logger.error('Error saving tokens', error);
    }
  }

  public getAuthenticatedClient(): OAuth2Client | null {
    // Check if we have credentials set
    if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.access_token) {
        // Try to load
        if (!this.loadTokens()) {
            return null;
        }
    }
    return this.oauth2Client;
  }

  public isAuthenticated(): boolean {
      return !!this.getAuthenticatedClient();
  }

  public async loginWithLocalServer(): Promise<boolean> {
    return new Promise((resolve) => {
      // 1. Parse port from redirect URI
      let port = 3000;
      try {
        const url = new URL(this.config.gmailRedirectUri);
        if (url.port) port = parseInt(url.port, 10);
      } catch (e) {
        logger.warn('Invalid redirect URI in config, defaulting to port 3000');
      }

      // 2. Create Server
      const server = http.createServer(async (req, res) => {
        try {
          if (req.url?.startsWith('/oauth2callback')) {
            const urlParams = new URL(req.url, `http://localhost:${port}`);
            const code = urlParams.searchParams.get('code');

            if (code) {
              const html = `
              <!DOCTYPE html>
              <html lang="es">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Autenticación Exitosa - Simple CLI</title>
                  <style>
                      :root {
                          --primary: #4285F4;
                          --success: #34A853;
                          --bg: #f8f9fa;
                          --text: #202124;
                      }
                      body {
                          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                          background-color: var(--bg);
                          color: var(--text);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          height: 100vh;
                          margin: 0;
                          -webkit-font-smoothing: antialiased;
                      }
                      .card {
                          background: white;
                          padding: 40px;
                          border-radius: 12px;
                          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                          text-align: center;
                          max-width: 400px;
                          width: 90%;
                          animation: fadeIn 0.5s ease-out;
                      }
                      @keyframes fadeIn {
                          from { opacity: 0; transform: translateY(10px); }
                          to { opacity: 1; transform: translateY(0); }
                      }
                      .icon {
                          width: 64px;
                          height: 64px;
                          background: var(--success);
                          color: white;
                          border-radius: 50%;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 32px;
                          margin: 0 auto 24px;
                      }
                      h1 { font-size: 24px; margin: 0 0 12px; font-weight: 500; }
                      p { color: #5f6368; line-height: 1.5; margin: 0 0 24px; }
                      .close-hint { font-size: 13px; color: #9aa0a6; }
                  </style>
              </head>
              <body>
                  <div class="card">
                      <div class="icon">✓</div>
                      <h1>¡Autenticación completada!</h1>
                      <p>Has vinculado correctamente tu cuenta de Google con <strong>Simple CLI</strong>.</p>
                      <p class="close-hint">Ya puedes cerrar esta ventana de forma segura y volver a tu terminal.</p>
                  </div>
                  <script>
                      // Intentar cerrar la ventana automáticamente tras 3 segundos
                      setTimeout(() => {
                          window.close();
                      }, 3000);
                  </script>
              </body>
              </html>
              `;
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(html);
              
              const success = await this.getTokensFromCode(code);
              server.close();
              resolve(success);
            } else {
              res.writeHead(400);
              res.end('No code found');
              server.close();
              resolve(false);
            }
          } else {
             res.writeHead(404);
             res.end('Not found');
          }
        } catch (e) {
          const errorHtml = `
          <!DOCTYPE html>
          <html lang="es">
          <head>
              <meta charset="UTF-8">
              <style>
                  body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff5f5; }
                  .card { padding: 40px; border-radius: 12px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; border-top: 5px solid #e53e3e; }
                  h1 { color: #c53030; margin-top: 0; }
              </style>
          </head>
          <body>
              <div class="card">
                  <h1>Error de Autenticación</h1>
                  <p>Hubo un problema al intentar autenticar tu cuenta.</p>
                  <p>Por favor, inténtalo de nuevo en la terminal.</p>
              </div>
          </body>
          </html>
          `;
          res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(errorHtml);
          server.close();
          resolve(false);
        }
      });

      // 3. Listen
      server.listen(port, () => {
        const authUrl = this.getAuthUrl();
        console.log('\n' + '='.repeat(60));
        console.log(' AUTENTICACIÓN DE GOOGLE REQUERIDA');
        console.log('='.repeat(60));
        console.log('Intentando abrir el navegador automáticamente...');
        console.log('Si no se abre, por favor visita este enlace:');
        console.log('\n' + authUrl + '\n');
        console.log('='.repeat(60) + '\n');
        
        if (process.platform === 'win32') {
          // Windows requires a title as the first argument if quotes are used
          exec(`start "" "${authUrl.replace(/"/g, '\\"')}"`, (err) => {
              if (err) {
                  console.error('No se pudo abrir el navegador automáticamente:', err.message);
              }
          });
        } else {
          const startCommand = process.platform === 'darwin' ? 'open' : 'xdg-open';
          exec(`${startCommand} "${authUrl.replace(/"/g, '\\"')}"`, (err) => {
              if (err) {
                  console.error('No se pudo abrir el navegador automáticamente:', err.message);
              }
          });
        }
      });
      
      server.on('error', (e) => {
          logger.error('Error starting local server', e);
          resolve(false);
      });
    });
  }
}
