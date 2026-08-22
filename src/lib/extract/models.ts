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
  ['o1', /\bo1[- ]?(mini|preview|pro)?\b/i],
  ['o3', /\bo3[- ]?(mini|pro)?\b/i],
  ['o4', /\bo4[- ]?(mini|pro)?\b/i],
  // Anthropic
  ['Claude', /\bClaude[- ]?(Opus|Sonnet|Haiku)?[- ]?\d?\.?\d?/i],
  // Google
  ['Gemini', /\bGemini[- ]?(Pro|Ultra|Flash|Nano)?/i],
  ['Gemma', /\bGemma[- ]?\d?/i],
  ['Veo', /\bVeo[- ]?\d?/i],
  ['Imagen', /\bImagen[- ]?\d?/i],
  ['T5', /\bT5[- ]?(XXL|XL|Large|Base|Small)?/i],
  ['PaLM', /\bPaLM[- ]?\d?/i],
  // Meta
  ['Llama', /\bLl[aa]+ma[- ]?\d?\.?\d?/i],
  // xAI
  ['Grok', /\bGrok[- ]?\d?/i],
  // Mistral
  ['Mistral', /\bMistral[- ]?(Large|Small|Medium|NeMo|Pixtral|Codestral|Mathstral)?/i],
  ['Codestral', /\bCodestral\b/i],
  ['Mathstral', /\bMathstral\b/i],
  ['Mixtral', /\bMixtral[- ]?\d?[xX]?\d?[+-]?/i],
  // Cohere
  ['Command A', /\bCommand\s?A\b/i],
  ['Command R', /\bCommand\s?R[+]?\b/i],
  ['Cohere', /\bCohere\b/i],
  ['C4AI', /\bC4AI\b/i],
  // NVIDIA / IBM / Amazon / Microsoft
  ['Nemotron', /\bNemotron[- ]?\d?/i],
  ['Granite', /\bGranite[- ]?\d?/i],
  ['Nova', /\bNova[ -]?(Pro|Lite|Premier|Micro)\b/i],
  ['Phi', /\bPhi[- ]?\d[\w.-]*/i],
  ['MAI', /\bMAI-?1\b/i],
  ['Jamba', /\bJamba\b/i],
  // Chinese labs
  ['DeepSeek', /\bDeepSeek[- ]?(V\d|R\d|Coder|Math|MoE)?/i],
  ['QwQ', /\bQwQ[- ]?\d?[\w.-]*/i],
  ['Qwen', /\bQwen[- ]?\d?[\w.-]*/i],
  ['GLM', /\bGLM[- ]?\d[\w.-]*/i],
  ['Kimi', /\bKimi[- ]?\d?[\w.-]*/i],
  ['MiniMax', /\bMiniMax[- ]?(M\d|Text|01)?/i],
  ['Baichuan', /\bBaichuan[- ]?\d?/i],
  ['Yi', /\bYi[- ]?(Lightning|1\.5|34B|Large|Medium|Small|Vision)?/i],
  ['InternLM', /\bInternLM[- ]?\d?[\w.-]*/i],
  ['ERNIE', /\bERNIE[- ]?\d[\w.-]*/i],
  ['Hunyuan', /\bHunyuan[- ]?(Large|DiT|Video)?/i],
  ['StepFun', /\bStepFun\b/i],
  ['Step', /\bStep[- ]?[1-3A][\w.-]*/i],
  ['iFlytek', /\biFlytek\b/i],
  ['Spark', /\bSpark[- ]?X?\d[\w.-]*/i],
  ['Doubao', /\bDoubao\b/i],
  ['Skywork', /\bSkywork[- ]?\d?[\w.-]*/i],
  ['Yuan', /\bYuan[- ]?\d/i],
  ['BaGuan', /\bBaGuan\b/i],
  // Amazon / Apple
  ['Alexa', /\bAlexa[- ]?(LLM|TMK)?/i],
  ['Apple Intelligence', /\bApple\s+Intelligence\b/i],
  // Creative / image / video
  ['Stable Diffusion', /stable\s?diffusion[- ]?\d?/i],
  ['SDXL', /\bSDXL\b/i],
  ['SD3', /\bSD\s?3\b/i],
  ['FLUX', /\bFLUX[- ]?(\.1|Dev|Pro|Schnell)?/i],
  ['Midjourney', /\bMidjourney[- ]?(v\d|v\d\.\d)?/i],
  ['Sora', /\bSora\b/i],
  ['DALL·E', /DALL[-·]?E[- ]?\d?/i],
  ['Copilot', /\bCopilot[- ]?(Pro|Business|Enterprise)?/i],
  ['Falcon', /\bFalcon[- ]?\d?[\w.-]*/i],
  ['Manus', /\bManus\b/i],
  ['Windsurf', /\bWindsurf\b/i],
  ['Cursor', /\bCursor\b/i],
  ['Devin', /\bDevin\b/i],
  ['OpenDevin', /\bOpenDevin\b/i],
  ['SWE-agent', /\bSWE[- ]?agent\b/i],
  ['Aider', /\bAider\b/i],
];

/** Return model names detected in text, in definition order, deduped. */
export function detectModels(text: string): string[] {
  const hits: string[] = [];
  for (const [name, re] of MODEL_TERMS) {
    if (re.test(text) && hits.indexOf(name) < 0) hits.push(name);
  }
  return hits;
}
