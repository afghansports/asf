import { LoadingSpinner } from "@/components/shared/loading-spinner";

/**
 * Global loading boundary. Shows a centered spinner while a route segment
 * suspends. Per ASF_LAUNCH_PRD.md > STEP 12.
 */
export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
