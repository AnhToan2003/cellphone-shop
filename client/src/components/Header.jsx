import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const favoritesRef = useRef(null);

  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const cartCount = useSelector((state) => state.cart.totalQuantity);
  const favorites = useSelector((state) => state.favorites.items);
  const favoritesCount = favorites.length;
  const favoritesPreview = favorites.slice(0, 4);
  const tierLabel = user ? TIER_LABELS[user.customerTier] : null;

  useEffect(() => {
    const current = searchParams.get("search") || "";
    setQuery(current);
  }, [searchParams]);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(setFilters({ search: query }));
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    navigate({ pathname: "/", search: params.toString() });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-brand-primary text-white shadow-header">
      <div className="container-safe">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 lg:flex-nowrap">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold uppercase tracking-tight"
          >
            <span className="rounded bg-white px-2 py-1 text-brand-primary shadow">
              Cellphone
            </span>
            <span>Shop</span>
          </Link>

          <form
            onSubmit={handleSubmit}
            className="flex-1 min-w-[240px] max-w-2xl"
          >
            <label htmlFor="global-search" className="sr-only">
              Tìm kiếm sản phẩm
            </label>
            <div className="flex items-center rounded-full bg-white px-4 py-2 shadow-md transition focus-within:ring-2 focus-within:ring-brand-light">
              <RiSearchLine className="mr-3 text-brand-primary" size={20} />
              <input
                id="global-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm iPhone, Samsung, Xiaomi..."
                className="w-full border-none text-sm text-slate-900 outline-none"
              />
              <button
                type="submit"
                className="ml-3 rounded-full bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          <div className="flex items-center gap-6 text-sm font-medium">
            <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 md:flex">
              <FiMapPin size={18} />
              <div className="leading-none">
                <p className="text-xs uppercase text-white/70">Giao đến</p>
                <p>TP. Hồ Chí Minh</p>
              </div>
            </div>

            <div className="relative hidden sm:flex" ref={favoritesRef}>
              <button
                type="button"
                onClick={() => setShowFavorites((prev) => !prev)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition hover:bg-white/20 ${
                  favoritesCount ? "bg-white/10" : ""
                }`}
                aria-expanded={showFavorites}
              >
                <AiOutlineHeart size={20} />
                <span>Yêu thích</span>
                {favoritesCount > 0 && (
                  <span className="absolute -right-3 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-brand-primary">
                    {favoritesCount}
                  </span>
                )}
              </button>
              {showFavorites && (
                <div className="absolute right-0 top-[120%] w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-left text-slate-700 shadow-xl">
                  <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                    <span>YÊU THÍCH</span>
                    <span>
                      {Math.min(favoritesPreview.length, favoritesCount)}/
                      {favoritesCount}
                    </span>
                  </div>
                  {favoritesPreview.length ? (
                    <div className="space-y-3">
                      {favoritesPreview.map((item) => (
                        <Link
                          key={item._id}
                          to={`/product/${item.slug}`}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 transition hover:border-brand-primary hover:bg-slate-50"
                          onClick={() => setShowFavorites(false)}
                        >
                          <img
                            src={getProductImage(
                              item,
                              "https://placehold.co/48x48?text=No+Image"
                            )}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {item.brand}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-brand-primary">
                            Xem
                          </span>
                        </Link>
                      ))}
                      {favoritesCount > favoritesPreview.length && (
                        <p className="text-xs text-slate-500">
                          +{favoritesCount - favoritesPreview.length} mục khác
                          trong danh sách.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-500">
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

            <Link
              to="/favorites"
              className="flex items-center gap-2 transition hover:text-brand-light sm:hidden"
            >
              <AiOutlineHeart size={20} />
              <span>Yêu thích</span>
              {favoritesCount > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-brand-primary">
                  {favoritesCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative flex items-center gap-2 transition hover:text-brand-light"
            >
              <HiOutlineShoppingBag size={22} />
              <span>Giỏ hàng</span>
              {cartCount > 0 && (
                <span className="absolute -right-3 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-brand-primary">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 rounded-full border border-white/30 px-3 py-1.5">
                  <FiUser size={18} />
                  <div className="hidden flex-col text-left leading-tight sm:flex">
                    <span className="text-xs text-white/70">{user.email}</span>
                    <span className="text-sm font-semibold text-white">
                      {user.name?.split?.(" ")?.[0] || "Tài khoản"}
                    </span>
                    {tierLabel ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-white/70">
                        {tierLabel}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-sm font-semibold text-white sm:hidden">
                    {user.name?.split?.(" ")?.[0] || "Tài khoản"}
                  </span>
                </div>
                <Link
                  to="/profile"
                  className="hidden items-center gap-2 rounded-full border border-white/30 px-3 py-1.5 text-sm font-semibold transition hover:bg-white hover:text-brand-primary md:flex"
                >
                  <span>Thông tin cá nhân</span>
                </Link>
                <Link
                  to={isAdmin ? "/admin" : "/orders"}
                  className="hidden items-center gap-2 rounded-full border border-white/30 px-3 py-1.5 text-sm font-semibold transition hover:bg-white hover:text-brand-primary md:flex"
                >
                  <span>{isAdmin ? "Quản trị" : "Đơn hàng"}</span>
                </Link>
                <Link
                  to="/warranty"
                  className="hidden items-center gap-2 rounded-full border border-white/30 px-3 py-1.5 text-sm font-semibold transition hover:bg-white hover:text-brand-primary md:flex"
                >
                  <span>Bảo hành</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 rounded-full border border-white/30 px-3 py-1.5 text-sm font-semibold transition hover:bg-white hover:text-brand-primary"
                >
                  <FiLogOut size={18} />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-full border border-white/30 px-4 py-1.5 transition hover:bg-white hover:text-brand-primary"
                >
                  <FiUser size={18} />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  to="/register"
                  className="hidden rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-light hover:text-white sm:inline"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
