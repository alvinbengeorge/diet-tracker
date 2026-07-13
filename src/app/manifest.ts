import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FitAI - Diet & Workout Game Tracker',
    short_name: 'FitAI',
    description: 'Gamify your fitness journey. Track calories, log macros, and scan food photos using Gemini AI.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#020617', // slate-950
    theme_color: '#ef4444',      // red-500
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
