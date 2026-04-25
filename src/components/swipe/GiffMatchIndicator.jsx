export default function GiffMatchIndicator({ show }) {
  if (!show) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-cream/90 text-navyHero text-xs font-semibold px-3 py-1.5 shadow-sm">
      <img src="/giff/face.png" alt="" className="h-5 w-5" />
      Giff sees a good fit
    </div>
  );
}
