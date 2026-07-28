import { useEffect, useRef } from "react";
import type { Tab } from "../hooks/useAppNav";
import { HomeTabIcon, TripsTabIcon, PassportTabIcon, AccountTabIcon } from "./ui/icons";

interface Props {
  active: Tab;
  onSelect: (tab: Tab) => void;
}

const TABS: { tab: Tab; label: string; Icon: typeof HomeTabIcon }[] = [
  { tab: "home", label: "Home", Icon: HomeTabIcon },
  { tab: "trips", label: "Trips", Icon: TripsTabIcon },
  { tab: "passport", label: "Passport", Icon: PassportTabIcon },
  { tab: "account", label: "Account", Icon: AccountTabIcon },
];

export function TabBar({ active, onSelect }: Props) {
  const ref = useRef<HTMLElement>(null);

  // The bar is fixed, so it reserves no space of its own — .hp-app-body pads
  // itself by --tabbar-h instead. Publishing the bar's *measured* height keeps
  // the two in step through anything that changes it: the safe-area cushion
  // appearing when Safari's toolbar collapses, a font scaling up, a label
  // wrapping. A hardcoded constant would drift the first time one of those
  // changed and leave content tucked behind the bar.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () => {
      document.documentElement.style.setProperty("--tabbar-h", `${Math.round(el.offsetHeight)}px`);
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--tabbar-h");
    };
  }, []);

  return (
    <nav className="hp-tabbar" ref={ref}>
      {TABS.map(({ tab, label, Icon }) => (
        <button
          key={tab}
          type="button"
          className={`hp-tab ${active === tab ? "is-active" : ""}`.trim()}
          onClick={() => onSelect(tab)}
        >
          <Icon size={24} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
