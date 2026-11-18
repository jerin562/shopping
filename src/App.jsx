import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Heart, LockKeyhole, Menu, Minus, Plus, Search, ShoppingBag, Sparkles, Star, Trash2, Truck, UserRound, X } from "lucide-react";
import axios from "axios";
import { products } from "./data/products.js";
import { useShop } from "./context/ShopContext.jsx";

const money = (value) => `$${value.toFixed(2)}`;
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api" });

function Header() {
  const { cartCount, user } = useShop();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const matches = query.trim() ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3) : [];
  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/shop${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    setMobileOpen(false);
  };
  return <>
    <div className="announcement">A little more considered. Complimentary shipping on orders over $100 <ArrowRight size={13} /></div>
    <header className="site-header">
      <button className="icon-btn mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
      <Link to="/" className="wordmark">aurel<span>.</span></Link>
      <nav className={`main-nav ${mobileOpen ? "nav-open" : ""}`}>
        <Link to="/shop?category=Apparel">Clothing</Link>
        <Link to="/shop?category=Home">Home</Link>
        <Link to="/shop?category=Accessories">Accessories</Link>
        <Link to="/shop?sort=new">New arrivals <span className="nav-new">NEW</span></Link>
      </nav>
      <div className="header-actions">
        <form className="search-wrap" onSubmit={submitSearch}>
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pieces..." aria-label="Search products" />
          {matches.length > 0 && <div className="search-suggestions">{matches.map((p) => <button type="button" key={p.id} onClick={() => { navigate(`/product/${p.id}`); setQuery(""); }}>{p.name}<ArrowUpRight size={14} /></button>)}<button type="submit" className="all-results">View all results</button></div>}
        </form>
        <Link className="icon-btn account-icon" to={user ? "/account" : "/login"} aria-label="My account"><UserRound size={19} /></Link>
        <Link className="icon-btn bag-icon" to="/cart" aria-label={`Shopping bag, ${cartCount} items`}><ShoppingBag size={19} /><span className="bag-count">{cartCount}</span></Link>
      </div>
    </header>
  </>;
}

function Footer() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const subscribe = async (event) => {
    event.preventDefault();
    setSubscribing(true); setMessage("");
    try {
      const { data } = await api.post("/newsletter", { email });
      setMessage(data.message);
      setEmail("");
    } catch (error) {
      setMessage(error.response?.data?.message || "We couldn't save your subscription. Please try again.");
    } finally { setSubscribing(false); }
  };
  return <footer className="footer">
    <div className="footer-top">
      <div className="footer-brand"><Link to="/" className="wordmark">aurel<span>.</span></Link><p>Better things, made for<br />the way you live.</p><div className="social-links"><a href="https://instagram.com" aria-label="Instagram">ig</a><a href="https://pinterest.com" aria-label="Pinterest">p</a></div></div>
      <div className="footer-column"><strong>Explore</strong><Link to="/shop">All pieces</Link><Link to="/shop?category=Apparel">Clothing</Link><Link to="/shop?category=Home">Home</Link><Link to="/shop?category=Accessories">Accessories</Link></div>
      <div className="footer-column"><strong>Help</strong><a href="mailto:hello@aurel.store">Contact us</a><a href="mailto:hello@aurel.store?subject=Shipping">Shipping & returns</a><Link to="/account">My account</Link><Link to="/account">Order tracking</Link></div>
      <div className="newsletter"><strong>Notes from AUREL</strong><p>New things, thoughtful ideas, and 10% off your first order.</p><form onSubmit={subscribe}><input type="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} required /><button aria-label="Subscribe" disabled={subscribing}><ArrowRight size={17} /></button></form>{message && <small>{message}</small>}</div>
    </div>
    <div className="footer-bottom"><span>© 2025 AUREL Studio</span><span>Thoughtfully made. Made to last.</span><span>Privacy&nbsp;&nbsp;&nbsp; Terms</span></div>
  </footer>;
}

function ProductCard({ product, index = 0 }) {
  const { wishlist, toggleWishlist, addToCart } = useShop();
  const isSaved = wishlist.some((item) => item.id === product.id);
  return <article className="product-card" style={{ "--card-index": index }}>
    <div className="product-image-wrap">
      <Link to={`/product/${product.id}`} className="product-image"><img src={product.imageUrl} alt={product.name} loading="lazy" /></Link>
      {product.tag && <span className={`product-tag ${product.tag === "NEW" ? "tag-new" : ""}`}>{product.tag}</span>}
      <button className={`wishlist-btn ${isSaved ? "is-saved" : ""}`} onClick={() => toggleWishlist(product)} aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}><Heart size={17} fill={isSaved ? "currentColor" : "none"} /></button>
      <button className="quick-add" onClick={() => addToCart(product)}>Quick add <Plus size={15} /></button>
    </div>
    <div className="product-info"><div><Link to={`/product/${product.id}`} className="product-name">{product.name}</Link><span className="product-color">{product.color}</span></div><div className="product-prices"><span>{money(product.price)}</span>{product.oldPrice && <del>{money(product.oldPrice)}</del>}</div></div>
    <div className="product-rating"><Star size={12} fill="currentColor" /> {product.rating} <span>·</span> <span>Reviews</span></div>
  </article>;
}

function Home() {
  return <>
    <main>
      <section className="hero">
        <img className="hero-image" src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2200&q=90" alt="Soft, considered everyday wardrobe" />
        <div className="hero-shade"></div>
        <div className="hero-content"><span className="eyebrow light-eyebrow"><span className="eyebrow-dot"></span> THE EVERYDAY EDIT — VOL. 04</span><h1>Make room<br />for <em>the good</em><br />things.</h1><p>Thoughtful pieces for a life well lived.<br />Less, but so much better.</p><Link className="button button-light" to="/shop">Shop the collection <ArrowRight size={16} /></Link><span className="hero-index">01 — 04</span></div>
        <div className="hero-caption">OBJECTS FOR SLOWER MORNINGS&nbsp;&nbsp; · &nbsp;&nbsp;SPRING / SUMMER 25</div>
      </section>
      <div className="service-strip"><div><Truck size={17} /><span>Complimentary shipping over $100</span></div><div><Sparkles size={17} /><span>Thoughtfully sourced, always</span></div><div><LockKeyhole size={16} /><span>Safe & secure checkout</span></div></div>
      <section className="section collection-section">
        <div className="section-heading"><div><span className="eyebrow">THE PIECES YOU KEEP</span><h2>Good things, <em>on repeat.</em></h2></div><Link className="text-link" to="/shop">Explore all pieces <ArrowRight size={15} /></Link></div>
        <div className="product-grid">{products.slice(0, 4).map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}</div>
      </section>
      <section className="category-feature">
        <div className="category-copy"><span className="eyebrow">A HOME THAT FEELS LIKE YOU</span><h2>Come home<br />to <em>calm.</em></h2><p>Warm textures and considered forms for the everyday rituals that make a house a home.</p><Link to="/shop?category=Home" className="button button-dark">Explore home <ArrowRight size={16} /></Link></div>
        <Link to="/shop?category=Home" className="category-image"><img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=85" alt="Warm minimalist living room" /><span>THE AUREL HOME COLLECTION <ArrowUpRight size={15} /></span></Link>
      </section>
      <section className="section edit-section"><div className="edit-heading"><span className="eyebrow">THE GOOD THINGS EDIT</span><h2>Picked with <em>purpose.</em></h2><p>A few things we think you’ll love, and love for a long time.</p></div><div className="product-grid">{products.slice(4, 8).map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}</div></section>
      <section className="quote-section"><span className="quote-mark">“</span><blockquote>“The kind of things you reach for<br />every day, and never get tired of.”</blockquote><div className="quote-byline"><div className="avatar">JM</div><div><strong>Julia M.</strong><span>Verified AUREL customer</span></div><div className="quote-stars">★★★★★</div></div></section>
      <section className="closing-banner"><div><span className="eyebrow light-eyebrow">A MORE CONSIDERED CLOSET</span><h2>Buy less.<br /><em>Choose well.</em></h2><Link to="/shop" className="button button-light">Find your everyday <ArrowRight size={16} /></Link></div></section>
    </main>
  </>;
}

function Shop() {
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState(params.get("sort") || "featured");
  const [category, setCategory] = useState(params.get("category") || "All pieces");
  const [minRating, setMinRating] = useState(0);
  const query = params.get("q") || "";
  const [maxPrice, setMaxPrice] = useState(250);
  const visible = useMemo(() => {
    let list = products.filter((p) => (category === "All pieces" || p.category === category) && p.price <= maxPrice && p.rating >= minRating && p.name.toLowerCase().includes(query.toLowerCase()));
    if (sort === "price-low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "new") list = [...list].reverse();
    if (sort === "popular") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [category, maxPrice, minRating, query, sort]);
  const chooseCategory = (value) => { setCategory(value); const next = new URLSearchParams(params); value === "All pieces" ? next.delete("category") : next.set("category", value); setParams(next); };
  return <main className="shop-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span> Shop</div><div className="shop-title"><div><span className="eyebrow">MADE FOR THE EVERYDAY</span><h1>{category === "All pieces" ? "All pieces" : category}</h1></div><span>{visible.length} considered essentials</span></div>
    <div className="shop-layout"><aside className="filters"><div className="filter-title">Filters <button onClick={() => { setMaxPrice(250); setMinRating(0); chooseCategory("All pieces"); }}>Clear all</button></div><div className="filter-group"><strong>Category</strong>{["All pieces", "Apparel", "Home", "Accessories"].map((item) => <button className={`filter-option ${category === item ? "active" : ""}`} onClick={() => chooseCategory(item)} key={item}><span className="filter-radio"></span>{item}<span className="filter-count">{item === "All pieces" ? products.length : products.filter((p) => p.category === item).length}</span></button>)}</div><div className="filter-group"><strong>Price range</strong><input className="price-slider" type="range" min="35" max="250" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} /><div className="price-range"><span>$35</span><span>Up to {money(maxPrice)}</span></div></div><div className="filter-group"><strong>Customer rating</strong>{[{ label: "Any rating", value: 0 }, { label: "4.5 & up", value: 4.5 }, { label: "4.8 & up", value: 4.8 }].map((item) => <button className={`filter-option ${minRating === item.value ? "active" : ""}`} key={item.value} onClick={() => setMinRating(item.value)}><span className="filter-radio"></span>{item.label}</button>)}</div><div className="filter-note"><Sparkles size={16} /><span>Every piece is selected for quality, comfort, and lasting design.</span></div></aside>
    <section className="shop-results"><div className="shop-toolbar"><span>{query ? `Results for “${query}”` : "A little something for every day."}</span><label>Sort by <select value={sort} onChange={(e) => { setSort(e.target.value); const next = new URLSearchParams(params); e.target.value === "featured" ? next.delete("sort") : next.set("sort", e.target.value); setParams(next); }}><option value="featured">Featured</option><option value="new">Newest</option><option value="popular">Most loved</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><ChevronDown size={14} /></label></div>{visible.length ? <div className="product-grid">{visible.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}</div> : <div className="empty-state"><Search size={26} /><h3>No pieces found</h3><p>Try a different search or clear your filters.</p><button className="text-link" onClick={() => { setMaxPrice(250); setMinRating(0); chooseCategory("All pieces"); setParams({}); }}>Clear filters <ArrowRight size={15} /></button></div>}</section></div>
  </main>;
}

function ProductDetail() {
  const { id } = useParams();
  const product = products.find((item) => item.id === id);
  const { addToCart, wishlist, toggleWishlist } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();
  if (!product) return <div className="empty-page"><h2>We couldn't find that piece.</h2><Link to="/shop" className="button button-dark">Back to the shop</Link></div>;
  const buyNow = () => { addToCart(product, quantity); navigate("/checkout"); };
  return <main className="detail-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span>{product.name}</div><div className="detail-grid"><div className="detail-gallery"><div className="detail-main-image"><img src={product.imageUrl} alt={product.name} /></div><div className="detail-thumb"><img src={product.imageUrl} alt={`${product.name} detail`} /></div><div className="gallery-note">MADE TO BE LIVED IN.</div></div><section className="detail-info"><span className="eyebrow">{product.category.toUpperCase()} · AUREL OBJECTS</span><h1>{product.name}</h1><div className="detail-rating"><span className="product-rating"><Star size={14} fill="currentColor" /> {product.rating}</span><a href="#reviews">Read 28 reviews</a></div><div className="detail-price">{money(product.price)} {product.oldPrice && <del>{money(product.oldPrice)}</del>}</div><p className="detail-description">Thoughtfully considered in every detail. Designed for everyday use, made with materials that feel as good as they look. This is the piece you’ll reach for again and again.</p><div className="detail-color"><span>Color</span><strong>{product.color.split(" / ")[0]}</strong><div className="swatch"></div></div><div className="detail-quantity"><span>Quantity</span><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={14} /></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}><Plus size={14} /></button></div></div><button className="button button-dark add-button" onClick={() => { addToCart(product, quantity); setAdded(true); setTimeout(() => setAdded(false), 2200); }}>{added ? <><Check size={17} /> Added to your bag</> : <>Add to bag — {money(product.price * quantity)} <ArrowRight size={16} /></>}</button><button className={`detail-wishlist ${wishlist.some((item) => item.id === product.id) ? "is-saved" : ""}`} onClick={() => toggleWishlist(product)}><Heart size={17} fill={wishlist.some((item) => item.id === product.id) ? "currentColor" : "none"} /> Save to wishlist</button><button className="buy-now" onClick={buyNow}>Buy now</button><div className="detail-perks"><div><Truck size={17} /><span>Free shipping over $100</span></div><div><Check size={17} /><span>Easy 30-day returns</span></div><div><Sparkles size={17} /><span>Thoughtfully made to last</span></div></div><div className="detail-accordion"><details open><summary>The details <ChevronDown size={16} /></summary><p>Designed with care, crafted from considered materials, and finished for everyday life. Made in small batches with quality built into every stitch and surface.</p></details><details id="reviews"><summary>Reviews <span>★★★★★ &nbsp; {product.rating}</span></summary><p>“Beautifully made, and even better in person.” — Verified customer</p></details></div></section></div><section className="section related-section"><div className="section-heading"><div><span className="eyebrow">MORE TO LOVE</span><h2>Good company.</h2></div><Link className="text-link" to="/shop">Shop all <ArrowRight size={15} /></Link></div><div className="product-grid">{products.filter((item) => item.id !== product.id).slice(0, 4).map((item, i) => <ProductCard key={item.id} product={item} index={i} />)}</div></section></main>;
}

function Cart() {
  const { cart, changeQuantity, removeFromCart, subtotal, coupon, setCoupon } = useShop();
  const [couponCode, setCouponCode] = useState(coupon?.code || "");
  const [couponMessage, setCouponMessage] = useState("");
  const [applying, setApplying] = useState(false);
  useEffect(() => {
    if (!coupon || coupon.subtotal === subtotal) return;
    let active = true;
    api.post("/coupons/validate", { code: coupon.code, subtotal })
      .then(({ data }) => { if (active) setCoupon({ ...data, subtotal }); })
      .catch((error) => { if (active) { setCoupon(null); setCouponMessage(error.response?.data?.message || "Coupon could not be applied to this total."); } });
    return () => { active = false; };
  }, [subtotal, coupon?.code]);
  const applyCoupon = async (event) => {
    event.preventDefault(); setApplying(true); setCouponMessage("");
    try {
      const { data } = await api.post("/coupons/validate", { code: couponCode, subtotal });
      setCoupon({ ...data, subtotal });
      setCouponMessage(`${data.code} applied — you saved ${money(data.discount)}.`);
    } catch (error) { setCouponMessage(error.response?.data?.message || "Coupon could not be validated."); }
    finally { setApplying(false); }
  };
  const discount = coupon?.subtotal === subtotal ? coupon.discount : 0;
  const shipping = subtotal - discount >= 100 || subtotal === 0 ? 0 : 8;
  return <main className="cart-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span> Your bag</div><div className="cart-heading"><div><span className="eyebrow">GOOD CHOICES</span><h1>Your bag <span>({cart.reduce((n, item) => n + item.quantity, 0)})</span></h1></div><Link className="text-link" to="/shop"><ArrowLeft size={15} /> Keep exploring</Link></div>{cart.length ? <div className="cart-layout"><section className="cart-items"><div className="cart-table-head"><span>Piece</span><span>Price</span><span>Quantity</span><span>Total</span></div>{cart.map((item) => <article className="cart-row" key={item.id}><Link to={`/product/${item.id}`} className="cart-product-image"><img src={item.imageUrl} alt={item.name} /></Link><div className="cart-product-name"><Link to={`/product/${item.id}`}>{item.name}</Link><span>{item.color}</span><button onClick={() => removeFromCart(item.id)}><Trash2 size={13} /> Remove</button></div><span className="cart-price">{money(item.price)}</span><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => changeQuantity(item.id, item.quantity - 1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => changeQuantity(item.id, item.quantity + 1)}><Plus size={13} /></button></div><strong className="cart-total">{money(item.price * item.quantity)}</strong></article>)}<div className="cart-note"><Sparkles size={16} /> Thoughtful pieces, on their way to you.</div></section><aside className="order-summary"><h2>Order summary</h2><form className="coupon-form" onSubmit={applyCoupon}><label htmlFor="coupon-code">Have a good code?</label><div><input id="coupon-code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter code" /><button disabled={applying}>{applying ? "…" : "Apply"}</button></div></form>{couponMessage && <p className="coupon-message">{couponMessage}</p>}<div className="summary-line"><span>Subtotal</span><span>{money(subtotal)}</span></div>{discount > 0 && <div className="summary-line discount-line"><span>Discount · {coupon.code}</span><span>−{money(discount)}</span></div>}<div className="summary-line"><span>Shipping</span><span>{shipping === 0 ? "Complimentary" : money(shipping)}</span></div><p className="shipping-message">{subtotal - discount >= 100 ? "You’ve unlocked complimentary shipping." : `You're ${money(Math.max(0, 100 - subtotal + discount))} away from free shipping.`}</p><div className="summary-total"><strong>Total</strong><strong>{money(subtotal - discount + shipping)}</strong></div><span className="tax-note">Taxes included where applicable</span><Link className="button button-dark checkout-button" to="/checkout">Continue to checkout <ArrowRight size={16} /></Link><div className="secure-note"><LockKeyhole size={14} /> Secure checkout</div></aside></div> : <div className="empty-state cart-empty"><ShoppingBag size={30} /><h2>Your bag is taking a breather.</h2><p>Find something lovely to bring home.</p><Link to="/shop" className="button button-dark">Explore the collection <ArrowRight size={16} /></Link></div>}</main>;
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Secure payment checkout could not be loaded."));
    document.body.appendChild(script);
  });
}

function Checkout() {
  const { cart, subtotal, user, coupon, clearCart } = useShop();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const discount = coupon?.subtotal === subtotal ? coupon.discount : 0;
  const shipping = subtotal - discount >= 100 ? 0 : 8;
  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!cart.length) { setStatus("Your bag is empty. Add a piece before checking out."); return; }
    let paymentFlowStarted = false;
    setBusy(true); setStatus("");
    try {
      const token = localStorage.getItem("aurel-token");
      const response = await api.post("/orders", {
        items: cart.map((item) => ({ product: item.id, quantity: item.quantity })),
        shippingAddress: { name: form.get("name"), email: form.get("email"), phone: form.get("phone"), address: form.get("address"), city: form.get("city"), postalCode: form.get("postalCode"), country: form.get("country") },
        paymentMethod: form.get("paymentMethod"),
        ...(coupon?.code ? { couponCode: coupon.code } : {})
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const { order, payment } = response.data;
      if (payment) {
        await loadRazorpay();
        const checkout = new window.Razorpay({
          key: payment.keyId,
          order_id: payment.orderId,
          amount: payment.amount,
          currency: payment.currency,
          name: "AUREL",
          description: "Your considered essentials",
          prefill: { name: form.get("name"), email: form.get("email"), contact: form.get("phone") },
          handler: async (paymentResponse) => {
            setBusy(true);
            try {
              await api.post(`/orders/${order._id}/verify-payment`, paymentResponse, { headers: { Authorization: `Bearer ${token}` } });
              clearCart();
              setStatus(`Payment confirmed. Order ${order._id} is on its way.`);
            } catch (error) {
              setStatus(error.response?.data?.message || "Payment confirmation could not be verified. Please contact support before retrying.");
            } finally { setBusy(false); }
          },
          modal: { ondismiss: () => { setBusy(false); setStatus("Payment was not completed. Your order is still awaiting payment."); } },
          theme: { color: "#858b6e" }
        });
        checkout.open();
        paymentFlowStarted = true;
      } else {
        clearCart();
        setStatus(`Order ${order?._id || ""} placed. A confirmation is on its way.`);
      }
    } catch (error) {
      setStatus(error.response?.data?.message || "We couldn't place your order. Please check your connection and try again.");
    } finally { if (!paymentFlowStarted) setBusy(false); }
  };
  return <main className="checkout-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/cart">Your bag</Link><span>/</span> Checkout</div><div className="checkout-title"><span className="eyebrow">ALMOST YOURS</span><h1>Let’s make it <em>official.</em></h1></div><form className="checkout-layout" onSubmit={submit}><div className="checkout-fields">{!user && <div className="checkout-signin">Sign in is required to place an order. <Link to="/login">Sign in or create an account <ArrowRight size={13} /></Link></div>}<section className="checkout-card"><div className="checkout-card-heading"><span>01</span><h2>Contact information</h2></div><div className="form-grid"><label className="full">Email address<input name="email" type="email" defaultValue={user?.email || ""} placeholder="you@example.com" required /></label><label className="full">Full name<input name="name" defaultValue={user?.name || ""} placeholder="Your name" required /></label><label>Phone number<input name="phone" type="tel" placeholder="+1 (555) 000-0000" required /></label></div></section><section className="checkout-card"><div className="checkout-card-heading"><span>02</span><h2>Delivery details</h2></div><div className="form-grid"><label className="full">Street address<input name="address" placeholder="House number and street" required /></label><label>City<input name="city" placeholder="City" required /></label><label>Postal code<input name="postalCode" placeholder="ZIP / postal code" required /></label><label className="full">Country<input name="country" defaultValue="United States" required /></label></div></section><section className="checkout-card"><div className="checkout-card-heading"><span>03</span><h2>Payment</h2></div><label className="payment-option"><input type="radio" name="paymentMethod" value="cod" defaultChecked /><span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span><span className="payment-pill">Available</span></label><label className="payment-option"><input type="radio" name="paymentMethod" value="razorpay" /><span><strong>Pay online</strong><small>Secure payment through Razorpay</small></span><span className="payment-pill">Razorpay</span></label><p className="payment-hint">Online payment is processed only when Razorpay is configured for this store.</p></section>{status && <div className={`form-message ${status.startsWith("Order") || status.startsWith("Payment confirmed") ? "success" : ""}`}>{status}</div>}</div><aside className="order-summary checkout-summary"><h2>Your order</h2>{cart.map((item) => <div className="checkout-item" key={item.id}><div className="checkout-item-image"><img src={item.imageUrl} alt="" /><span>{item.quantity}</span></div><span>{item.name}</span><strong>{money(item.price * item.quantity)}</strong></div>)}<div className="summary-line"><span>Subtotal</span><span>{money(subtotal)}</span></div>{discount > 0 && <div className="summary-line discount-line"><span>Discount · {coupon.code}</span><span>−{money(discount)}</span></div>}<div className="summary-line"><span>Shipping</span><span>{shipping ? money(shipping) : "Complimentary"}</span></div><div className="summary-total"><strong>Total</strong><strong>{money(subtotal - discount + shipping)}</strong></div><button className="button button-dark checkout-button" type="submit" disabled={busy || cart.length === 0 || !user}>{busy ? "Placing your order…" : <>Place your order <ArrowRight size={16} /></>}</button><div className="secure-note"><LockKeyhole size={14} /> Your information is safe with us</div></aside></form></main>;
}

function Login() {
  const { signIn } = useShop();
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMessage("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const result = await api.post(`/auth/${mode}`, data);
      if (mode === "forgot-password") { setMessage(result.data.message || "If an account exists for that email, reset instructions have been sent."); }
      else { localStorage.setItem("aurel-token", result.data.token); signIn(result.data.user); navigate("/account"); }
    } catch (error) { setMessage(error.response?.data?.message || "We couldn't connect to the account service. Please try again."); }
    finally { setBusy(false); }
  };
  return <main className="auth-page"><div className="auth-card"><span className="eyebrow">{mode === "register" ? "A GOOD PLACE TO BEGIN" : "WELCOME BACK"}</span><h1>{mode === "register" ? "Make yourself at home." : mode === "forgot-password" ? "Forgot your password?" : "Good to see you."}</h1><p>{mode === "register" ? "Create an account to save your favorites and keep track of the good things." : mode === "forgot-password" ? "Enter your email and we’ll send password reset instructions." : "Sign in to pick up right where you left off."}</p><form onSubmit={submit}>{mode === "register" && <label>Your name<input name="name" placeholder="Your name" required /></label>}<label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label>{mode !== "forgot-password" && <label>Password<input name="password" type="password" placeholder="At least 8 characters" minLength="8" required /></label>}{message && <div className="form-message">{message}</div>}<button type="submit" className="button button-dark checkout-button" disabled={busy}>{busy ? "One moment…" : mode === "register" ? "Create account" : mode === "forgot-password" ? "Send instructions" : "Sign in"} <ArrowRight size={16} /></button></form><div className="auth-switch">{mode === "login" ? <><button onClick={() => setMode("forgot-password")}>Forgot password?</button><span>New here? <button onClick={() => setMode("register")}>Create an account</button></span></> : <span>Already have an account? <button onClick={() => setMode("login")}>Sign in</button></span>}</div><div className="auth-assurance"><LockKeyhole size={14} /> Your details stay private and secure.</div></div></main>;
}

function Account() {
  const { user, signOut, wishlist } = useShop();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const loadOrders = async () => {
    try { const token = localStorage.getItem("aurel-token"); const response = await api.get("/orders/my-orders", { headers: { Authorization: `Bearer ${token}` } }); setOrders(response.data.orders || []); }
    catch (error) { setMessage(error.response?.data?.message || "Order history is unavailable right now."); }
  };
  if (!user) return <main className="empty-page"><h2>Your account is waiting.</h2><Link to="/login" className="button button-dark">Sign in</Link></main>;
  return <main className="account-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span> My account</div><span className="eyebrow">YOUR AUREL</span><h1>Hello, {user.name?.split(" ")[0] || "friend"}.</h1><p className="account-intro">All your good things, in one place.</p><div className="account-grid"><section className="account-card"><div className="account-card-heading"><h2>Order history</h2><button className="text-link" onClick={loadOrders}>View orders <ArrowRight size={15} /></button></div>{orders.length ? orders.map((order) => <div className="account-order" key={order._id}><span>Order #{order._id.slice(-6).toUpperCase()}</span><strong>{order.status}</strong><span>{money(order.total || 0)}</span></div>) : <div className="account-empty"><ShoppingBag size={22} /><p>{message || "Your first order will feel right at home here."}</p><button onClick={loadOrders} className="text-link">Load order history <ArrowRight size={14} /></button></div>}</section><section className="account-card"><div className="account-card-heading"><h2>Saved pieces</h2><span>{wishlist.length} saved</span></div>{wishlist.length ? <div className="saved-grid">{wishlist.map((p) => <Link to={`/product/${p.id}`} key={p.id}><img src={p.imageUrl} alt={p.name} /><span>{p.name}</span></Link>)}</div> : <div className="account-empty"><Heart size={22} /><p>Save a few favorites and find them here later.</p><Link to="/shop" className="text-link">Explore pieces <ArrowRight size={14} /></Link></div>}</section></div><button className="signout-button" onClick={() => { signOut(); localStorage.removeItem("aurel-token"); navigate("/"); }}>Sign out <ArrowRight size={15} /></button></main>;
}

function Admin() {
  const { user } = useShop();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const token = localStorage.getItem("aurel-token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const load = async (section = tab) => {
    setMessage("");
    try {
      if (section === "overview") setOverview((await api.get("/admin/overview", { headers })).data);
      if (section === "products") setProductsList((await api.get("/products?limit=50")).data.products || []);
      if (section === "orders") setOrders((await api.get("/orders?limit=50", { headers })).data.orders || []);
      if (section === "customers") setCustomers((await api.get("/admin/customers?limit=50", { headers })).data.customers || []);
    } catch (error) { setMessage(error.response?.data?.message || "Admin data is unavailable."); }
  };
  useEffect(() => { if (user?.role === "admin") load("overview"); }, [user?.role]);
  const createProduct = async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));
    try {
      let imageUrl = form.imageUrl;
      const imageFile = formElement.elements.imageFile.files[0];
      if (imageFile) {
        const uploadForm = new FormData();
        uploadForm.append("image", imageFile);
        const uploaded = await api.post("/uploads", uploadForm, { headers });
        imageUrl = `${api.defaults.baseURL.replace(/\/api\/?$/, "")}${uploaded.data.imageUrl}`;
      }
      await api.post("/products", { name: form.name, category: form.category, price: Number(form.price), stock: Number(form.stock), imageUrl, description: form.description }, { headers });
      formElement.reset();
      await load("products");
      setMessage("Product added to the catalog.");
    } catch (error) { setMessage(error.response?.data?.message || "Product could not be saved."); }
    finally { setBusy(false); }
  };
  const saveProduct = async (event, id) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api.put(`/products/${id}`, { name: form.name, category: form.category, price: Number(form.price), stock: Number(form.stock), imageUrl: form.imageUrl, description: form.description }, { headers });
      setEditingProduct(null);
      await load("products");
      setMessage("Product updated.");
    } catch (error) { setMessage(error.response?.data?.message || "Product could not be updated."); }
    finally { setBusy(false); }
  };
  const updateOrder = async (id, status) => {
    try { await api.put(`/orders/${id}/status`, { status }, { headers }); await load("orders"); }
    catch (error) { setMessage(error.response?.data?.message || "Order status could not be updated."); }
  };
  const refundOrder = async (id) => {
    if (!window.confirm("Submit a full refund through Razorpay?")) return;
    try { await api.post(`/orders/${id}/refund`, {}, { headers }); await load("orders"); }
    catch (error) { setMessage(error.response?.data?.message || "Refund could not be submitted."); }
  };
  if (!user || user.role !== "admin") return <main className="empty-page"><span className="eyebrow">PRIVATE STORE AREA</span><h2>Administrator access is required.</h2><Link to="/login" className="button button-dark">Sign in to continue <ArrowRight size={16} /></Link></main>;
  const tabs = ["overview", "products", "orders", "customers"];
  return <main className="account-page"><span className="eyebrow">AUREL STUDIO</span><h1>Store dashboard.</h1><p className="account-intro">A considered view of your store.</p><nav className="admin-tabs">{tabs.map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => { setTab(item); load(item); }}>{item}</button>)}</nav>{message && <div className="form-message admin-message">{message}</div>}
    {tab === "overview" && <><div className="admin-stats"><div><span>Total sales</span><strong>{overview ? money(overview.revenue || 0) : "—"}</strong></div><div><span>Total orders</span><strong>{overview?.orders ?? "—"}</strong></div><div><span>Customers</span><strong>{overview?.customers ?? "—"}</strong></div><div><span>Products</span><strong>{overview?.products ?? "—"}</strong></div></div><section className="account-card admin-card"><div className="account-card-heading"><h2>Recent orders</h2><button className="text-link" onClick={() => { setTab("orders"); load("orders"); }}>All orders <ArrowRight size={15} /></button></div>{overview?.recentOrders?.length ? overview.recentOrders.map((order) => <div className="admin-product" key={order._id}><span>{order.user?.name || "Customer"} · {order._id.slice(-6).toUpperCase()}</span><span>{money(order.total)}</span><span>{order.status}</span></div>) : <p className="admin-note">No orders to show yet.</p>}</section></>}
    {tab === "products" && <section className="account-card admin-card"><div className="account-card-heading"><h2>Product catalog</h2><button className="text-link" onClick={() => load("products")}>Refresh <ArrowRight size={15} /></button></div><form className="admin-product-form" onSubmit={createProduct}><input name="name" placeholder="Product name" required /><input name="category" placeholder="Category" required /><input name="price" type="number" min="0" step="0.01" placeholder="Price" required /><input name="stock" type="number" min="0" placeholder="Stock" required /><input className="admin-wide" name="imageUrl" type="url" placeholder="Image URL or upload an image" /><input className="admin-wide" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" /><input className="admin-wide" name="description" placeholder="Description" /><button className="button button-dark" disabled={busy}>{busy ? "Saving…" : "Add product"}</button></form>{productsList.map((p) => editingProduct === p._id ? <form className="admin-inline-edit" key={p._id} onSubmit={(e) => saveProduct(e, p._id)}><input name="name" defaultValue={p.name} required /><input name="category" defaultValue={p.category} required /><input name="price" type="number" min="0" step="0.01" defaultValue={p.price} required /><input name="stock" type="number" min="0" defaultValue={p.stock} required /><input className="admin-wide" name="imageUrl" type="url" defaultValue={p.imageUrl} /><input className="admin-wide" name="description" defaultValue={p.description} /><button className="text-link" disabled={busy}>Save changes</button><button type="button" className="text-link" onClick={() => setEditingProduct(null)}>Cancel</button></form> : <div className="admin-product" key={p._id}><span>{p.name} · {p.category}</span><span>{money(p.price)}</span><span>{p.stock} in stock <button onClick={() => setEditingProduct(p._id)}>Edit</button><button onClick={async () => { try { await api.delete(`/products/${p._id}`, { headers }); await load("products"); } catch (error) { setMessage(error.response?.data?.message || "Product could not be archived."); } }}>Archive</button></span></div>)}</section>}
    {tab === "orders" && <section className="account-card admin-card"><div className="account-card-heading"><h2>All orders</h2><button className="text-link" onClick={() => load("orders")}>Refresh <ArrowRight size={15} /></button></div>{orders.map((order) => { const nextStatuses = { processing: ["confirmed", "cancelled"], confirmed: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [], refunded: [] }[order.status] || []; return <div className="admin-product" key={order._id}><span>{order.user?.name || "Customer"} · {order._id.slice(-6).toUpperCase()}<small>{order.paymentStatus} · {order.paymentMethod}</small></span><span>{money(order.total)}</span><div className="admin-order-actions"><select value={order.status} onChange={(e) => updateOrder(order._id, e.target.value)}>{[order.status, ...nextStatuses].map((status) => <option value={status} key={status}>{status}</option>)}</select>{order.paymentMethod === "razorpay" && order.paymentStatus === "paid" && <button onClick={() => refundOrder(order._id)}>Refund</button>}</div></div>; })}</section>}
    {tab === "customers" && <section className="account-card admin-card"><div className="account-card-heading"><h2>Customers</h2><button className="text-link" onClick={() => load("customers")}>Refresh <ArrowRight size={15} /></button></div>{customers.map((customer) => <div className="admin-product" key={customer._id}><span>{customer.name}</span><span>{customer.email}</span><span>Joined {new Date(customer.createdAt).toLocaleDateString()}</span></div>)}</section>}
  </main>;
}

function NotFound() { return <main className="empty-page"><span className="eyebrow">404 — NOT FOUND</span><h2>This page took a different turn.</h2><Link to="/" className="button button-dark">Back home <ArrowRight size={16} /></Link></main>; }

export default function App() {
  return <><Header /><Routes><Route path="/" element={<Home />} /><Route path="/shop" element={<Shop />} /><Route path="/product/:id" element={<ProductDetail />} /><Route path="/cart" element={<Cart />} /><Route path="/checkout" element={<Checkout />} /><Route path="/login" element={<Login />} /><Route path="/account" element={<Account />} /><Route path="/admin" element={<Admin />} /><Route path="*" element={<NotFound />} /></Routes><Footer /></>;
}
