// Shared, framework-agnostic role/pricing config. No server-only imports
// here (no next/headers etc) so this can be imported from both API routes
// and "use client" components without pulling in server-only code.

export const ROLES = ["fullup", "reseller", "pt", "owner"];

export const ROLE_LABEL = {
  fullup: "Fullup",
  reseller: "Reseller",
  pt: "Partner (PT)",
  owner: "Owner"
};

// Every upgrade path a role can buy, in order. fullup can go straight to
// reseller OR skip straight to pt; reseller can only go to pt.
export const UPGRADE_PATHS = {
  fullup: [
    { to: "reseller", price: 90000 },
    { to: "pt", price: 200000 }
  ],
  reseller: [{ to: "pt", price: 390000 }]
};

export function formatRupiah(n) {
  return `Rp${Number(n || 0).toLocaleString("id-ID")}`;
}
