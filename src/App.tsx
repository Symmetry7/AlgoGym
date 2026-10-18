import { AuthGate } from "@/components/auth/AuthGate";
import Index from "@/screens/Index";

export default function App() { return <AuthGate><Index /></AuthGate>; }

