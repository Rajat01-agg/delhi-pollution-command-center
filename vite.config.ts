import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Custom Vite plugin to proxy Google Air Quality API requests.
 * This keeps the API key secure on the server side.
 */
function googleAirQualityProxy(apiKey: string): Plugin {
  return {
    name: 'google-air-quality-proxy',
    configureServer(server) {
      server.middlewares.use('/api/airquality', async (req, res) => {
        // Only handle POST requests
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        // Read request body
        let body = '';
        for await (const chunk of req) {
          body += chunk;
        }

        try {
          const { lat, lon } = JSON.parse(body);

          if (typeof lat !== 'number' || typeof lon !== 'number') {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid lat/lon parameters' }));
            return;
          }

          // Check if API key is configured
          if (!apiKey) {
            res.statusCode = 503;
            res.end(JSON.stringify({ error: 'Google API key not configured' }));
            return;
          }

          // Call Google Air Quality API
          const googleUrl = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
          const googleResponse = await fetch(googleUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              location: {
                latitude: lat,
                longitude: lon,
              },
            }),
          });

          if (!googleResponse.ok) {
            const errorText = await googleResponse.text();
            console.error(`Google API error ${googleResponse.status}: ${errorText}`);
            res.statusCode = googleResponse.status;
            res.end(JSON.stringify({ 
              error: 'Google API request failed',
              status: googleResponse.status,
            }));
            return;
          }

          const data = await googleResponse.json();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));

        } catch (error) {
          console.error('Proxy error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal proxy error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        googleAirQualityProxy(env.GOOGLE_AIR_QUALITY_API_KEY || ''),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
