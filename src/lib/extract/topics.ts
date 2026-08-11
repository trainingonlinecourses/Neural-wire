/** Topic tagging rules. Ported verbatim from index.html `TOPIC_RULES`. */
export const TOPIC_RULES: [string, RegExp][] = [
  ['FUNDING', /\b(funding|raise[sd]?|series\s?[a-c]|invest\w*|valuation|acqui\w*|merger|ipo)\b/i],
  ['REGULATION', /\b(regulat\w*|lawsuit|court|ban\b|bans\b|policy|compliance|executive order|senate|congress|eu ai act|antitrust|lawmakers?)\b/i],
  ['RESEARCH', /\b(paper|research|benchmark|state[- ]of[- ]the[- ]art|study|arxiv|evaluat\w*|dataset|training run|breakthrough)\b/i],
  ['HARDWARE', /\b(chips?|gpus?|tpus?|data\s?centers?|cluster|robot\w*|hardware|silicon|wafer)\b/i],
  ['SECURITY', /\b(security|hack\w*|breach|vulnerab\w*|cyber\w*|jailbreak|safety|alignment|exploit)\b/i],
  ['OPEN SOURCE', /\b(open[- ]source|open weights|hugging ?face|apache|mit license|community model)\b/i],
  ['PRODUCT', /\b(launch\w*|releas\w*|availab\w*|rolls out|ships|new feature|api\b|app\b|plugin|integration)\b/i],
  ['PARTNERSHIP', /\b(partner\w*|deal\b|collaborat\w*|agreement|alliance|teams up)\b/i],
];

/** Return topic tags detected in text, in rule order, deduped. */
export function detectTopics(text: string): string[] {
  const hits: string[] = [];
  for (const [name, re] of TOPIC_RULES) {
    if (re.test(text) && hits.indexOf(name) < 0) hits.push(name);
  }
  return hits;
}
