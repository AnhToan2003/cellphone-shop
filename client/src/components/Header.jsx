import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiSearch,
  FiShoppingBag,
  FiHeart,
  FiUser,
  FiMenu,
  FiX,
  FiChevronDown,
  FiArrowRight,
  FiPhoneCall,
  FiShield,
  FiInfo,
  FiLogOut,
  FiPackage,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext.jsx";
import { setFilters } from "../store/slices/productSlice.js";
import { getProductImage } from "../utils/assets.js";
import { fetchPublicCategories } from "../services/api.js";

const TIER_LABELS = {
  bronze: "Đồng",
  silver: "Bạc",
  gold: "Vàng",
  diamond: "Kim cương",
};

const APPLE_NAV_CATALOG = [
  {
    name: "iPhone",
    to: "/products?category=iPhone",
    badge: "Hot",
    subCategories: [
      { name: "iPhone 16 Series", desc: "16 Pro Max, 16 Pro, 16 Plus, 16", to: "/products?category=iPhone&subCategory=iPhone+16+Series" },
      { name: "iPhone 15 Series", desc: "15 Pro Max, 15 Pro, 15", to: "/products?category=iPhone&subCategory=iPhone+15+Series" },
      { name: "iPhone 14 Series", desc: "14 Pro Max, 14 Plus, 14", to: "/products?category=iPhone&subCategory=iPhone+14+Series" },
      { name: "iPhone 13 Series", desc: "iPhone 13 quốc dân pin trâu", to: "/products?category=iPhone&subCategory=iPhone+13+Series" },
      { name: "iPhone 12 & Cũ hơn", desc: "iPhone 12, iPhone 11 giá cực tốt", to: "/products?category=iPhone&subCategory=iPhone+12+%26+C%C5%A9+h%C6%A1n" },
    ],
  },
  {
    name: "iPad",
    to: "/products?category=iPad",
    badge: "M4",
    subCategories: [
      { name: "iPad Pro", desc: "Chip M4 Tandem OLED 11\" & 13\"", to: "/products?category=iPad&subCategory=iPad+Pro" },
      { name: "iPad Air", desc: "Chip M2 mạnh mẽ đồ họa", to: "/products?category=iPad&subCategory=iPad+Air" },
      { name: "iPad Gen", desc: "iPad Gen 10 10.9\", Gen 9", to: "/products?category=iPad&subCategory=iPad+Gen" },
      { name: "iPad Mini", desc: "iPad Mini 6 nhỏ gọn đa năng", to: "/products?category=iPad&subCategory=iPad+Mini" },
    ],
  },
  {
    name: "Mac",
    to: "/products?category=Mac",
    badge: "M3",
    subCategories: [
      { name: "MacBook Pro", desc: "14\" & 16\" chip M3 Pro / M3 Max", to: "/products?category=Mac&subCategory=MacBook+Pro" },
      { name: "MacBook Air", desc: "13\" & 15\" chip M3 / M2 siêu nhẹ", to: "/products?category=Mac&subCategory=MacBook+Air" },
      { name: "iMac & Mac Mini", desc: "iMac 24\" M3, Mac mini M2 bàn làm việc", to: "/products?category=Mac&subCategory=iMac+%26+Mac+Mini" },
    ],
  },
  {
    name: "Watch",
    to: "/products?category=Apple Watch",
    badge: "S10",
    subCategories: [
      { name: "Apple Watch Ultra", desc: "Ultra 2 Titanium 49mm thám hiểm", to: "/products?category=Apple+Watch&subCategory=Apple+Watch+Ultra" },
      { name: "Apple Watch Series", desc: "Series 10 Nhôm 42mm & 46mm mỏng nhất", to: "/products?category=Apple+Watch&subCategory=Apple+Watch+Series" },
      { name: "Apple Watch SE", desc: "SE 2 theo dõi sức khỏe giá hợp lý", to: "/products?category=Apple+Watch&subCategory=Apple+Watch+SE" },
    ],
  },
  {
    name: "Phụ kiện",
    to: "/products?category=Phụ kiện",
    badge: "Chính hãng",
    subCategories: [
      { name: "Tai nghe & AirPods", desc: "AirPods Pro 2, AirPods 4 ANC, AirPods Max", to: "/products?category=Ph%E1%BB%A5+ki%E1%BB%87n&subCategory=Tai+nghe+%26+AirPods" },
      { name: "Củ sạc & Cáp sạc", desc: "Sạc nhanh 20W, 35W Dual, Cáp dù 60W", to: "/products?category=Ph%E1%BB%A5+ki%E1%BB%87n&subCategory=C%E1%BB%A7+s%E1%BA%A1c+%26+C%C3%A1p+s%E1%BA%A1c" },
      { name: "Ốp lưng & Bao da", desc: "Silicone Case MagSafe, Clear Case", to: "/products?category=Ph%E1%BB%A5+ki%E1%BB%87n&subCategory=%E1%BB%90p+l%C6%B0ng+%26+Bao+da" },
      { name: "Apple Pencil & Bàn phím", desc: "Pencil Pro, Magic Keyboard iPad M4, Magic Mouse", to: "/products?category=Ph%E1%BB%A5+ki%E1%BB%87n&subCategory=Apple+Pencil+%26+B%C3%A0n+ph%C3%ADm" },
    ],
  },
];

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);
  const [navCatalog, setNavCatalog] = useState(APPLE_NAV_CATALOG);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const res = await fetchPublicCategories();
        if (active && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const dynamic = res.data.data.map((c) => {
            const staticMatch = APPLE_NAV_CATALOG.find(
              (s) => s.name.toLowerCase() === c.name.toLowerCase()
            );
            return {
              name: c.name,
              to: `/products?category=${encodeURIComponent(c.name)}`,
              badge: staticMatch?.badge || (c.subCategories?.length ? `${c.subCategories.length} dòng` : ""),
              subCategories: (c.subCategories || []).map((sub) => {
                const staticSub = staticMatch?.subCategories?.find(
                  (s) => s.name.toLowerCase() === sub.toLowerCase()
                );
                return {
                  name: sub,
                  desc: staticSub?.desc || `Sản phẩm ${sub} chính hãng`,
                  to: `/products?category=${encodeURIComponent(c.name)}&subCategory=${encodeURIComponent(sub)}`,
                };
              }),
            };
          });
          setNavCatalog(dynamic);
        }
      } catch {
        // keep fallback
      }
    };
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  const headerRef = useRef(null);
  const favoritesRef = useRef(null);
  const userMenuRef = useRef(null);
  const megaMenuTimeoutRef = useRef(null);

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

  // Click outside handlers (supports both desktop mouse & mobile touch)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (favoritesRef.current && !favoritesRef.current.contains(event.target)) {
        setShowFavorites(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
        setMobileExpandedCat(null);
        setActiveMegaCategory(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowFavorites(false);
        setShowUserMenu(false);
        setIsMobileMenuOpen(false);
        setMobileExpandedCat(null);
        setActiveMegaCategory(null);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setShowFavorites(false);
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
    setActiveMegaCategory(null);
  }, [location.pathname, location.search]);

  // Scroll header shrink
  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track dynamic mobile navbar height
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, [isCompact, isMobileMenuOpen]);

  // Lock background scroll when mobile curtain is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    dispatch(setFilters({ search: trimmed, page: 1 }));
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("search", trimmed);
    }
    navigate({ pathname: "/products", search: params.toString() || undefined });
  };

  const handleMouseEnterNav = (cat) => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    setActiveMegaCategory(cat);
  };

  const handleMouseLeaveNav = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setActiveMegaCategory(null);
    }, 150);
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full transition-all duration-300 pt-[env(safe-area-inset-top,0px)] bg-slate-950"
      onMouseLeave={handleMouseLeaveNav}
    >
      {/* Main Apple-style Minimalist Header */}
      <div
        className={`bg-slate-950/95 backdrop-blur-xl border-b border-white/10 text-white shadow-xl transition-all duration-300 ${
          isCompact ? "py-1.5 sm:py-2.5" : "py-2 sm:py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand Name */}
          <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3 group shrink">
            <div className="relative shrink-0">
              <img
                src="/logo.jpg"
                alt="Ngọc Triết Store"
                className="h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-full border border-white/20 object-cover shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display text-sm sm:text-base md:text-lg font-bold tracking-tight text-white group-hover:text-slate-300 transition truncate">
                NgocTrietStore
              </span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium tracking-[0.15em] sm:tracking-[0.2em] text-slate-400 uppercase leading-none truncate">
                Apple Specialist
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Mega Menu Hover */}
          <nav className="hidden lg:flex items-center gap-1 text-xs xl:text-sm font-medium text-slate-300">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? "text-white bg-white/15 font-semibold shadow-sm"
                    : "hover:text-white hover:bg-white/5"
                }`
              }
            >
              Trang chủ
            </NavLink>

            {navCatalog.map((cat) => {
              const isHovered = activeMegaCategory?.name === cat.name;
              return (
                <div
                  key={cat.name}
                  className="relative"
                  onMouseEnter={() => handleMouseEnterNav(cat)}
                >
                  <NavLink
                    to={cat.to}
                    className={({ isActive }) =>
                      `flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 ${
                        isActive || isHovered
                          ? "text-white bg-white/15 font-semibold shadow-sm"
                          : "hover:text-white hover:bg-white/5"
                      }`
                    }
                  >
                    <span>{cat.name}</span>
                    <FiChevronDown
                      size={12}
                      className={`text-slate-400 transition-transform duration-200 ${
                        isHovered ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </NavLink>
                </div>
              );
            })}

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? "text-white bg-white/15 font-semibold shadow-sm"
                    : "hover:text-white hover:bg-white/5"
                }`
              }
            >
              Giới thiệu
            </NavLink>
          </nav>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xs xl:max-w-sm items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-sm text-white focus-within:border-white/30 focus-within:bg-white/10 transition duration-200"
          >
            <FiSearch className="text-slate-400 shrink-0" size={15} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm iPhone 16 Pro, iPad M4..."
              className="w-full bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  dispatch(setFilters({ search: "", page: 1 }));
                }}
                className="text-slate-400 hover:text-white"
              >
                <FiX size={13} />
              </button>
            )}
          </form>

          {/* Action Icons */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Favorites Button & Dropdown */}
            <div className="relative" ref={favoritesRef}>
              <button
                type="button"
                onClick={() => setShowFavorites((prev) => !prev)}
                className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition"
                aria-label="Sản phẩm yêu thích"
              >
                <FiHeart size={16} />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow">
                    {favoritesCount}
                  </span>
                )}
              </button>

              {/* Favorites Popover */}
              {showFavorites && (
                <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl border border-white/10 bg-slate-950/95 p-4 text-slate-200 shadow-2xl backdrop-blur-xl animate-fade-in-up">
                  <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                    <span>Yêu thích ({favoritesCount})</span>
                    <Link to="/favorites" className="text-blue-400 hover:underline">
                      Xem tất cả
                    </Link>
                  </div>
                  {favoritesPreview.length > 0 ? (
                    <div className="space-y-2">
                      {favoritesPreview.map((item) => (
                        <Link
                          key={item._id}
                          to={`/product/${item.slug}`}
                          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-2 hover:bg-white/10 transition"
                        >
                          <img
                            src={getProductImage(item, "https://placehold.co/48x48?text=Apple")}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-contain bg-white/5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <p className="text-[11px] text-blue-400 font-semibold">
                              {(item.finalPrice ?? item.price ?? 0).toLocaleString("vi-VN")}₫
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-xs text-slate-400">
                      Chưa có sản phẩm yêu thích nào.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition"
              aria-label="Giỏ hàng"
            >
              <FiShoppingBag size={16} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition"
                aria-label="Tài khoản"
              >
                <FiUser size={16} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-white/10 bg-slate-950/95 p-3 text-slate-200 shadow-2xl backdrop-blur-xl animate-fade-in-up">
                  {isAuthenticated ? (
                    <>
                      <div className="px-3 py-2 border-b border-white/10 mb-2">
                        <p className="text-xs font-bold text-white truncate">{user?.name || user?.username}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                        {tierLabel && (
                          <span className="inline-block mt-1 rounded bg-blue-500/20 px-2 py-0.5 text-[9px] font-semibold text-blue-300">
                            Hạng {tierLabel}
                          </span>
                        )}
                      </div>
                      <Link
                        to="/profile"
                        className="block px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded-xl transition"
                      >
                        Hồ sơ cá nhân
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded-xl transition"
                      >
                        Đơn hàng của tôi
                      </Link>
                      <Link
                        to="/warranty"
                        className="block px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded-xl transition"
                      >
                        Tra cứu bảo hành
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-600/20 rounded-xl transition mt-1"
                        >
                          Trang quản trị (Admin)
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition mt-1 border-t border-white/10"
                      >
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <div className="p-2 space-y-2">
                      <p className="text-xs text-slate-400 text-center">Đăng nhập tài khoản</p>
                      <Link
                        to="/login"
                        className="block w-full text-center rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        to="/register"
                        className="block w-full text-center rounded-xl border border-white/10 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 transition"
                      >
                        Tạo tài khoản
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/10 border border-white/15 text-slate-200 hover:text-white"
              aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            >
              {isMobileMenuOpen ? <FiX size={17} /> : <FiMenu size={17} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Row (visible on small screens) */}
        <div className="px-3 pt-2 pb-1 md:hidden">
          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs text-white focus-within:border-white/30"
          >
            <FiSearch className="text-slate-400 shrink-0" size={13} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm iPhone, iPad, Mac..."
              className="w-full min-w-0 bg-transparent border-none outline-none text-base sm:text-xs text-white placeholder:text-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  dispatch(setFilters({ search: "", page: 1 }));
                }}
                className="text-slate-400 hover:text-white"
                aria-label="Xóa tìm kiếm"
              >
                <FiX size={12} />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* APPLE MEGA MENU DROPDOWN (DESKTOP) */}
      {activeMegaCategory && (
        <div
          className="hidden lg:block border-b border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-fade-in-up"
          onMouseEnter={() => {
            if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeaveNav}
        >
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Danh Mục {activeMegaCategory.name}
                </span>
              </div>
              <Link
                to={activeMegaCategory.to}
                className="group flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
              >
                <span>Xem tất cả {activeMegaCategory.name}</span>
                <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Subcategories Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {activeMegaCategory.subCategories.map((sub) => (
                <Link
                  key={sub.name}
                  to={sub.to}
                  className="group flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200"
                >
                  <p className="text-sm font-bold text-white group-hover:text-blue-400 transition">
                    {sub.name}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {sub.desc}
                  </p>
                  <span className="mt-4 text-[11px] font-semibold text-slate-500 group-hover:text-slate-300 flex items-center gap-1">
                    Khám phá <span aria-hidden>→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* APPLE MOBILE NAVIGATION CURTAIN */}
      {isMobileMenuOpen && (
        <div
          style={{ top: `${headerHeight || 96}px` }}
          className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-[#090d16] border-t border-white/10 text-white overflow-y-auto overscroll-contain flex flex-col justify-between shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Navigation Tree */}
          <div className="px-4 py-4 space-y-4">
            {/* Category list */}
            <div className="divide-y divide-white/10">
              {navCatalog.map((cat) => {
                const isExpanded = mobileExpandedCat === cat.name;
                return (
                  <div key={cat.name} className="py-2.5">
                    <div className="flex items-center justify-between">
                      <Link
                        to={cat.to}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setMobileExpandedCat(null);
                        }}
                        className="text-[15px] font-semibold tracking-tight text-white hover:text-blue-400 transition flex items-center gap-2"
                      >
                        <span>{cat.name}</span>
                        {cat.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {cat.badge}
                          </span>
                        )}
                      </Link>
                      {cat.subCategories?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setMobileExpandedCat(isExpanded ? null : cat.name)}
                          className="p-1.5 text-slate-400 hover:text-white transition"
                          aria-label={`Mở rộng ${cat.name}`}
                        >
                          <FiChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${
                              isExpanded ? "rotate-180 text-blue-400" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Subcategories 2-column grid */}
                    {isExpanded && cat.subCategories?.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/5 space-y-2 animate-fade-in-up">
                        <Link
                          to={cat.to}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setMobileExpandedCat(null);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300"
                        >
                          <span>Xem tất cả {cat.name}</span>
                          <FiArrowRight size={11} />
                        </Link>
                        <div className="grid grid-cols-2 gap-1.5">
                          {cat.subCategories.map((sub) => (
                            <Link
                              key={sub.name}
                              to={sub.to}
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setMobileExpandedCat(null);
                              }}
                              className="text-xs text-slate-200 hover:text-white py-1.5 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition truncate"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Services / Links */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <NavLink
                to="/warranty"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setMobileExpandedCat(null);
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-white/[0.06] transition"
              >
                <FiShield className="text-blue-400 shrink-0" size={15} />
                <span>Chính sách bảo hành 1 đổi 1</span>
              </NavLink>

              <NavLink
                to="/about"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setMobileExpandedCat(null);
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-white/[0.06] transition"
              >
                <FiInfo className="text-blue-400 shrink-0" size={15} />
                <span>Giới thiệu Ngọc Triết Store</span>
              </NavLink>

              <a
                href="tel:0922444444"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <FiPhoneCall className="text-emerald-400 shrink-0" size={15} />
                <span>
                  Hotline hỗ trợ: <strong className="text-white">0922 444 444</strong>
                </span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
