import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { motion } from "framer-motion";

/* ====================== AUTH (MOCK) ====================== */
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("auth:user");
    return raw ? JSON.parse(raw) : null;
  });
  useEffect(() => {
    if (user) localStorage.setItem("auth:user", JSON.stringify(user));
    else localStorage.removeItem("auth:user");
  }, [user]);
  const value = useMemo(
    () => ({ user, login: (u) => setUser(u), logout: () => setUser(null) }),
    [user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/auth/login" replace state={{ from: location }} />;
  return children;
}

/* ====================== LIGHTBOX (GLOBAL) ====================== */
const LightboxContext = createContext(null);
const useLightbox = () => useContext(LightboxContext);

function LightboxProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState(null);
  const [caption, setCaption] = useState("");

  function show(src, cap = "") {
    setImg(src);
    setCaption(cap);
    setOpen(true);
  }
  function hide() {
    setOpen(false);
    setImg(null);
    setCaption("");
  }

  // close on ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") hide();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <LightboxContext.Provider value={{ show, hide }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={hide}>
          <div className="max-w-5xl w-full" onClick={(e)=>e.stopPropagation()}>
            <img src={img || ""} alt={caption} className="w-full rounded-xl object-contain max-h-[80vh]" />
            {caption ? (
              <div className="mt-2 text-center text-white/90 text-sm">{caption}</div>
            ) : null}
          </div>
          <button
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold"
            onClick={hide}
          >
            Close
          </button>
        </div>
      )}
    </LightboxContext.Provider>
  );
}

/* ====================== UI PRIMITIVES ====================== */
const Container = ({ children, className = "" }) => (
  <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);

const Section = ({ title, subtitle, children, actions }) => (
  <section className="py-10">
    <Container>
      {(title || subtitle || actions) && (
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </Container>
  </section>
);

const Card = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="card p-4"
  >
    {children}
  </motion.div>
);

const Badge = ({ children }) => (
  <span className="rounded-full border px-3 py-1 text-xs font-medium text-gray-700">
    {children}
  </span>
);

/* Image tile that opens Lightbox on click */
function ImageTile({ src, alt, className = "", onClick }) {
  return (
    <div className={`overflow-hidden rounded-xl ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || ""}
          className="h-full w-full cursor-zoom-in object-cover transition-transform duration-300 hover:scale-[1.03]"
          onClick={onClick}
        />
      ) : (
        <div className="h-full w-full bg-gray-100" />
      )}
    </div>
  );
}

/* Reusable card for listings */
function ImageCard({ src, title, meta, price, cta = "View", onImageClick }) {
  return (
    <Card>
      <div className="h-40 w-full">
        <ImageTile src={src} alt={title} className="h-40" onClick={onImageClick} />
      </div>
      <div className="mt-3">
        <div className="font-semibold">{title}</div>
        {meta && <div className="text-sm text-gray-600">{meta}</div>}
        {price && <div className="mt-2 text-sm font-semibold">{price}</div>}
        <div className="mt-3 flex gap-2">
          <button className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white">
            {cta}
          </button>
          <button className="rounded-xl border px-3 py-2 text-xs font-semibold">
            Save
          </button>
        </div>
      </div>
    </Card>
  );
}

/* Compact search + optional filters */
function FilterBar({
  query,
  setQuery,
  showPrice = false,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  showBeds = false,
  beds,
  setBeds,
  placeholder = "Search...",
}) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl border bg-white p-2 shadow-sm">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="min-w-[160px] flex-1 rounded-xl px-3 py-2 text-sm outline-none"
        placeholder={placeholder}
      />
      {showPrice && (
        <>
          <input
            type="number"
            value={minPrice ?? ""}
            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
            className="w-28 rounded-xl border px-3 py-2 text-sm"
            placeholder="Min ₦"
          />
          <input
            type="number"
            value={maxPrice ?? ""}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
            className="w-28 rounded-xl border px-3 py-2 text-sm"
            placeholder="Max ₦"
          />
        </>
      )}
      {showBeds && (
        <select
          value={beds ?? ""}
          onChange={(e) => setBeds(e.target.value ? Number(e.target.value) : undefined)}
          className="w-28 rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">Beds</option>
          {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}+</option>)}
        </select>
      )}
      <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
        Filter
      </button>
    </div>
  );
}

/* Utilities for price parsing (simple; expects numbers in string) */
function extractPriceNumber(priceStr) {
  if (!priceStr) return undefined;
  // remove non-digits
  const m = priceStr.replace(/[^\d]/g, "");
  if (!m) return undefined;
  return Number(m);
}

/* ====================== LAYOUT ====================== */
function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`rounded-xl px-3 py-2 text-sm font-medium ${
        active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </Link>
  );
}

function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/assets/Logo1.png"
            alt="Kinglaw Paradise Builders Ltd."
            className="h-10 w-10 rounded-lg object-contain"
          />
          <div className="leading-tight">
            <div className="text-base font-extrabold">
              Kinglaw Paradise Builders Ltd.
            </div>
            <div className="text-[11px] text-gray-500">
              Best Portable Building Services • RC 1647808
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/properties">Properties</NavLink>
          <NavLink to="/lands-for-sale">Lands</NavLink>
          <NavLink to="/houses-for-rent">Rentals</NavLink>
          <NavLink to="/agents">Agent</NavLink>
          <NavLink to="/materials">Materials</NavLink>
          <NavLink to="/artifacts">Artifacts</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/plans">House Plans</NavLink>
          <NavLink to="/designs">Designs</NavLink>
          <NavLink to="/construction">Construction</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => document.body.classList.toggle("theme-dark")}
            className="rounded-xl border px-3 py-2 text-sm"
            title="Toggle theme"
          >
            Theme
          </button>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-xl border px-3 py-2 text-sm"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth/login"
              className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-white">
      <Container className="py-8 text-sm text-gray-600">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Kinglaw Paradise Builders Ltd | Built By: <a  href="https://wa.me/2348113722088">
          Ifywigatechz</a> </p>
          <div className="flex flex-wrap gap-2">
            <Badge>RC 1647808</Badge>
            <Badge>Benin City, Edo State</Badge>
            <Badge>Quality Materials</Badge>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}

/* ====================== FLOATING WHATSAPP CTA ====================== */
function WhatsAppFab() {
  const num = "2348092382323"; // your WhatsApp number
  return (
    <a
      href={`https://wa.me/${num}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
      title="Chat on WhatsApp"
    >
      {/* Simple WA glyph */}
      <svg viewBox="0 0 32 32" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M19.11 17.02c-.28-.14-1.63-.8-1.88-.89-.25-.09-.43-.14-.62.14-.19.28-.71.89-.87 1.08-.16.19-.32.21-.6.07-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.37-1.63-1.53-1.9-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.47.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.62-1.49-.85-2.05-.22-.53-.45-.46-.62-.47h-.53c-.19 0-.49.07-.75.35-.26.28-1 1-1 2.44 0 1.44 1.03 2.83 1.18 3.02.14.19 2.02 3.08 4.89 4.32.68.29 1.21.46 1.63.59.69.22 1.31.19 1.81.12.55-.08 1.63-.67 1.86-1.32.23-.65.23-1.21.16-1.32-.07-.12-.25-.19-.53-.33zM16.11 5.33c-5.21 0-9.44 4.23-9.44 9.44 0 1.66.44 3.25 1.21 4.62L6 26.67l7.47-1.95c1.33.73 2.86 1.15 4.64 1.15 5.21 0 9.44-4.23 9.44-9.44s-4.23-9.44-9.44-9.44zm0 17c-1.6 0-3.08-.47-4.33-1.26l-.31-.19-4.42 1.15 1.18-4.29-.2-.33c-.75-1.23-1.18-2.67-1.18-4.21 0-4.46 3.62-8.09 8.09-8.09s8.09 3.62 8.09 8.09-3.62 8.09-8.09 8.09z"></path>
      </svg>
    </a>
  );
}

/* ====================== HELPERS ====================== */
function Hero({ heading, sub, img, dark = false }) {
  return (
    <section className={`relative overflow-hidden ${img ? "bg-hero" : ""}`} style={img ? { "--bg-image": `url('${img}')` } : undefined}>
      {img && dark && <div className="absolute inset-0 -z-10 bg-black/40" />}
      <Container className="py-10">
        <h1 className="text-3xl md:text-4xl font-black">{heading}</h1>
        {sub && <p className="mt-2 max-w-2xl text-gray-700">{sub}</p>}
      </Container>
    </section>
  );
}

/* ====================== DATA (SAMPLE) ====================== */
const DATA = {
  properties: [
    { src: "/assets/property1.jpg", title: "4-Bed Duplex • Benin City", meta: "4 Beds • 3 Baths • 450 m²", price: "Contact Agent", beds: 4 },
    { src: "/assets/property2.jpg", title: "3-Bed Terrace • Benin City", meta: "3 Beds • 2 Baths • 300 m²", price: "Contact Agent", beds: 3 },
    { src: "/assets/property4.jpg", title: "Upstairs Appartment • Benin City", meta: "5 Beds • 5 Baths  600 m²", price: "Contact Agent", beds: 3},
  ],
  lands: [
    { src: "/assets/land.jpg", title: "Benin City", meta: "Survey & Deed", price: "Contact Agent" },
    { src: "/assets/land1.jpg", title: "Benin City", meta: "C of O", price: "Contact Agent" },
    { src: "/assets/land3.jpg", title: "Benin City", meta: "Survey & Deed", price: "Contact Agent" },
    { src: "/assets/land4.jpg", title: "Benin City", meta: "Survey & Deed", price: "Contact Agent" },
    { src: "/assets/land5.jpg", title: "Benin City", meta: "Survey & Deed", price: "Contact Agent" },
    { src: "/assets/llland.jpg", title: "Benin City", meta: "Survey & Deed", price: "Contact Agent" },
    { src: "/assets/llandp.jpg", title: "Benin City", meta: "Survey & Deed", price: "Contact Agent" },
  ],
  rentals: [
    { src: "/assets/rent1.jpg", title: "2-Bedroom Apartment • Benin City", meta: "Space • Parking", price: "Contact Agent", beds: 2 },
    { src: "/assets/rent2.jpg", title: "Flats-Bedroom Apartment • Benin City", meta: "Upstairs • Parking", price: "Contact Agent", beds: 2 },
    { src: "/assets/rent3.jpg", title: "2Each-Bed Apartment • Benin city", meta: "Upstairs • Parking", price: "Contact Agent", beds: 2 },
    { src: "/assets/rent4.jpg", title: "2-Bed Apartment • Sapele Road", meta: "Self-Contain • Parking", price: "Contact Agent", beds: 2 },
    { src: "/assets/rentage1.jpg", title: "Flat-Beds Apartment • Benin City", meta: "Upstairs • Parking", price: "Contact Agent", beds: 2 },
  ],
  materials: [
    { src: "/assets/material-cement.jpg", title: "Dangote Cement 50kg", price: "Contact Agent" },
    { src: "/assets/material-wiremesh.jpg", title: "Wire Mesh (Roll)", price: "Contact Agent" },
    { src: "/assets/material-woods.jpg", title: "Hardwood (Assorted)", price: "Contact Agent" },
    { src: "/assets/material-blocks.jpg", title: `Hollow Blocks 9"`, price: "contact Agent" },
    { src: "/assets/material-granite.jpg", title: "Granite (30 Tons)", price: "Contact Agent" },
    { src: "/assets/materialRod.jpg", title: "Rods  (12mm, 16mm, 20mm", price: "Contact Agent" },
    { src: "/assets/material-blocksm.jpg", title: "Moulding", price: "Contact Agent" },
  ],
  artifacts: [
    { src: "/assets/material-blocksm.jpg", title: "Block Production Yard" },
    { src: "/assets/0ngoingpit.jpg", title: "Ongoing Soakaway" },
    { src: "/assets/AAfact.jpg", title: "From Foundation Forming" },
    { src: "/assets/Afact.jpg", title: "WC Level" },
    { src: "/assets/IMG-20250813-WA0004.jpg", title: "Formin" },
    { src: "/assets/llland.jpg", title: "Land for Sale" },
    { src: "/assets/material-wiremesh.jpg", title: "Wiremesh" },
    { src: "/assets/sitework1.jpg", title: "Sitework" },
    { src: "/assets/sand and gravel.jpg", title: "sand and Gravel"},
    { src: "/assets/logo.jpg", title: "Company Flyer" },
  ],
  plans: [
    { src: "/assets/plan-1.jpg", title: "Residential Plan A" },
    { src: "/assets/plan-2.jpg", title: "5-Bedroom Plan" },
    { src: "/assets/DrawingP3.jpg", title: "Bedroom Plan" },
    { src: "/assets/DrawingP2.jpg", title: "5-Bedroom Plan" },
  ],
  designs: [
    { src: "/assets/desiggn.jpg", title: "Modern Elevation" },
    { src: "/assets/ddesign.jpg", title: "Classic Elevation" },
    { src: "/assets/design1.jpg", title: "Classic Design" },
    { src: "/assets/design3.jpg", title: "Modern Design" },
    { src: "/assets/design4.jpg", title: "Classic Elevation" },
  ],
  construction: [
    { src: "/assets/foundation1.jpg", title: "Ongoing Site — Foundation" },
    { src: "/assets/Finishing.jpg", title: "Ongoing Site — Finishing" },
    { src: "/assets/sitework1.jpg", title: "Ongoing Site — WC level" },
    { src: "/assets/sitework2.jpg", title: "Ongoing Site — Men at Work" },
    { src: "/assets/sitework3.jpg", title: "Ongoing Site — Finishing" },
    { src: "/assets/sitework4.jpg", title: "Ongoing Site — Finishing" },
    { src: "/assets/0ngoingpit.jpg", title: "Ongoing Site — Soakaway" },
    { src: "/assets/upstair1.jpg", title: "Ongoing Site — Upstairs" },
    { src: "/assets/upstair2.jpg", title: "Ongoing Site — Finishing" },
  ],
};

/* ====================== PAGES ====================== */
/* HOME */
function Home() {
  const { show } = useLightbox();
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/assets/materials/wood.jpg')" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/60 to-white" />
        <Container className="py-16">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl font-black leading-tight md:text-5xl"
              >
                Find Land, Rent Homes, Build Modern Designs — All in One Place
              </motion.h1>
              <p className="mt-4 max-w-xl text-gray-700">
                Buy plots, rent houses, hire trusted agents, and order quality building materials. From drawings to construction, we’ve got you.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white" to="/properties">Browse Properties</Link>
                <Link className="rounded-2xl border px-5 py-3 text-sm font-semibold" to="/services">Our Services</Link>
              </div>
              <div className="mt-8 max-w-2xl">
                <FilterQuick placeholder="Search properties, lands, rentals..." />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid gap-4 md:grid-cols-2"
            >
              {[
                { src: "/assets/material-cement.jpg", title: "Cement" },
                { src: "/assets/material-wiremesh.jpg", title: "Wire Mesh" },
                { src: "/assets/material-blocks.jpg", title: "Hollow Blocks" },
                { src: "/assets/material-granite.jpg", title: "Granite" },
              ].map((it, i) => (
                <Card key={i}>
                  <ImageTile
                    src={it.src}
                    alt={it.title}
                    className="h-32"
                    onClick={() => show(it.src, it.title)}
                  />
                  <div className="mt-3">
                    <div className="font-semibold">{it.title}</div>
                    <div className="text-sm text-gray-600">Quality materials • Fast delivery</div>
                  </div>
                </Card>
              ))}
            </motion.div>
          </div>
        </Container>
      </section>

      <Section title="Top Categories" subtitle="Quick links to what you need most.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link className="rounded-2xl border bg-white p-5 text-sm font-semibold shadow-sm hover:shadow-md" to="/lands-for-sale">Lands for Sale</Link>
          <Link className="rounded-2xl border bg-white p-5 text-sm font-semibold shadow-sm hover:shadow-md" to="/houses-for-rent">Houses for Rent</Link>
          <Link className="rounded-2xl border bg-white p-5 text-sm font-semibold shadow-sm hover:shadow-md" to="/materials">Building Materials</Link>
          <Link className="rounded-2xl border bg-white p-5 text-sm font-semibold shadow-sm hover:shadow-md" to="/plans">House Drawing Plans</Link>
        </div>
      </Section>
    </>
  );
}

/* Small quick-search bar for the hero (no filters) */
function FilterQuick({ placeholder }) {
  const [q, setQ] = useState("");
  return (
    <div className="flex w-full items-center gap-2 rounded-2xl border bg-white p-2 shadow-sm">
      <input
        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
        placeholder={placeholder}
        value={q}
        onChange={(e)=>setQ(e.target.value)}
      />
      <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
        Search
      </button>
    </div>
  );
}

/* PROPERTIES */
function Properties() {
  const { show } = useLightbox();
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState();
  const [maxPrice, setMaxPrice] = useState();
  const [beds, setBeds] = useState();

  const items = DATA.properties.filter((it) => {
    const q = query.trim().toLowerCase();
    const matchesQ =
      !q ||
      it.title.toLowerCase().includes(q) ||
      (it.meta || "").toLowerCase().includes(q);
    const p = extractPriceNumber(it.price);
    const matchesMin = minPrice ? (p ? p >= minPrice : false) : true;
    const matchesMax = maxPrice ? (p ? p <= maxPrice : false) : true;
    const matchesBeds = beds ? (it.beds ? it.beds >= beds : false) : true;
    return matchesQ && matchesMin && matchesMax && matchesBeds;
  });

  return (
    <>
      <Hero heading="Properties" sub="Buy and invest with confidence." img={DATA.properties[0]?.src} />
      <Section
        actions={
          <FilterBar
            query={query} setQuery={setQuery}
            showPrice minPrice={minPrice} maxPrice={maxPrice}
            setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
            showBeds beds={beds} setBeds={setBeds}
            placeholder="Search properties..."
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i, idx) => (
            <ImageCard
              key={idx}
              {...i}
              cta="View Details"
              onImageClick={() => show(i.src, i.title)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

/* PROPERTY DETAIL (template) */
function PropertyDetail() {
  const { show } = useLightbox();
  const p = DATA.properties[0];
  return (
    <Section title="4-Bedroom Duplex in GRA" subtitle="Ref: KPB-PR-0001">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-gray-100">
          <img
            src={p?.src}
            alt="Property"
            className="h-full w-full cursor-zoom-in object-cover"
            onClick={() => show(p?.src, "4-Bedroom Duplex in GRA")}
          />
        </div>
        <div>
          <div className="text-2xl font-bold">{p?.price || "₦—"}</div>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
            <li>4 Beds</li>
            <li>3 Baths</li>
            <li>450 m²</li>
            <li>Parking • Security</li>
          </ul>
          <p className="mt-4 text-sm text-gray-600">
            Modern finishes, good access road, steady power. Title: C of O. Schedule inspection below.
          </p>
          <div className="mt-4 flex gap-2">
            <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">Book Inspection</button>
            <a
              href="https://wa.me/2348092382323"
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
              target="_blank" rel="noreferrer"
            >
              WhatsApp Agent
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* LANDS */
function Lands() {
  const { show } = useLightbox();
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState();
  const [maxPrice, setMaxPrice] = useState();

  const items = DATA.lands.filter((it) => {
    const q = query.trim().toLowerCase();
    const matchesQ = !q || it.title.toLowerCase().includes(q) || (it.meta || "").toLowerCase().includes(q);
    const p = extractPriceNumber(it.price);
    const matchesMin = minPrice ? (p ? p >= minPrice : false) : true;
    const matchesMax = maxPrice ? (p ? p <= maxPrice : false) : true;
    return matchesQ && matchesMin && matchesMax;
  });

  return (
    <>
      <Hero heading="Lands for Sale" sub="Verified plots with proper titles." img={DATA.lands[0]?.src} />
      <Section
        actions={
          <FilterBar
            query={query} setQuery={setQuery}
            showPrice minPrice={minPrice} maxPrice={maxPrice}
            setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
            placeholder="Search lands..."
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l, i) => (
            <ImageCard
              key={i}
              src={l.src}
              title={l.title}
              price={l.price}
              meta={l.meta}
              cta="Enquire"
              onImageClick={() => show(l.src, l.title)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

/* RENTALS */
function Rentals() {
  const { show } = useLightbox();
  const [query, setQuery] = useState("");
  const [beds, setBeds] = useState();

  const items = DATA.rentals.filter((it) => {
    const q = query.trim().toLowerCase();
    const matchesQ = !q || it.title.toLowerCase().includes(q) || (it.meta || "").toLowerCase().includes(q);
    const matchesBeds = beds ? (it.beds ? it.beds >= beds : false) : true;
    return matchesQ && matchesBeds;
  });

  return (
    <>
      <Hero heading="Houses for Rent" sub="Self-contain, apartments, duplexes." img={DATA.rentals[0]?.src} />
      <Section
        actions={
          <FilterBar
            query={query} setQuery={setQuery}
            showBeds beds={beds} setBeds={setBeds}
            placeholder="Search rentals..."
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r, i) => (
            <ImageCard
              key={i}
              src={r.src}
              title={r.title}
              price={r.price}
              meta={r.meta}
              cta="Book Inspection"
              onImageClick={() => show(r.src, r.title)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

/* AGENT (single) */
function Agents() {
  const agentImg = "/assets/AgentProfile.jpg";
  return (
    <>
      <Hero heading="Your Verified Agent" sub="Work with one trusted point of contact." img={agentImg} dark />
      <Section>
        <div className="max-w-3xl">
          <Card>
            <div className="flex flex-col items-start gap-4 md:flex-row">
              <img
                src={agentImg}
                alt="Agent"
                className="h-28 w-28 rounded-xl object-cover"
              />
              <div className="flex-1">
                <div className="text-lg font-semibold">Oko Isu Ogbonna Kinglaw</div>
                <div className="text-sm text-gray-600">Benin City • 4.9★ • RC 1647808</div>
                <p className="mt-2 text-sm text-gray-700">
                  Specialist in land verification, sales, rentals, materials supply, drawings, and full construction.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href="tel:+2348022340940" className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white">Call</a>
                  <a href="https://wa.me/2348092382323" target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-xs font-semibold">WhatsApp</a>
                  <a href="mailto:kinglawparadisebuildersltd@gmail.com" className="rounded-xl border px-3 py-2 text-xs font-semibold">Email</a>
                  <a href="https://www.facebook.com/share/1Azkcv81sm/" target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-xs font-semibold">Facebook</a>
                  <a href="https://www.tiktok.com/@kinglaw.paradise.b?_t=ZM-8yvlrqaLH0S&_r=1" target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-xs font-semibold">Tiktok</a>
                  <a href="https://x.com/KinglawLtd?s=09" target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-xs font-semibold">X</a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </>
  );
}

/* MATERIALS */
function Materials() {
  const { show } = useLightbox();
  const [query, setQuery] = useState("");

  const items = DATA.materials.filter((it) => {
    const q = query.trim().toLowerCase();
    return !q || it.title.toLowerCase().includes(q);
  });

  return (
    <>
      <Hero heading="Building Materials" sub="Quality materials • Fast delivery" img="/assets/materials/wood.jpg" />
      <Section
        actions={
          <FilterBar query={query} setQuery={setQuery} placeholder="Search materials..." />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <ImageCard
              key={i}
              src={it.src}
              title={it.title}
              price={it.price}
              cta="Add to Cart"
              onImageClick={() => show(it.src, it.title)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

/* ARTIFACTS */
function Artifacts() {
  const { show } = useLightbox();
  const [query, setQuery] = useState("");

  const items = DATA.artifacts.filter((it) => {
    const q = query.trim().toLowerCase();
    return !q || it.title.toLowerCase().includes(q);
  });

  return (
    <>
      <Hero heading="Building Artifacts" sub="Snapshots from our works and branding." img={DATA.artifacts[0]?.src} />
      <Section
        actions={<FilterBar query={query} setQuery={setQuery} placeholder="Search artifacts..." />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g, i) => (
            <ImageCard
              key={i}
              src={g.src}
              title={g.title}
              cta="View"
              onImageClick={() => show(g.src, g.title)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

/* SERVICES */
function Services() {
  const svcs = [
    "Land Verification",
    "Survey & Beaconing",
    "Architectural Drawings",
    "3D Designs & Renders",
    "Renovations",
    "General Construction",
  ];
  return (
    <>
      <Hero
        heading="Services"
        sub="Land verification, survey, approvals, construction, project management."
        img="/assets/services/sitework.jpg"
      />
      <Section>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {svcs.map((svc, i) => (
            <Card key={i}>
              <div className="text-lg font-semibold">{svc}</div>
              <p className="mt-1 text-sm text-gray-600">
                Professional service delivered by vetted experts with transparent pricing.
              </p>
              <div className="mt-3">
                <button className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white">
                  Request Quote
                </button>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}

/* PLANS */
function Plans() {
  const { show } = useLightbox();
  const [query, setQuery] = useState("");
  const items = DATA.plans.filter((it) => {
    const q = query.trim().toLowerCase();
    return !q || it.title.toLowerCase().includes(q);
  });

  return (
    <>
      <Hero heading="House Drawing Plans" sub="Ready-made and custom plans." img={DATA.plans[0]?.src} />
      <Section
        actions={<FilterBar query={query} setQuery={setQuery} placeholder="Search plans..." />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <ImageCard
              key={i}
              src={p.src}
              title={p.title}
              cta="Request PDF"
              onImageClick={() => show(p.src, p.title)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

/* DESIGNS */
function Designs() {
  const { show } = useLightbox();
  const [query, setQuery] = useState("");
  const items = DATA.designs.filter((it) => {
    const q = query.trim().toLowerCase();
    return !q || it.title.toLowerCase().includes(q);
  });

  return (
    <>
      <Hero heading="Building Designs" sub="Modern, contemporary and classic." img={DATA.designs[0]?.src} />
      <Section
        actions={<FilterBar query={query} setQuery={setQuery} placeholder="Search designs..." />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d, i) => (
            <ImageCard
              key={i}
              src={d.src}
              title={d.title}
              cta="Request Renders"
              onImageClick={() => show(d.src, d.title)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

/* CONSTRUCTION */
function Construction() {
  const { show } = useLightbox();
  const [query, setQuery] = useState("");
  const items = DATA.construction.filter((it) => {
    const q = query.trim().toLowerCase();
    return !q || it.title.toLowerCase().includes(q);
  });

  return (
    <>
      <Hero heading="Construction" sub="From foundation to finishing." img={DATA.construction[0]?.src} />
      <Section
        actions={<FilterBar query={query} setQuery={setQuery} placeholder="Search projects..." />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <ImageCard
              key={i}
              src={p.src}
              title={p.title}
              cta="Request Site Visit"
              onImageClick={() => show(p.src, p.title)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

/* ====================== AUTH PAGES ====================== */
function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    login({ email: form.get("email") });
  }

  return (
    <Section title="Sign in" subtitle="Access your dashboard, saved listings and orders.">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md space-y-3 rounded-2xl border bg-white p-5"
      >
      
        <div>
          <label className="text-sm font-medium">Email</label>
          <input name="email" type="email" required className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input name="password" type="password" required className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
        </div>
        <button className="w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">Sign in</button>
        <div className="text-center text-xs text-gray-600">
          No account? <Link to="/auth/register" className="font-semibold underline">Create one</Link>
        </div>
      </form>
      <AuthRedirect to={from} />
    </Section>
  );
}

function AuthRedirect({ to }) {
  const { user } = useAuth();
  if (!user) return null;
  return <Navigate to={to} replace />;
}

function Register() {
  const { login } = useAuth();
  function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    login({ email: form.get("email") });
  }
  return (
    <Section title="Create account" subtitle="Save favourites, request quotes, and track orders.">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md space-y-3 rounded-2xl border bg-white p-5"
      >
        <img src="public/assets/logo.jpg" alt="KPB" className="mx-auto h-14 w-14 object-contain" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">First name</label>
            <input name="first" required className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Last name</label>
            <input name="last" required className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input name="email" type="email" required className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input name="password" type="password" required className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
        </div>
        <button className="w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">Create account</button>
        <div className="text-center text-xs text-gray-600">
          Already have an account? <Link to="/auth/login" className="font-semibold underline">Sign in</Link>
        </div>
      </form>
    </Section>
  );
}

/* ====================== DASHBOARD & 404 ====================== */
function Dashboard() {
  const { user } = useAuth();
  return (
    <Section title="My Dashboard" subtitle={`Signed in as ${user?.email || "user"}`}>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm font-semibold">Saved Listings</div>
          <p className="mt-1 text-xs text-gray-600">0 saved • Explore properties to add favourites.</p>
          <div className="mt-3">
            <Link to="/properties" className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white">Browse</Link>
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold">Orders (Materials)</div>
          <p className="mt-1 text-xs text-gray-600">Track your material purchases and deliveries.</p>
          <div className="mt-3">
            <Link to="/materials" className="rounded-xl border px-3 py-2 text-xs font-semibold">Go to shop</Link>
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold">Requests & Quotes</div>
          <p className="mt-1 text-xs text-gray-600">Manage inspection bookings and service quotes.</p>
          <div className="mt-3">
            <Link to="/services" className="rounded-xl border px-3 py-2 text-xs font-semibold">View services</Link>
          </div>
        </Card>
      </div>
    </Section>
  );
}

function NotFound() {
  return (
    <Section title="Page not found">
      <p className="text-sm text-gray-600">The page you are looking for doesn’t exist.</p>
      <div className="mt-4">
        <Link to="/" className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">Back home</Link>
      </div>
    </Section>
  );
}

/* ====================== APP ROUTER ====================== */
export default function App() {
  return (
    <AuthProvider>
      <LightboxProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route index element={<Home />} />
              <Route path="properties" element={<Properties />} />
              <Route path="properties/:id" element={<PropertyDetail />} />
              <Route path="lands-for-sale" element={<Lands />} />
              <Route path="houses-for-rent" element={<Rentals />} />
              <Route path="agents" element={<Agents />} />
              <Route path="materials" element={<Materials />} />
              <Route path="artifacts" element={<Artifacts />} />
              <Route path="services" element={<Services />} />
              <Route path="plans" element={<Plans />} />
              <Route path="designs" element={<Designs />} />
              <Route path="construction" element={<Construction />} />
              <Route path="auth">
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
              </Route>
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </LightboxProvider>
    </AuthProvider>
  );
}

/* ====================== IMAGE PATHS (PUT IN /public/assets/) ======================
logo/kpb.png
materials/{cement.jpg,mesh.jpg,wood.jpg,blocks.jpg,granite.jpg}
artifacts/{blockyard.jpg,flyer.jpg}
agent/agent.jpg
properties/{prop1.jpg,prop2.jpg}
lands/{land1.jpg,land2.jpg}
rentals/{rent1.jpg}
plans/{plan1.jpg,plan2.jpg}
designs/{design1.jpg,design2.jpg}
construction/{project1.jpg,project2.jpg}
*/
