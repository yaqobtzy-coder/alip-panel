"use client";

export default function MaintenancePage({ message, logoUrl }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 max-w-sm w-full text-center hover-lift">
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-md object-cover mx-auto mb-4 border border-line" />
        )}
        <div className="text-4xl mb-3">🛠️</div>
        <h1 className="display text-xl font-bold text-white mb-2">Sedang Maintenance</h1>
        <p className="text-muted text-sm">{message || "Sedang maintenance. Balik lagi sebentar lagi, ya."}</p>
      </div>
    </main>
  );
}
