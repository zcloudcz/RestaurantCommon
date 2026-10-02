# Restaurant empire

A career has nine independent restaurants: three city locations, three national locations and three world locations. Each new location requires the previous location to reach expansion 18 and a one-time opening investment. Every newly opened location starts at level zero with no purchased upgrades or staff. Returning to an owned location is free.

One shared cash balance lives on the active restaurant. Inactive snapshots have zero cash. Each restaurant keeps its furniture, inventory, employees, customers, upgrades and progression. Inactive branches with full automation (level 11 or higher) contribute estimated net operating income; their simulation is suspended. Wages are deducted from passive estimates. Active play retains the normal production simulation.

## Progression and travel

| Region | Branches | Opening costs ($) |
| --- | --- | --- |
| City | 1–3 | 0, 2,500, 5,000 |
| Country | 4–6 | 10,000, 18,000, 28,000 |
| World | 7–9 | 42,000, 60,000, 85,000 |

The first branch is the existing restaurant. Every later branch opens at level 0 with its own initial inventory, no purchased upgrades and no hired staff. Opening deducts its cost from the shared wallet; the remaining balance transfers to the new active branch. Finishing a branch does not erase it or award another starting balance.

The desktop “Leave restaurant” control, mobile Empire navigation and completion CTA open the same career map. Owned branches can be revisited freely. Locked branches show the previous-branch requirement; eligible branches distinguish affordable openings from insufficient funds. The map displays each branch's level, the shared balance and estimated net passive income per minute. Returning to an already completed branch does not repeat its completion dialog within the session.

## Staff and payroll

Staff grow from four people at levels 11–12 to ten at level 18. Expansions 13–18 add, in order, a server, cleaner, cook, server, cleaner and cook. Stable worker IDs distinguish multiple employees in the same role in saves and rendering.

| Role | Staff at level 18 | Wage per worker ($/minute) |
| --- | --- | --- |
| Cashier | 1 | 2 |
| Cook | 3 | 3 |
| Server | 3 | 2.5 |
| Cleaner | 3 | 1.5 |
| Total | 10 | 23 for the complete team |

Active wages accrue with simulation time and are paid from available money. The balance never becomes negative. Staff continue working when cash runs out; unpaid wages persist as `payrollDebt` and subsequent funds repay them before new purchases. `wagesPaid` tracks paid wages. The upgrades dialog shows the current payroll rate, outstanding wages and repayment rule.

Passive branch income uses the bounded net estimate rather than simulating absent customers. Payroll is already deducted from that estimate; an existing wage debt can reduce the amount credited further. The original branch-level offline caps still apply.

## Persistence decision

Keep the existing per-brand localStorage key and active-state envelope; add a versioned career payload containing inactive restaurant snapshots. This is one atomic write rather than several keys that could diverge during a failed save. Burger and Pizza careers remain separate. Existing single-restaurant saves become the first branch. Export/import includes the whole network. Unknown or malformed career data is rejected without overwriting the source.

Offline income is bounded by each branch's existing offline limit and saved immediately after load. Branch travel transfers the wallet once; returning does not grant starting capital. Purchases validate progression and funds before changing anything. The finite nine-branch limit bounds save size and background accounting. No online account, multiplayer economy, real-time simulation of inactive customers, or cross-brand shared wallet is introduced.
