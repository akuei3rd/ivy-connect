import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Briefcase, Video, MessageSquare, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backTo?: string;
}

export const AppHeader = ({ title, showBackButton = false, backTo }: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4 mb-4">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBack}
              className="hover:bg-accent transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>}
        </div>

        <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <NavLink to="/home" icon={<Home className="w-4 h-4" />}>
            Feed
          </NavLink>
          <NavLink to="/browse" icon={<Users className="w-4 h-4" />}>
            Browse
          </NavLink>
          <NavLink to="/jobs" icon={<Briefcase className="w-4 h-4" />}>
            Jobs
          </NavLink>
          <NavLink to="/hiring-sessions" icon={<Video className="w-4 h-4" />}>
            Hiring Sessions
          </NavLink>
          <NavLink to="/messages" icon={<MessageSquare className="w-4 h-4" />}>
            Messages
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
