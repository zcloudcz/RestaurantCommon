export interface CareerView {
  active: number;
  money: number;
  income: number;
  branches: Array<{
    index: number;
    level: number;
    owned: boolean;
    cost: number;
    available: boolean;
  }>;
}
const mapArt = [
  '<path d="M0 74H360M70 0V130M240 0V130" stroke="#fdf5d9" stroke-width="19"/><g fill="#a9bb91"><rect x="10" y="12" width="42" height="42" rx="7"/><rect x="93" y="9" width="68" height="46" rx="7"/><rect x="181" y="18" width="37" height="35" rx="7"/><rect x="265" y="14" width="78" height="38" rx="7"/><rect x="94" y="95" width="123" height="29" rx="7"/></g>',
  '<path d="M0 110Q80 28 160 77T360 26" fill="none" stroke="#8cc6bf" stroke-width="27"/><path d="M20 13 100 35 128 9 200 25 247 10 340 50 300 110 210 116 165 91 88 124 23 93Z" fill="none" stroke="#86a17a" stroke-width="2" stroke-dasharray="5 5"/><path d="M38 95Q160 4 322 95" fill="none" stroke="#fbf2d6" stroke-width="8"/>',
  '<g fill="#91b095"><path d="M15 22 63 11 110 33 88 61 71 68 58 114 39 80 32 52Z"/><path d="M149 17 174 11 204 28 245 18 320 34 344 67 294 84 259 64 214 75 194 115 166 92 169 55 142 45Z"/><path d="M292 103 321 98 337 120 299 124Z"/></g><path d="M54 46Q177-15 285 53M54 46Q138 129 185 71M185 71Q248 9 285 53" fill="none" stroke="#fff5d7" stroke-width="3" stroke-dasharray="5 5"/>',
];
const tiers = ["City", "Country", "World"];
export function renderEmpire(
  view: CareerView,
  tr: (key: string) => string,
  fmt: (n: number) => string,
): string {
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const t = (key: string) => escape(tr(key));
  const n = (value: number) => escape(fmt(value));
  return `<div class="empire"><p class="empire-intro">${t("New branches start from zero.")} ${t("Finished branches keep earning after wages.")}</p><div class="empire-finances"><div><span>${t("Shared wallet")}</span><strong>${n(view.money)} $</strong></div><div><span>${t("Net passive income")}</span><strong>${n(view.income * 60)} $ / ${t("min")}</strong></div></div>${tiers
    .map(
      (tier, tierIndex) =>
        `<section class="empire-region empire-region-${tierIndex}"><div class="empire-region-title"><h3>${t(tier)}</h3><span>${view.branches.filter((b) => b.owned && Math.floor(b.index / 3) === tierIndex).length} / 3</span></div><div class="empire-map" aria-hidden="true"><svg viewBox="0 0 360 130" preserveAspectRatio="none">${mapArt[tierIndex]}</svg>${view.branches
          .filter((b) => Math.floor(b.index / 3) === tierIndex)
          .map(
            (b, i) =>
              `<div class="empire-pin ${b.owned ? "owned" : ""} ${b.index === view.active ? "current" : ""}" style="left:${[17, 49, 81][i]}%;top:${[35, 58, 31][i]}%"><span>⌂</span><b>${b.index + 1}</b></div>`,
          )
          .join("")}</div><div class="empire-branches">${view.branches
          .filter((b) => Math.floor(b.index / 3) === tierIndex)
          .map((b) => {
            const current = b.index === view.active;
            const canOpen = b.available && view.money >= b.cost;
            return `<article class="empire-branch ${current ? "current" : b.owned ? "owned" : canOpen ? "fundable" : "locked"}"><div class="empire-branch-heading"><strong>${t("Branch")} ${b.index + 1}</strong><span>${b.owned ? `${t("Level")} ${b.level}/18` : t("Opening cost")}</span></div><div class="empire-branch-progress" aria-hidden="true"><i style="width:${Math.min(100, Math.max(0, (b.level / 18) * 100))}%"></i></div>${b.owned ? "" : `<strong class="empire-cost">${n(b.cost)} $</strong>`}<button data-travel="${b.index}" ${current || (!b.owned && !canOpen) ? "disabled" : ""}>${current ? t("Here") : b.owned ? t("Visit") : canOpen ? t("Open branch") : b.available ? t("Not enough funds") : t("Locked")}</button>${!b.owned && !b.available ? `<small>${t("Complete the previous branch")}</small>` : ""}</article>`;
          })
          .join("")}</div></section>`,
    )
    .join("")}</div>`;
}
