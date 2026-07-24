"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import UpgradeModal from "@/components/UpgradeModal";
import TrxHistoryModal from "@/components/TrxHistoryModal";
import Sidebar from "@/components/Sidebar";
import RunningText from "@/components/RunningText";
import MusikVideoPlayer from "@/components/MusikVideoPlayer";
import { ROLE_LABEL, UPGRADE_PATHS } from "@/lib/roles";
import { FLASH_MESSAGE_MS, BELL_NOTIF_POLL_MS } from "@/lib/timings";

const DEFAULT_LOGO_URL =
  "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260721_052745_975_ag5sddnb.jpg";
const CREATE_ROLE_OPTIONS = { pt: ["fullup", "reseller"], owner: ["fullup", "reseller", "pt"] };
const NOTIF_SEEN_KEY = "alip_notif_last_seen";

export default function DashboardShell({ expectedRole }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [numbers, setNumbers] = useState([]);
  const [numberInput, setNumberInput] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({ username: "", password: "", role: "" });
  const [upgradeUsername, setUpgradeUsername] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingNotice, setPendingNotice] = useState(null);
  const [checkingTx, setCheckingTx] = useState(false);
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_URL);
  const [runningText, setRunningText] = useState("");
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/session");
      const data = await res.json();
      if (!data.authenticated || data.status !== "approved") {
        router.push("/");
        return;
      }
      if (data.role !== expectedRole) {
        router.push(`/dashboard/${data.role}`);
        return;
      }
      setSession(data);
      if (data.role === "pt" || data.role === "owner") loadAccounts();
    })();
  }, [expectedRole, router]);

  useEffect(() => {
    if (!session) return;
    if (["fullup", "reseller", "pt"].includes(session.role)) loadPendingNotice();
  }, [session]);

  useEffect(() => {
    fetch("/api/site-config")
      .then((r) => r.json())
      .then((d) => {
        if (d.logoUrl) setLogoUrl(d.logoUrl);
        setRunningText(d.runningText || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!session) return;

    function loadNotifs() {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => {
          const list = d.notifications || [];
          setNotifications(list);
          const lastSeen = Number(localStorage.getItem(NOTIF_SEEN_KEY) || 0);
          const unread = list.filter((n) => n.createdAt > lastSeen).length;
          setUnreadNotifCount(unread);
        })
        .catch(() => {});
    }

    loadNotifs();
    const poll = setInterval(loadNotifs, BELL_NOTIF_POLL_MS);
    return () => clearInterval(poll);
  }, [session]);

  function markNotifsSeen() {
    localStorage.setItem(NOTIF_SEEN_KEY, String(Date.now()));
    setUnreadNotifCount(0);
  }

  async function loadPendingNotice() {
    const res = await fetch("/api/payment/pending");
    const data = await res.json();
    if (res.ok && data.pending) setPendingNotice(data);
  }

  async function checkPendingTx() {
    if (!pendingNotice) return;
    setCheckingTx(true);
    try {
      const res = await fetch(`/api/payment/status?invoice_id=${pendingNotice.invoice.invoice_id}`);
      const data = await res.json();
      if (data.status === "paid") {
        router.push(`/struk?invoice_id=${pendingNotice.invoice.invoice_id}`);
        return;
      }
      if (data.status === "queued") {
        flash(`Kamu ada di antrian${data.queueNumber != null ? ` #${data.queueNumber}` : ""}, tunggu admin memproses.`, "err");
        return;
      }
      if (data.status === "rejected") {
        flash("Bukti pembayaran ditolak, buka transaksi untuk upload ulang/banding.", "err");
        return;
      }
      if (data.status === "awaiting_review") {
        flash("Bukti pembayaran sedang direview admin.", "err");
        return;
      }
      flash("Belum ada bukti pembayaran yang dikirim.", "err");
    } finally {
      setCheckingTx(false);
    }
  }

  async function loadAccounts() {
    const res = await fetch("/api/roles/list");
    const data = await res.json();
    if (res.ok) setAccounts(data.accounts);
  }

  async function loadInvoices() {
    setInvoicesLoading(true);
    try {
      const res = await fetch("/api/payment/history");
      const data = await res.json();
      if (res.ok) setInvoices(data.invoices);
    } finally {
      setInvoicesLoading(false);
    }
  }

  function openHistory() {
    setHistoryOpen(true);
    loadInvoices();
    markNotifsSeen();
  }

  function openUpgrade(target) {
    setUpgradeTarget(target);
    setModalOpen(true);
  }

  function flash(text, type = "ok") {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), FLASH_MESSAGE_MS);
  }

  async function addNumber(e) {
    e.preventDefault();
    const res = await fetch("/api/numbers/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: numberInput })
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error, "err");
    setNumbers(data.numbers);
    setNumberInput("");
    flash("Nomor ditambahkan.");
  }

  async function deleteNumber(n) {
    const res = await fetch("/api/numbers/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: n })
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error, "err");
    setNumbers(data.numbers);
    flash("Nomor dihapus.");
  }

  async function createAccount(e) {
    e.preventDefault();
    const res = await fetch("/api/roles/create-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAccount)
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error, "err");
    setNewAccount({ username: "", password: "", role: "" });
    flash("Akun dibuat.");
    loadAccounts();
  }

  async function revokeAccount(userId) {
    const res = await fetch("/api/roles/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error, "err");
    flash("Akses dicabut.");
    loadAccounts();
  }

  async function upgradeToPt(e) {
    e.preventDefault();
    const res = await fetch("/api/roles/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: upgradeUsername })
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error, "err");
    setUpgradeUsername("");
    flash(`${upgradeUsername} berhasil dinaikkan ke PT.`);
    loadAccounts();
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  if (!session) {
    return <main className="min-h-screen flex items-center justify-center text-muted">Memuat…</main>;
  }

  const canManageNumbers = ["fullup", "reseller", "pt", "owner"].includes(session.role);
  const canCreateAccounts = CREATE_ROLE_OPTIONS[session.role];
  const upgradePaths = UPGRADE_PATHS[session.role] || [];
  const bellCount = unreadNotifCount + (pendingNotice ? 1 : 0);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto">
      <header className="dash-in flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Sidebar
            session={session}
            logoUrl={logoUrl}
            onLogout={logout}
            upgradePaths={upgradePaths}
            onUpgrade={openUpgrade}
          />
          <img
            src={logoUrl}
            alt="Logo"
            className="w-10 h-10 rounded-md object-cover border border-line shrink-0"
          />
          <div className="min-w-0">
            <div className="badge text-accent2 border-accent2/30 inline-block mb-1">
              {ROLE_LABEL[session.role]}
            </div>
            <h1 className="display text-xl font-bold text-white truncate">Halo, {session.username}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="btn-ghost text-sm relative px-3"
            onClick={openHistory}
            aria-label="Riwayat transaksi & notifikasi"
            title="Riwayat transaksi & notifikasi"
          >
            🔔
            {bellCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                {bellCount > 9 ? "9+" : bellCount}
              </span>
            )}
          </button>
          <button className="btn-ghost text-sm" onClick={logout}>Keluar</button>
        </div>
      </header>

      <RunningText text={runningText} />

      <div className="dash-in mb-4" style={{ animationDelay: "40ms" }}>
        <img
          src="https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260723_085528_141_ovm7tld2.jpg"
          alt=""
          loading="lazy"
          className="w-full rounded-sm border border-white/10"
        />
      </div>

      <div className="dash-in" style={{ animationDelay: "60ms" }}>
        <AdBanner
          role={session.role}
          onUpgradeClick={() => openUpgrade(upgradePaths[0] || null)}
        />
      </div>

      <div className="dash-in mb-6" style={{ animationDelay: "90ms" }}>
        <MusikVideoPlayer />
      </div>

      {pendingNotice && (
        <div className="dash-in card p-4 mb-6 border-warn/30 hover-lift" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">⏳</span>
            <div>
              <p className="text-sm text-white font-semibold">
                {pendingNotice.status === "awaiting_review" && "Bukti pembayaran sedang direview admin"}
                {pendingNotice.status === "queued" &&
                  `Kamu di antrian${pendingNotice.queueNumber != null ? ` #${pendingNotice.queueNumber}` : ""}`}
                {pendingNotice.status === "rejected" && "Bukti pembayaran ditolak — perlu diupload ulang"}
                {(!pendingNotice.status || pendingNotice.status === "pending") && "Ada transaksi menunggu pembayaran"}
              </p>
              <p className="text-xs text-muted mono">
                INV {pendingNotice.invoice.invoice_id} · Rp
                {pendingNotice.invoice.total.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              className="btn-primary text-sm py-2"
              onClick={() => openUpgrade({ to: pendingNotice.targetRole, price: pendingNotice.invoice.total })}
            >
              Masuk ke halaman transaksi
            </button>
            <button className="btn-ghost text-sm py-2" onClick={checkPendingTx} disabled={checkingTx}>
              {checkingTx ? "Mengecek…" : "Cek transaksi"}
            </button>
          </div>
        </div>
      )}

      {msg.text && (
        <div
          className={`text-sm rounded-sm px-3 py-2 mb-4 border ${
            msg.type === "err"
              ? "text-danger border-danger/30 bg-danger/10"
              : "text-accent2 border-accent2/30 bg-accent2/10"
          }`}
        >
          {msg.text}
        </div>
      )}

      {canManageNumbers && (
        <section className="dash-in card p-5 mb-6 hover-lift" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="display font-semibold text-white">Nomor kamu</h2>
            {session.role === "fullup" && (
              <span className="mono text-xs text-muted">{numbers.length}/3</span>
            )}
          </div>
          <form onSubmit={addNumber} className="flex gap-2 mb-4">
            <input
              className="field mono"
              placeholder="628xxxxxxxxxx"
              value={numberInput}
              onChange={(e) => setNumberInput(e.target.value)}
              required
            />
            <button className="btn-primary shrink-0">Tambah</button>
          </form>
          <ul className="space-y-2">
            {numbers.map((n, i) => (
              <li
                key={n}
                className="dash-in flex items-center justify-between bg-panel2 rounded-sm px-3 py-2"
                style={{ animationDelay: `${240 + Math.min(i, 8) * 50}ms` }}
              >
                <span className="mono text-sm">{n}</span>
                <button className="text-danger text-xs hover:underline" onClick={() => deleteNumber(n)}>
                  Hapus
                </button>
              </li>
            ))}
            {numbers.length === 0 && <li className="text-muted text-sm">Belum ada nomor.</li>}
          </ul>
        </section>
      )}

      {canCreateAccounts && (
        <section className="dash-in card p-5 mb-6 hover-lift" style={{ animationDelay: "260ms" }}>
          <h2 className="display font-semibold text-white mb-3">Buat akun baru</h2>
          <form onSubmit={createAccount} className="grid gap-3 md:grid-cols-3 mb-4">
            <input
              className="field"
              placeholder="Username"
              value={newAccount.username}
              onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
              required
            />
            <input
              className="field"
              placeholder="Password"
              value={newAccount.password}
              onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
              required
            />
            <select
              className="field"
              value={newAccount.role}
              onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
              required
            >
              <option value="" disabled>Role</option>
              {canCreateAccounts.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
            <button className="btn-primary md:col-span-3">Buat akun</button>
          </form>

          <div className="space-y-2">
            {accounts.map((a, i) => (
              <div
                key={a.id}
                className="dash-in flex items-center justify-between bg-panel2 rounded-sm px-3 py-2"
                style={{ animationDelay: `${320 + Math.min(i, 8) * 50}ms` }}
              >
                <div>
                  <p className="text-sm text-white">{a.username}</p>
                  <p className="text-xs text-muted mono">
                    {ROLE_LABEL[a.role]} · {a.status} · {a.numbersCount} nomor
                  </p>
                </div>
                {session.role === "owner" && a.status !== "revoked" && (
                  <button className="text-danger text-xs hover:underline" onClick={() => revokeAccount(a.id)}>
                    Cabut akses
                  </button>
                )}
              </div>
            ))}
            {accounts.length === 0 && <p className="text-muted text-sm">Belum ada akun di bawahmu.</p>}
          </div>
        </section>
      )}

      {session.role === "owner" && (
        <section className="dash-in card p-5 hover-lift" style={{ animationDelay: "340ms" }}>
          <h2 className="display font-semibold text-white mb-3">Naikkan reseller ke PT</h2>
          <form onSubmit={upgradeToPt} className="flex gap-2">
            <input
              className="field"
              placeholder="Username reseller"
              value={upgradeUsername}
              onChange={(e) => setUpgradeUsername(e.target.value)}
              required
            />
            <button className="btn-primary shrink-0">Upgrade ke PT</button>
          </form>
        </section>
      )}

      <UpgradeModal
        open={modalOpen}
        target={upgradeTarget}
        onClose={() => setModalOpen(false)}
        onUpgraded={() => window.location.reload()}
        onCancelled={() => setPendingNotice(null)}
      />

      <TrxHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        invoices={invoices}
        loading={invoicesLoading}
        notifications={notifications}
      />
    </main>
  );
}
