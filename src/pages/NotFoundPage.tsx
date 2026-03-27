import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-svh gap-4">
      <h1 className="text-4xl font-bold">Oops! Page not found</h1>
      <p className="text-muted-foreground">Noctis Hub · Sistema de gestión hotelera</p>
      <Link to="/">
        <Button variant="outline">Return to Home</Button>
      </Link>
    </div>
  );
}
