import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CustomNavLinkProps {
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const NavLink = ({ to, children, icon }: CustomNavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium whitespace-nowrap",
        isActive
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      {icon}
      {children}
    </Link>
  );
};
