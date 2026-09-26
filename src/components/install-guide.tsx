import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export function InstallGuide({ firstVisit = false }: { firstVisit?: boolean }) {
  const [open, setOpen] = useState(!firstVisit);
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setPlatform(/Android/i.test(navigator.userAgent) ? "android" : "ios");
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    if (firstVisit && mobile && !standalone && !window.localStorage.getItem("grow-install-help-seen")) setOpen(true);
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setOpen(false); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("appinstalled", onInstalled); };
  }, [firstVisit]);
  const dismiss = () => { setOpen(false); if (firstVisit) window.localStorage.setItem("grow-install-help-seen", "1"); };
  if (firstVisit && !open) return null;
  return <Card className={firstVisit ? "fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-md space-y-3 p-4 shadow-xl" : "space-y-3 p-4"}>
    <h2 className="text-lg font-semibold">Install Grow Cambodia</h2>
    <p className="text-sm text-muted-foreground">Add Grow Cambodia to your phone's Home Screen for quick access. No app store required.</p>
    <div className="flex gap-2"><Button size="sm" variant={platform === "ios" ? "default" : "outline"} onClick={() => setPlatform("ios")}>iPhone / iPad</Button><Button size="sm" variant={platform === "android" ? "default" : "outline"} onClick={() => setPlatform("android")}>Android</Button></div>
    {installed ? <p className="text-sm">Grow Cambodia is already installed on this device.</p> : platform === "ios" ?
      <ol className="list-decimal space-y-1 pl-5 text-sm"><li>Open Grow Cambodia in Safari.</li><li>Tap Share (square with an upward arrow; you may first need the page menu).</li><li>Choose Add to Home Screen.</li><li>Turn on Open as Web App if shown, then tap Add.</li></ol> :
      <ol className="list-decimal space-y-1 pl-5 text-sm"><li>Open Grow Cambodia in Chrome.</li><li>Tap the three-dot menu.</li><li>Choose Install app or Add to Home screen.</li><li>Follow the prompts to install.</li></ol>}
    <div className="flex flex-wrap gap-2">{platform === "android" && prompt && !installed && <Button onClick={async () => { await prompt.prompt(); await prompt.userChoice; setPrompt(null); dismiss(); }}>Install Grow Cambodia</Button>}{firstVisit && <Button variant="outline" onClick={dismiss}>Maybe later</Button>}</div>
  </Card>;
}
