import { createFileRoute, Link } from "@tanstack/react-router";
import { InstallGuide } from "@/components/install-guide";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/settings")({ component: Settings });
function Settings() { return <main className="mx-auto max-w-2xl space-y-4 p-4 pb-28"><h1 className="text-xl font-bold">Settings</h1><InstallGuide/><Link to="/"><Button variant="outline">Back to Community</Button></Link></main>; }
