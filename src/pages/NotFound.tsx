import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center gradient-dark">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-9xl font-display font-bold text-gradient">404</h1>
        <div className="space-y-2">
          <p className="text-2xl font-semibold">Page Not Found</p>
          <p className="text-muted-foreground">The page you're looking for doesn't exist</p>
        </div>
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all shadow-glow"
        >
          Return Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
