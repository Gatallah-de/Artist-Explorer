import GridSkeleton from "@/components/skeletons/GridSkeleton";

export default function Loading() {
  return (
    <section className="space-y-6">
      <div className="card" style={{ height: 180 }} aria-hidden />
      <GridSkeleton rows={2} cols={4} />
    </section>
  );
}
