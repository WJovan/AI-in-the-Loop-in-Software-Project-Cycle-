import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createRecommendationHandler } from './server/ai.js';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['ANTHROPIC_', 'OPENAI_', 'GEMINI_']);
  const handler = createRecommendationHandler({ env });
  return { plugins: [react(), {
    name: 'ai-recommendations',
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  }] };
});
