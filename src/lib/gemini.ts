import { GoogleGenAI } from '@google/genai';

interface GenerateOptions {
  apiKey: string;
  contents: any;
  config?: any;
}

/**
 * Generates content using Gemini models with automatic fallback and exponential backoff retry.
 * Handles rate limits (429) and transient errors (500, 503) correctly.
 */
export async function generateContentWithFallback({
  apiKey,
  contents,
  config,
}: GenerateOptions) {
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash'
  ];
  const maxRetries = 3;
  const initialDelay = 1000; // 1 second

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Attempting generation with model: ${model}, attempt ${attempt}`);
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const status = error.status || (error.response && error.response.status);
        const errorMessage = error.message || '';

        // Check for Rate Limit (429) or temporary server errors (500, 503)
        const isRateLimit = status === 429 || errorMessage.includes('429') || errorMessage.includes('ResourceExhausted') || errorMessage.includes('Quota');
        const isTransient = status === 503 || status === 500 || errorMessage.includes('503') || errorMessage.includes('500');

        if ((isRateLimit || isTransient) && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          console.warn(`[Gemini API] Rate limit or transient error (${status || 'unknown'}). Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        console.warn(`[Gemini API] Model ${model} failed: ${errorMessage}.`);
        break; // break to try the next model
      }
    }
  }

  throw lastError || new Error('All Gemini model generation attempts failed.');
}
