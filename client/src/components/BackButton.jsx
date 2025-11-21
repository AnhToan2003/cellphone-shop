import PropTypes from "prop-types";
import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const VARIANT_STYLES = {
  light:
    "border-white/40 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white focus-visible:ring-offset-0",
  dark:
    "border-slate-800 bg-slate-900/60 text-slate-100 hover:bg-slate-800/80 focus-visible:ring-slate-500 focus-visible:ring-offset-slate-950",
  neutral:
    "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-slate-100",
};

const BackButton = ({
  label = "Quay lại",
  fallback = "/",
  variant = "light",
  className = "",
  iconSize = 16,
  alwaysVisible = false,
  wrapperClassName = "",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setHasHistory(false);
      return;
    }
    const stateIndex = window.history?.state?.idx;
    if (Number.isInteger(stateIndex)) {
      setHasHistory(stateIndex > 0);
      return;
    }
    setHasHistory(window.history.length > 1);
  }, [location.key]);

  const variantClasses = useMemo(
    () => VARIANT_STYLES[variant] || VARIANT_STYLES.light,
    [variant]
  );

  const shouldRender = alwaysVisible || hasHistory;
  const handleBack = () => {
    if (hasHistory) {
      navigate(-1);
      return;
    }
    const shouldReplace = location.pathname === fallback;
    navigate(fallback, { replace: shouldReplace });
  };

  if (!shouldRender) {
    return null;
  }

  const button = (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${variantClasses} ${className}`}
      aria-label={label}
    >
      <FiArrowLeft size={iconSize} />
      <span>{label}</span>
    </button>
  );

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{button}</div>;
  }

  return button;
};

BackButton.propTypes = {
  fallback: PropTypes.string,
  label: PropTypes.string,
  variant: PropTypes.oneOf(["light", "dark", "neutral"]),
  className: PropTypes.string,
  iconSize: PropTypes.number,
  alwaysVisible: PropTypes.bool,
  wrapperClassName: PropTypes.string,
};

export default BackButton;
