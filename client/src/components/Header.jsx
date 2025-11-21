import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiLogOut, FiMapPin, FiUser } from "react-icons/fi";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { RiSearchLine } from "react-icons/ri";
import { AiOutlineHeart } from "react-icons/ai";

import { setFilters } from "../store/slices/productSlice.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getProductImage } from "../utils/assets.js";

const TIER_LABELS = {
  bronze: "Đồng",
  silver: "Bạc",
  gold: "Vàng",
  diamond: "Kim cương",
};

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [hidden, setHidden] = useState(false);
  const favoritesRef = useRef(null);

  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const cartCount = useSelector((state) => state.cart.totalQuantity);
  const favorites = useSelector((state) => state.favorites.items);
  const favoritesCount = favorites.length;
  const favoritesPreview = favorites.slice(0, 4);
  const tierLabel = user ? TIER_LABELS[user.customerTier] : null;
  const productFilters = useSelector((state) => state.products?.filters || {});

  useEffect(() => {
    setQuery(productFilters.search ?? "");
  }, [productFilters.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!favoritesRef.current) return;
      if (!favoritesRef.current.contains(event.target)) {
        setShowFavorites(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setShowFavorites(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(setFilters({ search: query.trim(), page: 1 }));
    }, 250);
    return () => clearTimeout(handler);
  }, [dispatch, query]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const current = window.scrollY;
      setIsCompact(current > 40);
      if (current > lastScrollY + 10 && current > 120) {
        setHidden(true);
      } else if (current < lastScrollY - 10) {
        setHidden(false);
      }
      lastScrollY = current;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    dispatch(setFilters({ search: trimmed, page: 1 }));
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("search", trimmed);
    }
    navigate(
      { pathname: "/", search: params.toString() || undefined },
      { replace: location.pathname === "/" }
    );
  };

  const chipPadding = isCompact ? "py-1 text-xs" : "py-1.5 text-sm";
  const actionChip =
    "rounded-full border border-white/25 px-4 font-semibold text-white/90 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-brand-primary flex items-center justify-center gap-2";

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div
        className={`relative bg-gradient-to-r from-brand-primary via-brand-dark to-slate-900 text-white shadow-header transition-all duration-300 ${
          isCompact ? "py-2" : "py-4"
        }`}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60" />
        <span
          aria-hidden
          className="pointer-events-none absolute -left-16 top-0 h-full w-48 rounded-full bg-white/10 blur-3xl"
        />
        <div className="container-safe relative z-10 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-[220px] items-center gap-3">
              <Link
                to="/"
                className={`flex items-center gap-2 font-display font-semibold uppercase tracking-tight text-white transition hover:text-white/80 ${
                  isCompact ? "text-xl" : "text-2xl"
                }`}
              >
                <span className="rounded-full bg-white px-3 py-1 text-brand-primary shadow">
                  Cellphone
                </span>
                <span>Shop</span>
              </Link>
              <div className="hidden items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/80 lg:flex">
                <FiMapPin size={18} />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/60">Giao đến</p>
                  <p className="text-sm font-semibold text-white">TP. Hồ Chí Minh</p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className={`flex flex-1 min-w-[280px] items-center gap-3 rounded-full border border-white/20 px-4 text-white shadow-halo backdrop-blur transition-all duration-300 ${
                isCompact ? "bg-white/15 py-1.5" : "bg-white/10 py-2"
              }`}
            >
              <label htmlFor="global-search" className="sr-only">
                Tìm kiếm sản phẩm
              </label>
              <RiSearchLine className="text-white/70" size={20} />
                <input
                  id="global-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm iPhone, Samsung, Xiaomi..."
                  className="w-full border-none bg-transparent text-sm text-white placeholder:text-white/70 outline-none focus:bg-transparent focus:ring-0 caret-white"
                />
              <button
                type="submit"
                className="rounded-full bg-gradient-to-r from-white to-white px-4 py-1.5 text-sm font-semibold text-brand-primary shadow transition hover:-translate-y-0.5 hover:from-brand-light hover:to-brand-dark hover:text-white"
              >
                Tìm kiếm
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex items-center gap-2 rounded-full border border-white/30 px-3 py-1.5 text-xs text-white/80 lg:hidden">
                <FiMapPin size={16} />
                <span>TP. Hồ Chí Minh</span>
              </div>

              <div className="relative" ref={favoritesRef}>
                <button
                  type="button"
                  onClick={() => setShowFavorites((prev) => !prev)}
                  className={`${actionChip} ${chipPadding} ${favoritesCount ? "bg-white/10" : ""}`}
                >
                  <AiOutlineHeart size={18} />
                  <span>Yêu thích</span>
                  {favoritesCount > 0 && (
                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-brand-primary">
                      {favoritesCount}
                    </span>
                  )}
                </button>
                {showFavorites && (
                  <div className="absolute right-0 top-[115%] z-50 w-[320px] rounded-3xl border border-slate-100 bg-white/95 p-5 text-left text-slate-700 shadow-2xl">
                    <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                      <span>YÊU THÍCH</span>
                      <span>
                        {Math.min(favoritesPreview.length, favoritesCount)}/{favoritesCount}
                      </span>
                    </div>
                    {favoritesPreview.length ? (
                      <div className="space-y-3">
                        {favoritesPreview.map((item) => (
                          <Link
                            key={item._id}
                            to={`/product/${item.slug}`}
                            className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-2 transition hover:border-brand-primary/60 hover:bg-slate-50"
                            onClick={() => setShowFavorites(false)}
                          >
                            <img
                              src={getProductImage(item, "https://placehold.co/48x48?text=No+Image")}
                              alt={item.name}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-500 line-clamp-1">{item.brand}</p>
                            </div>
                            <span className="text-xs font-semibold text-brand-primary">Xem</span>
                          </Link>
                        ))}
                        {favoritesCount > favoritesPreview.length && (
                          <p className="text-xs text-slate-500">
                            +{favoritesCount - favoritesPreview.length} mục khác trong danh sách.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-500">
                        Chưa có sản phẩm yêu thích.
                      </p>
                    )}
                    <Link
                      to="/favorites"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                      onClick={() => setShowFavorites(false)}
                    >
                      Xem tất cả
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/cart" className={`${actionChip} ${chipPadding}`}>
                <HiOutlineShoppingBag size={20} />
                <span>Giỏ hàng</span>
                {cartCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-brand-primary">
                    {cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <>
                  <div className={`${actionChip} ${chipPadding}`}>
                    <FiUser size={18} />
                    <div className="hidden flex-col text-left leading-tight sm:flex">
                      <span className="text-xs text-white/70">{user.email}</span>
                      <span className="text-sm font-semibold text-white">
                        {user.name?.split?.(" ")?.[0] || "Tài khoản"}
                      </span>
                      {tierLabel ? (
                        <span className="text-[10px] font-medium uppercase tracking-wide text-white/60">
                          {tierLabel}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-sm font-semibold text-white sm:hidden">
                      {user.name?.split?.(" ")?.[0] || "Tài khoản"}
                    </span>
                  </div>
                  <Link to="/profile" className={`${actionChip} ${chipPadding}`}>
                    Hồ sơ
                  </Link>
                  <Link
                    to={isAdmin ? "/admin" : "/orders"}
                    className={`${actionChip} ${chipPadding}`}
                  >
                    {isAdmin ? "Quản trị" : "Đơn hàng"}
                  </Link>
                  <Link to="/warranty" className={`${actionChip} ${chipPadding}`}>
                    Bảo hành
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className={`${actionChip} ${chipPadding}`}
                  >
                    <FiLogOut size={18} />
                    <span className="hidden sm:inline">Đăng xuất</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className={`${actionChip} ${chipPadding}`}>
                    <FiUser size={18} />
                    <span>Đăng nhập</span>
                  </Link>
                  <Link
                    to="/register"
                    className={`${actionChip} ${chipPadding} bg-gradient-to-r from-brand-primary to-brand-dark text-white hover:from-brand-dark hover:to-brand-primary`}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
