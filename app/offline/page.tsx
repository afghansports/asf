import { WifiOff } from "lucide-react";
import { Logo } from "@/components/shared/logo";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="min-h-screen w-full bg-asf-navy text-white flex items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center space-y-5">
        <Logo size={72} href={null} />
        <span className="inline-flex w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/20 items-center justify-center">
          <WifiOff className="w-5 h-5" aria-hidden />
        </span>
        <p className="font-condensed font-bold text-xs tracking-[0.32em] uppercase text-asf-gold">Offline</p>
        <h1 className="font-display font-black text-3xl sm:text-4xl leading-tight">
          You appear to be offline.
        </h1>
        <p className="text-white/75 leading-relaxed max-w-md mx-auto">
          Some pages and reels will not load until you are back on the network. Try again in a moment.
        </p>
      </div>
    </main>
  );
}
