import qrcode from "qrcode-generator";

// QR kód jako SVG (každý tmavý modul = jeden čtvereček v path).
export function QrCode({ text, className, label }: { text: string; className?: string; label?: string }) {
  const q = qrcode(0, "M");
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  const margin = 4; // tichá zóna kolem QR podle normy – čtečky pak čtou spolehlivěji
  let d = "";
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + margin} ${r + margin}h1v1h-1z`;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${n + margin * 2} ${n + margin * 2}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label ?? "QR kód"}
    >
      <rect width="100%" height="100%" fill="#fff" />
      <path d={d} fill="#161412" />
    </svg>
  );
}
