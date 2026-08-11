/** Model-name detection rules. Ported verbatim from index.html `MODEL_TERMS`. */
export const MODEL_TERMS: [string, RegExp][] = [
  ['GPT-5', /\bGPT-?5\b/i],
  ['GPT-4', /\bGPT-?4[\w.-]*\b/i],
  ['ChatGPT', /\bChatGPT\b/i],
  ['o3', /\bo3\b/i],
  ['o4', /\bo4\b/i],
  ['Claude', /\bClaude\b/i],
  ['Gemini', /\bGemini\b/i],
  ['DeepSeek', /\bDeepSeek\b/i],
  ['Qwen', /\bQwen\b/i],
  ['Llama', /\bLlama\s?\d?/i],
  ['Grok', /\bGrok\b/i],
  ['Mistral', /\bMistral\b/i],
  ['Gemma', /\bGemma\b/i],
  ['Phi', /\bPhi-?\d\b/i],
  ['Stable Diffusion', /stable\s?diffusion/i],
  ['FLUX', /\bFLUX\b/i],
  ['Midjourney', /\bMidjourney\b/i],
  ['Sora', /\bSora\b/i],
  ['Veo', /\bVeo\b/i],
  ['DALL·E', /DALL[-·]?E/i],
  ['Imagen', /\bImagen\b/i],
  ['Copilot', /\bCopilot\b/i],
  ['Falcon', /\bFalcon\b/i],
  ['Manus', /\bManus\b/i],
];

/** Return model names detected in text, in definition order, deduped. */
export function detectModels(text: string): string[] {
  const hits: string[] = [];
  for (const [name, re] of MODEL_TERMS) {
    if (re.test(text) && hits.indexOf(name) < 0) hits.push(name);
  }
  return hits;
}
