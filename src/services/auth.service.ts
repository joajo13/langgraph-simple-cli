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
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end('<h1>Autenticación exitosa</h1><p>Puedes cerrar esta ventana y volver a la terminal.</p><script>window.close()</script>');
              
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
          logger.error('Error in local auth server', e);
          res.writeHead(500);
          res.end('Error interno');
          server.close();
          resolve(false);
        }
      });

      // 3. Listen
      server.listen(port, () => {
        const authUrl = this.getAuthUrl();
        console.log('Abriendo navegador para autenticación...');
        console.log('Si no se abre automáticamente, visita:', authUrl);
        
        // 4. Open Browser (Native)
        const startCommand = process.platform === 'win32' ? 'start' : 
                             process.platform === 'darwin' ? 'open' : 'xdg-open';
        
        exec(`${startCommand} "${authUrl.replace(/"/g, '\\"')}"`, (err) => {
            if (err) {
                console.error('No se pudo abrir el navegador automáticamente:', err.message);
            }
        });
      });
      
      server.on('error', (e) => {
          logger.error('Error starting local server', e);
          resolve(false);
      });
    });
  }
}
