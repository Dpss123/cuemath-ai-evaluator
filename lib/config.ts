// API key is set via environment variable.
// - On Vercel: set GROQ_API_KEY in the Vercel dashboard
// - Local dev: set GROQ_API_KEY in .env.local
export const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
