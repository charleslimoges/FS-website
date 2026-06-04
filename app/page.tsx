import Link from "next/link";

export default async function HomePage() {

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#d8e1ef" }}>

      {/* ── Hero card ──────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-10 pt-6 pb-10">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            className="relative overflow-hidden flex items-end"
            style={{ backgroundColor: "#1c2741", borderRadius: "2rem", minHeight: 390 }}
          >
            {/* Building photo area */}
            <div
              className="absolute right-0 top-0 bottom-0"
              style={{
                width: "58%",
                background: "linear-gradient(155deg, #3b5070 0%, #5a7898 45%, #6e90a8 100%)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, #1c2741 0%, rgba(28,39,65,0.65) 25%, transparent 65%)",
                }}
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
                className="font-bold leading-[1.05] mb-8"
                style={{ color: "#fff", fontSize: "clamp(2.2rem, 4vw, 3rem)" }}
              >
                Find Your Next{" "}
                <em className="italic font-light" style={{ color: "#93bbdf" }}>
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
      <section className="px-4 sm:px-6 lg:px-10 py-6">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="flex items-center gap-6 lg:gap-8">

            {/* Left image */}
            <div className="hidden lg:flex justify-end" style={{ flex: 1 }}>
              <div
                className="overflow-hidden"
                style={{
                  width: 210,
                  height: 210,
                  borderRadius: "1.25rem",
                  background: "linear-gradient(135deg, #c8d4be 0%, #8aaa7e 100%)",
                  marginTop: 32,
                }}
              />
            </div>

            {/* Center text */}
            <div className="text-center" style={{ flex: "0 0 auto", maxWidth: 320, margin: "0 auto" }}>
              <div className="flex justify-center mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0e21" aria-hidden="true">
                  <path d="M12 2L22 12L12 22L2 12Z" />
                </svg>
              </div>
              <h2 className="font-bold text-brand-navy leading-tight mb-4" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}>
                If you can{" "}
                <em className="italic font-light">dream it</em>, we
                <br />
                can <em className="italic font-light">find it</em>.
              </h2>
              <p className="text-sm leading-relaxed mb-8 mx-auto" style={{ color: "#6b7a99", maxWidth: 270 }}>
                We take a uniquely personalised approach to every search
                — understanding your lifestyle, budget, and must-haves
                to find a home you&apos;ll truly love.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-brand-navy text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-brand-blue transition-colors"
              >
                Get in touch
              </Link>
            </div>

            {/* Right image */}
            <div className="hidden lg:flex justify-start" style={{ flex: 1 }}>
              <div
                className="overflow-hidden"
                style={{
                  width: 210,
                  height: 260,
                  borderRadius: "1.25rem",
                  background: "linear-gradient(135deg, #2d3c4e 0%, #3e5568 100%)",
                  marginTop: -20,
                }}
              />
            </div>

          </div>
        </div>
      </section>

      {/* ── Dark CTA card ──────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-10 pb-14">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            className="relative overflow-hidden"
            style={{ backgroundColor: "#11151f", borderRadius: "2rem", minHeight: 290 }}
          >
            {/* Interior bg gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(30,42,60,0.9) 0%, rgba(18,24,36,0.6) 60%, rgba(10,14,30,0.9) 100%)",
              }}
            />
            {/* Subtle texture overlay */}
            <div
              className="absolute right-0 top-0 bottom-0"
              style={{
                width: "55%",
                background:
                  "linear-gradient(135deg, rgba(45,55,80,0.4) 0%, rgba(25,35,55,0.6) 100%)",
              }}
            />
            <div className="relative z-10 p-10 md:p-14">
              <h2 className="font-bold text-white leading-tight mb-3" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}>
                Our premium{" "}
                <em className="italic font-light" style={{ color: "#93c5fd" }}>
                  buildings
                </em>
              </h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 380 }}>
                We&apos;ve been connecting tenants with dream apartments across
                Montreal. Handpicked buildings with premium finishes, top
                amenities, and unbeatable locations.
              </p>
              <Link
                href="/buildings"
                className="inline-flex items-center gap-2 font-medium px-6 py-3 rounded-xl text-sm transition-colors hover:bg-white/10"
                style={{ border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }}
              >
                View Buildings
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
