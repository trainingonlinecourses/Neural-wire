/**
 * Model-name detection rules. Covers every frontier lab (OpenAI, Anthropic,
 * Google, Meta, xAI, Mistral, Cohere, NVIDIA, IBM, Amazon, Microsoft) and the
 * full Chinese ecosystem (DeepSeek, Alibaba/Qwen, Zhipu/GLM, Moonshot/Kimi,
 * MiniMax, Baichuan, 01.AI/Yi, InternLM, Baidu/ERNIE, Tencent/Hunyuan,
 * StepFun, iFlytek/Spark, ByteDance/Doubao, Kunlun/Skywork). Order matters:
 * more specific patterns (QwQ before Qwen) must come first.
 */
export const MODEL_TERMS: [string, RegExp][] = [
  // OpenAI
  ['GPT-5', /\bGPT-?5[\w.-]*\b/i],
  ['GPT-4.1', /\bGPT-?4\.1[\w.-]*\b/i],
  ['GPT-4', /\bGPT-?4(?!\.\d)[\w.-]*\b/i],
  ['ChatGPT', /\bChatGPT\b/i],
  ['o1', /\bo1\b/i],
  ['o3', /\bo3\b/i],
  ['o4', /\bo4\b/i],
  // Anthropic
  ['Claude', /\bClaude\b/i],
  // Google
  ['Gemini', /\bGemini\b/i],
  ['Gemma', /\bGemma\b/i],
  ['Veo', /\bVeo\b/i],
  ['Imagen', /\bImagen\b/i],
  // Meta
  ['Llama', /\bLlama\s?\d?/i],
  // xAI
  ['Grok', /\bGrok\b/i],
  // Mistral
  ['Mistral', /\bMistral\b/i],
  ['Codestral', /\bCodestral\b/i],
  ['Mathstral', /\bMathstral\b/i],
  // Cohere
  ['Command A', /\bCommand\s?A\b/i],
  ['Command R', /\bCommand\s?R[+]?\b/i],
  ['Cohere', /\bCohere\b/i],
  // NVIDIA / IBM / Amazon / Microsoft
  ['Nemotron', /\bNemotron\b/i],
  ['Granite', /\bGranite\b/i],
  ['Nova', /\bNova[ -]?(Pro|Lite|Premier|Micro)\b/i],
  ['Phi', /\bPhi-?\d\b/i],
  ['MAI', /\bMAI-?1\b/i],
  // Chinese labs
  ['DeepSeek', /\bDeepSeek\b/i],
  ['QwQ', /\bQwQ\b/i],
  ['Qwen', /\bQwen/i],
  ['GLM', /\bGLM\b/i],
  ['Kimi', /\bKimi\b/i],
  ['MiniMax', /\bMiniMax\b/i],
  ['Baichuan', /\bBaichuan\b/i],
  ['Yi', /\bYi[- ]?(Lightning|1\.5|34B)?\b/i],
  ['InternLM', /\bInternLM/i],
  ['ERNIE', /\bERNIE\b/i],
  ['Hunyuan', /\bHunyuan\b/i],
  ['StepFun', /\bStepFun\b/i],
  ['Step', /\bStep[- ]?[1-3A]\b/i],
  ['iFlytek', /\biFlytek\b/i],
  ['Spark', /\bSpark\s?X?1\b/i],
  ['Doubao', /\bDoubao\b/i],
  ['Skywork', /\bSkywork\b/i],
  // Creative / image / video
  ['Stable Diffusion', /stable\s?diffusion/i],
  ['FLUX', /\bFLUX\b/i],
  ['Midjourney', /\bMidjourney\b/i],
  ['Sora', /\bSora\b/i],
  ['DALL·E', /DALL[-·]?E/i],
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
