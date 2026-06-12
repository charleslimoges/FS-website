import Link from "next/link";
import { unsplashUrl, HERO_PHOTO } from "@/lib/unsplash";
import ScrollRevealImage from "@/components/ui/ScrollRevealImage";

export default async function HomePage() {

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff", overflowX: "clip" }}>

      {/* ── Hero card ──────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-10 pt-6 pb-10">
        <div className="hero-enter" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            className="hero-card relative overflow-hidden flex items-end"
            style={{ backgroundColor: "#1c2741", borderRadius: "2rem", minHeight: 390, boxShadow: "0 32px 80px rgba(0,0,0,0.30), 0 10px 28px rgba(0,0,0,0.16)" }}
          >
            {/* Building photo area — full width */}
            <div className="absolute inset-0">
              <img
                src={unsplashUrl(HERO_PHOTO, 1600, 800)}
                alt="Modern apartment building"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "rgba(20,28,48,0.40)" }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10 p-10 md:p-14 pb-14" style={{ maxWidth: 520 }}>
              <p
                className="text-xs font-medium tracking-widest uppercase mb-5"
                style={{ color: "rgba(255,255,255,0.48)", letterSpacing: "0.16em" }}
              >
                Your dedicated leasing agent in Montreal
              </p>
              <h1
                className="font-seasons leading-[1.05] mb-8"
                style={{ color: "#fff", fontSize: "clamp(2.2rem, 4vw, 3rem)", fontWeight: 700 }}
              >
                Find Your Next{" "}
                <em className="font-seasons italic font-light" style={{ color: "#93bbdf" }}>
                  Perfect
                </em>
                <br />
                Home in Montreal
              </h1>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/buildings"
                  className="font-semibold px-6 py-3 rounded-xl text-sm transition-colors hover:bg-gray-50"
                  style={{ backgroundColor: "#fff", color: "#0a0e21" }}
                >
                  Browse Buildings
                </Link>
                <Link
                  href="/contact"
                  className="font-medium px-6 py-3 rounded-xl text-sm transition-colors hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}
                >
                  Contact Agent
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dream section ──────────────────────────────────────── */}
      <section style={{ paddingTop: "2rem", paddingBottom: "2rem", overflow: "visible" }}>
        <div className="flex items-center justify-center" style={{ gap: "9rem", overflow: "visible" }}>

          {/* Left image — full bleed to left viewport edge, bleeds upward */}
          <ScrollRevealImage
            src="/images/left-building.jpeg"
            alt="Modern apartment building"
            direction="left"
            containerStyle={{
              flex: 1,
              height: 430,
              marginTop: -110,
              borderRadius: "0 1.5rem 1.5rem 0",
              overflow: "hidden",
              boxShadow: "20px 32px 80px rgba(0,0,0,0.38), 6px 10px 28px rgba(0,0,0,0.22)",
            }}
            imgStyle={{ objectPosition: "center center" }}
          />

          {/* Center text */}
          <div className="text-center px-4" style={{ flex: "0 0 auto", width: 400 }}>
            <div className="flex justify-center mb-5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0e21" aria-hidden="true">
                <path d="M12 2L22 12L12 22L2 12Z" />
              </svg>
            </div>
            <h2 className="font-seasons text-brand-navy mb-4" style={{ fontSize: "clamp(1.3rem, 2.5vw, 2rem)", fontWeight: 700, lineHeight: 1.15, textAlign: "center" }}>
              <span style={{ display: "block" }}>If you can <em className="font-seasons italic font-light">dream it</em>,</span>
              <span style={{ display: "block" }}>we can <em className="font-seasons italic font-light">find it</em>.</span>
            </h2>
            <p className="text-sm leading-relaxed mb-8 mx-auto" style={{ color: "#6b7a99", maxWidth: 260 }}>
              We take a uniquely personalised approach to every search
              understanding your lifestyle, budget, and must-haves
              to find a home you&apos;ll truly love.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-brand-navy text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-brand-blue transition-colors"
            >
              Get in touch
            </Link>
          </div>

          {/* Right image — full bleed to right viewport edge, bleeds downward */}
          <ScrollRevealImage
            src="/images/right-building.jpeg"
            alt="Modern residential building"
            direction="right"
            containerStyle={{
              flex: 1,
              height: 460,
              marginTop: 80,
              borderRadius: "1.5rem 0 0 1.5rem",
              overflow: "hidden",
              boxShadow: "-20px 32px 80px rgba(0,0,0,0.38), -6px 10px 28px rgba(0,0,0,0.22)",
            }}
            imgStyle={{ objectPosition: "center center" }}
          />

        </div>
      </section>

      {/* ── Full-image CTA card ─────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: "calc(10rem - 105px)", paddingBottom: "3.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <ScrollRevealImage
            src="/images/bottom-building.jpg"
            alt="Premium apartment building"
            direction="up"
            containerStyle={{ borderRadius: "2rem", minHeight: 200, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.32), 0 10px 28px rgba(0,0,0,0.18)" }}
            imgStyle={{ display: "block", minHeight: 200 }}
          />
        </div>
      </section>

    </div>
  );
}
