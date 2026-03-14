import { memo } from "react";

interface NavItemProps {
  id: string;
  num: number;
  label: string;
  sep: boolean;
  active: boolean;
  visited: boolean;
  onClick: () => void;
}

function NavItemInner(props: NavItemProps) {
  const { num, label, sep, active, visited, onClick } = props;
  const cls = `${active ? "active" : ""} ${sep ? "nav-sep" : ""}`;
  return (
    <button className={cls} onClick={onClick}>
      <span className="num">{num}</span>
      <span>{label}</span>
      {visited && !active && (
        <span className="visited-dot" aria-label="déjà visitée" />
      )}
    </button>
  );
}

const NavItem = memo(NavItemInner);
export default NavItem;
