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
  return (
    <nav className="hp-tabbar">
      {TABS.map(({ tab, label, Icon }) => (
        <button
          key={tab}
          type="button"
          className={`hp-tab ${active === tab ? "is-active" : ""}`.trim()}
          onClick={() => onSelect(tab)}
        >
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
