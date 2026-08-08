// Decorative floating gradient blobs behind every page — fixed,
// pointer-events-none, negative z-index. Pure CSS animation (see
// globals.css .bg-blob), so this component itself never re-renders.
export default function AnimatedBlobs() {
  return (
    <div className="bg-blobs" aria-hidden="true">
      <div className="bg-blob b1" />
      <div className="bg-blob b2" />
      <div className="bg-blob b3" />
      <div className="bg-blob b4" />
    </div>
  );
}
