import { AuthService } from './src/services/auth.service';
import { loadConfig } from './src/config';
import fs from 'fs';
import path from 'path';

async function checkAuth() {
  const config = loadConfig();
  console.log('--- Config Check ---');
  console.log('Client ID set:', !!config.googleClientId);
  console.log('Client Secret set:', !!config.googleClientSecret);

  const tokenPath = path.join(process.cwd(), '.token.json');
  console.log('--- Token File Check ---');
  if (fs.existsSync(tokenPath)) {
      console.log('Token file exists at:', tokenPath);
      const content = fs.readFileSync(tokenPath, 'utf-8');
      console.log('Token file content length:', content.length);
  } else {
      console.log('Token file MISSING at:', tokenPath);
  }

  console.log('--- AuthService Check ---');
  const authService = new AuthService(config);
  const client = authService.getAuthenticatedClient();
  
  if (client) {
      console.log('AuthService: Authenticated ✅');
      try {
          // Try to get token info or refresh
          const { token } = await client.getAccessToken();
          console.log('Access Token retrieved successfully.');
      } catch (e) {
          console.error('Error retrieving access token:', e);
      }
  } else {
      console.log('AuthService: Not Authenticated ❌');
  }
}

checkAuth();
