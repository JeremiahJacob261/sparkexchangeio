import Link from "next/link";
import { ArrowRight, Radio, ArrowLeftRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="platform-home min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-32 md:pt-44">
        <section className="max-w-4xl pb-16 md:pb-24">
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Watch what you love.<br /><span className="text-[#cfb0ed]">Exchange with ease.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/75 md:text-xl">
            Welcome to PlasmaX. Find live TV and exchange crypto, together in one place.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a className="platform-button platform-button-primary" href="/iptv">Watch live TV <ArrowRight size={19} /></a>
            <Link className="platform-button platform-button-outline" href="/exchange">Explore exchange <ArrowRight size={19} /></Link>
          </div>
        </section>
        <section aria-label="Explore PlasmaX services" className="platform-services">
          <div className="platform-service">
            <Radio aria-hidden="true" size={30} />
            <h2>Live TV, your way</h2>
            <p>Browse channels, search by category, or load your own M3U playlist in the PlasmaX player.</p>
            <a href="/iptv">Open IPTV <ArrowRight size={18} /></a>
          </div>
          <div className="platform-service">
            <ArrowLeftRight aria-hidden="true" size={30} />
            <h2>Crypto exchange</h2>
            <p>Explore available currencies and exchange crypto through our existing non-custodial swap service.</p>
            <Link href="/exchange">Open exchange <ArrowRight size={18} /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
