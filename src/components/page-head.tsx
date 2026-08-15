/**
 * Unified page header — every desk page opens with the same eyebrow / title /
 * description block so the whole site reads as one professional product.
 */
export function PageHead({
  kicker,
  title,
  desc,
  index,
}: {
  /** Small eyebrow line above the title, e.g. "📈 Unified ranking". */
  kicker: string;
  title: string;
  desc: string;
  /** Optional page number shown on the right of the eyebrow, e.g. "P.03". */
  index?: string;
}) {
  return (
    <div className="page-head">
      <div className="ph-eyebrow">
        <span className="ph-kicker">{kicker}</span>
        {index && <span className="ph-index">P.{index}</span>}
      </div>
      <h2 className="ph-title">{title}</h2>
      <p className="ph-desc">{desc}</p>
    </div>
  );
}
