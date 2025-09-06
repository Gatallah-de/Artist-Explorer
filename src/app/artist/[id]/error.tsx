"use client";
export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="p-4 border rounded-lg border-red-300/40 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300">
      <div className="font-semibold mb-1">Couldn’t load this artist.</div>
      <div className="text-xs opacity-70 whitespace-pre-wrap">{error.message}</div>
    </div>
  );
}
