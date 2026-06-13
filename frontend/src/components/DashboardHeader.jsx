import './DashboardHeader.css';

/**
 * ==========================================
 * CINEFLOW COMPONENT: DashboardHeader.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Employs pure CSS animations for hardware-accelerated text scrolling, avoiding JS-based animation layout thrashing.
 * - Implements screen-reader safe structure using aria-hidden tags on cloned marquee arrays.
 * - Features clean responsive flex layout integrating standard theme switches.
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Displays a live box office feed marquee populated with mock statistics.
 * - Dynamic spotlight overlay adds modern depth using light blending.
 * ==========================================
 */

export default function DashboardHeader() {
    const boxOfficeItems = [
        "Pathaan: ₹543.05 Cr",
        "Jawan: ₹643.50 Cr",
        "Dangal: ₹387.38 Cr",
        "Animal: ₹554.00 Cr",
        "Gadar 2: ₹525.45 Cr",
        "Baahubali 2: ₹1030.42 Cr",
        "Rocky Aur Rani: ₹153.75 Cr"
    ];

    return (
        <section className="hero glass-effect animate-fade-in">
            {/* Live box office feed stock marquee */}
            <div className="ticker-banner">
                <div className="ticker-marquee">
                    <span className="ticker-item ticker-title">⚡ LIVE BOX OFFICE DATA</span>
                    {boxOfficeItems.map((item, idx) => (
                        <span key={idx} className="ticker-item">★ {item}</span>
                     ))}
                </div>
                <div className="ticker-marquee" aria-hidden="true">
                    <span className="ticker-item ticker-title">⚡ LIVE BOX OFFICE DATA</span>
                    {boxOfficeItems.map((item, idx) => (
                        <span key={idx} className="ticker-item">★ {item}</span>
                    ))}
                </div>
            </div>

            <div className="projector-spotlight"></div>
            <div className="hero-content">
                <p className="eyebrow">Studio Database Connection Active</p>
                <h1 className="dashboard-title">
                    CINEFLOW <span className="text-gold-gradient">DBMS</span>
                </h1>
                <p className="hero-copy">
                    Precision relational database profiling for Bollywood studio assets.
                    Search database records, introspect tables, run performance race benchmarks, and monitor financial metrics.
                </p>
            </div>
        </section>
    );
}