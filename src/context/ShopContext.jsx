import { createContext, useContext, useMemo, useState } from "react";

const ShopContext = createContext(null);
const readStored = (key, fallback) => {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    return stored ?? fallback;
  } catch {
    return fallback;
  }
};

export function ShopProvider({ children }) {
  const [cart, setCart] = useState(() => readStored("aurel-cart", []));
  const [wishlist, setWishlist] = useState(() => readStored("aurel-wishlist", []));
  const [user, setUser] = useState(() => readStored("aurel-user", null));
  const [coupon, setCouponState] = useState(() => readStored("aurel-coupon", null));
  const persist = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const addToCart = (product, quantity = 1) => {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      const next = found
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...current, { ...product, quantity }];
      persist("aurel-cart", next);
      return next;
    });
  };
  const changeQuantity = (id, quantity) => {
    setCart((current) => {
      const next = quantity < 1 ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? { ...item, quantity } : item);
      persist("aurel-cart", next);
      return next;
    });
  };
  const removeFromCart = (id) => changeQuantity(id, 0);
  const clearCart = () => {
    setCart([]);
    persist("aurel-cart", []);
    setCouponState(null);
    localStorage.removeItem("aurel-coupon");
  };
  const setCoupon = (value) => {
    setCouponState(value);
    if (value) persist("aurel-coupon", value);
    else localStorage.removeItem("aurel-coupon");
  };
  const toggleWishlist = (product) => {
    setWishlist((current) => {
      const next = current.some((item) => item.id === product.id)
        ? current.filter((item) => item.id !== product.id)
        : [...current, product];
      persist("aurel-wishlist", next);
      return next;
    });
  };
  const signIn = (account) => {
    setUser(account);
    persist("aurel-user", account);
  };
  const signOut = () => {
    setUser(null);
    localStorage.removeItem("aurel-user");
  };
  const value = useMemo(() => ({
    cart, wishlist, user, coupon, setCoupon, addToCart, changeQuantity, removeFromCart, clearCart,
    toggleWishlist, signIn, signOut,
    cartCount: cart.reduce((total, item) => total + item.quantity, 0),
    subtotal: cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }), [cart, wishlist, user, coupon]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
