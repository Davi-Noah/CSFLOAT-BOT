"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Bot,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Copy,
  Crosshair,
  Gauge,
  History,
  KeyRound,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Pencil,
  Plus,
  Radar,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  UserPlus,
  Users,
  Webhook,
  Zap,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createMonitor,
  deleteMonitor,
  getHealth,
  listMonitors,
  setMonitorActive,
  updateMonitor,
  type ApiStatus,
  type Monitor,
  type MonitorInput,
} from "@/lib/api";

type View = "overview" | "monitors" | "alerts" | "destinations" | "invites" | "settings";
type Destination = { id: number; type: "Discord" | "Telegram"; name: string; detail: string; active: boolean };
type Invite = { id: number; code: string; status: "Active" | "Used" | "Revoked"; created: string; usedBy?: string };
type Preferences = {
  currency: string;
  timezone: string;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
  apiMode: "shared" | "personal";
  apiKey: string;
};

const defaultDestinations: Destination[] = [
  { id: 1, type: "Discord", name: "Deals HQ", detail: "#float-alerts", active: true },
  { id: 2, type: "Telegram", name: "Personal alerts", detail: "Private chat", active: true },
];

const defaultInvites: Invite[] = [
  { id: 1, code: "FLOAT-K7Q2", status: "Active", created: "Today, 09:42" },
  { id: 2, code: "FLOAT-R8M4", status: "Used", created: "Oct 7, 18:15", usedBy: "noah.dev" },
];

const defaultPreferences: Preferences = { currency: "USD", timezone: "America/Fortaleza", quietHours: false, quietStart: "23:00", quietEnd: "07:00", apiMode: "shared", apiKey: "" };

const alerts = [
  { id: 1, name: "AK-47 | Redline", wear: "Field-Tested", price: 24.8, market: 31.2, discount: 20.5, float: "0.1784", age: "18s ago", monitor: "AK-47 low float", image: "https://img.take.skin/r2takeskinimg/ak-47-redline-stattrak-well-worn-float.webp", accent: "from-red-500/20" },
  { id: 2, name: "AWP | Asiimov", wear: "Field-Tested", price: 91.4, market: 117, discount: 21.9, float: "0.2841", age: "2m ago", monitor: "High discount finds", image: "https://cdn.cs2locker.com/images/econ/default_generated/weapon_awp_cu_awp_asimov_light_png.png", accent: "from-orange-500/20" },
  { id: 3, name: "M4A4 | Poseidon", wear: "Factory New", price: 842, market: 995, discount: 15.4, float: "0.0279", age: "11m ago", monitor: "High discount finds", image: "https://files.bo3.gg/uploads/image/113088/image/webp-ea6271f818e00b7785a1dc3551d1f091.webp", accent: "from-cyan-500/20" },
  { id: 4, name: "M4A1-S | Printstream", wear: "Minimal Wear", price: 168.5, market: 247, discount: 31.8, float: "0.0832", age: "38m ago", monitor: "High discount finds", image: "https://cdn.cs2locker.com/images/econ/default_generated/weapon_m4a1_silencer_cu_m4a1s_printstream_light_png.png", accent: "from-zinc-400/20" },
];

const viewMeta: Record<View, { label: string; description: string; icon: typeof LayoutDashboard }> = {
  overview: { label: "Overview", description: "Your market activity at a glance.", icon: LayoutDashboard },
  monitors: { label: "Monitors", description: "Build and control your CSFloat scouts.", icon: Radar },
  alerts: { label: "Alert history", description: "Every opportunity delivered by your monitors.", icon: History },
  destinations: { label: "Destinations", description: "Choose where FloatScout sends alerts.", icon: Bot },
  invites: { label: "Invites", description: "Control who can access this private preview.", icon: Users },
  settings: { label: "Settings", description: "Personalize monitoring and display preferences.", icon: Settings },
};

function Brand() {
  return <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-lime-400 text-zinc-950 shadow-[0_0_24px_rgba(225,160,92,0.24)]"><Crosshair className="size-5" strokeWidth={2.4} /></div><div><p className="font-semibold tracking-tight">FloatScout</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Market watcher</p></div></div>;
}

function Navigation({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  const navItems = (Object.keys(viewMeta) as View[]).filter((item) => item !== "settings");
  return <nav className="space-y-1">{navItems.map((item) => { const Icon = viewMeta[item].icon; return <button key={item} onClick={() => onNavigate(item)} className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${view === item ? "bg-lime-400/12 text-lime-400" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="size-4" />{viewMeta[item].label}</button>; })}</nav>;
}

function SelectField({ value, onChange, children, className = "" }: { value: string; onChange: (value: string) => void; children: React.ReactNode; className?: string }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className={`h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30 ${className}`}>{children}</select>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function formatInterval(seconds: number) {
  if (seconds >= 3600) return `${seconds / 3600} hour`;
  if (seconds >= 60) return `${seconds / 60} min`;
  return `${seconds} sec`;
}

function AlertCard({ alert, currency }: { alert: (typeof alerts)[number]; currency: string }) {
  const rates: Record<string, { rate: number; symbol: string }> = { USD: { rate: 1, symbol: "$" }, BRL: { rate: 5.34, symbol: "R$" }, EUR: { rate: 0.86, symbol: "€" }, CNY: { rate: 7.12, symbol: "¥" } };
  const chosen = rates[currency] ?? rates.USD;
  const money = (value: number) => `${chosen.symbol}${(value * chosen.rate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return <Card className="group bg-card/70 transition-colors hover:bg-card"><div className={`relative h-36 overflow-hidden bg-gradient-to-br ${alert.accent} to-transparent`}><div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(163,230,53,0.08),transparent_45%)]" /><Image src={alert.image} alt={alert.name} fill loading={alert.id === 1 ? "eager" : "lazy"} sizes="(max-width: 768px) 100vw, 33vw" className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]" /><Badge className="absolute left-3 top-3 bg-lime-400 text-zinc-950">{alert.discount}% off</Badge><span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-1 text-[10px] text-white backdrop-blur-sm">{alert.age}</span></div><CardHeader><CardTitle>{alert.name}</CardTitle><CardDescription>{alert.wear} · {alert.monitor}</CardDescription></CardHeader><CardContent><div className="flex items-end justify-between"><div><p className="text-xl font-semibold tracking-tight">{money(alert.price)}</p><p className="text-xs text-muted-foreground line-through">{money(alert.market)}</p></div><div className="text-right"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Float</p><p className="font-mono text-sm">{alert.float}</p></div></div><Button variant="outline" className="mt-4 w-full justify-between">Open on CSFloat <ChevronRight /></Button></CardContent></Card>;
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [dark, setDark] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [monitorsLoading, setMonitorsLoading] = useState(true);
  const [monitorsError, setMonitorsError] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>(defaultDestinations);
  const [invites, setInvites] = useState<Invite[]>(defaultInvites);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [monitorDialog, setMonitorDialog] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [destinationDialog, setDestinationDialog] = useState(false);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [notice, setNotice] = useState("");
  const [alertSearch, setAlertSearch] = useState("");
  const [alertFilter, setAlertFilter] = useState("All monitors");
  const [newDestinationType, setNewDestinationType] = useState<"Discord" | "Telegram">("Discord");

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem("floatscout-mock");
        if (saved) {
          const data = JSON.parse(saved);
          if (data.destinations) setDestinations(data.destinations);
          if (data.invites) setInvites(data.invites);
          if (data.preferences) setPreferences(data.preferences);
          if (typeof data.dark === "boolean") setDark(data.dark);
          if (typeof data.signedIn === "boolean") setSignedIn(data.signedIn);
        }
      } catch { /* Reset to safe mock defaults. */ }
      setHydrated(true);
    });
  }, []);

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("floatscout-mock", JSON.stringify({ destinations, invites, preferences, dark, signedIn }));
  }, [hydrated, destinations, invites, preferences, dark, signedIn]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 2600); return () => window.clearTimeout(timer); }, [notice]);

  useEffect(() => {
    let cancelled = false;
    async function loadBackend() {
      setMonitorsLoading(true);
      const [healthResult, monitorsResult] = await Promise.allSettled([getHealth(), listMonitors()]);
      if (cancelled) return;
      setApiStatus(healthResult.status === "fulfilled" && healthResult.value.status === "ok" && healthResult.value.database === "ok" ? "online" : "offline");
      if (monitorsResult.status === "fulfilled") {
        setMonitors(monitorsResult.value);
        setMonitorsError("");
      } else {
        setMonitorsError("Could not load monitors from the API.");
      }
      setMonitorsLoading(false);
    }
    void loadBackend();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({ name: "create_monitor", title: "Create FloatScout monitor", description: "Create a persisted FloatScout monitor.", inputSchema: { type: "object", properties: { name: { type: "string" }, skin: { type: "string" } }, required: ["name", "skin"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, async execute(input: unknown) { const value = input as { name: string; skin: string }; const created = await createMonitor({ name: value.name, skin: value.skin, minPrice: 10, maxPrice: 100, maxFloat: 0.2, minDiscount: 15, itemType: "Any", listingType: "Buy now", scanIntervalSeconds: 3600, destinations: [], active: true }); setMonitors((current) => [...current, created]); return { id: created.id, status: "created" }; } }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const flash = (message: string) => setNotice(message);
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openNewMonitor = () => { setEditingMonitor(null); setMonitorDialog(true); };
  const filteredAlerts = useMemo(() => alerts.filter((alert) => (alertFilter === "All monitors" || alert.monitor === alertFilter) && alert.name.toLowerCase().includes(alertSearch.toLowerCase())), [alertFilter, alertSearch]);

  async function saveMonitor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const destinationList = destinations.filter((item) => form.get(`destination-${item.id}`) === "on").map((item) => item.name);
    const input: MonitorInput = { name: String(form.get("name")), skin: String(form.get("skin")), minPrice: Number(form.get("minPrice")), maxPrice: Number(form.get("maxPrice")), maxFloat: Number(form.get("maxFloat")), minDiscount: Number(form.get("minDiscount")), itemType: String(form.get("itemType")), listingType: String(form.get("listingType")), scanIntervalSeconds: Number(form.get("scanIntervalSeconds")), destinations: destinationList, active: editingMonitor?.active ?? true };
    try {
      const saved = editingMonitor ? await updateMonitor(editingMonitor.id, input) : await createMonitor(input);
      setMonitors((current) => editingMonitor ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]);
      setMonitorDialog(false);
      setMonitorsError("");
      flash(editingMonitor ? "Monitor updated" : "Monitor created");
    } catch (error) {
      setMonitorsError(error instanceof Error ? error.message : "Could not save monitor.");
      flash("Could not save monitor");
    }
  }

  async function toggleMonitor(id: string, active: boolean) {
    try {
      const saved = await setMonitorActive(id, active);
      setMonitors((items) => items.map((item) => item.id === id ? saved : item));
      setMonitorsError("");
    } catch (error) {
      setMonitorsError(error instanceof Error ? error.message : "Could not change monitor status.");
      flash("Could not change monitor status");
    }
  }

  async function removeMonitor(id: string) {
    try {
      await deleteMonitor(id);
      setMonitors((items) => items.filter((item) => item.id !== id));
      setMonitorsError("");
      flash("Monitor deleted");
    } catch (error) {
      setMonitorsError(error instanceof Error ? error.message : "Could not delete monitor.");
      flash("Could not delete monitor");
    }
  }

  function saveDestination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    setDestinations((current) => [...current, { id: Date.now(), type: newDestinationType, name: String(form.get("name")), detail: newDestinationType === "Discord" ? `#${String(form.get("channel") || "deals")}` : "Connected group", active: true }]);
    setDestinationDialog(false); flash(`${newDestinationType} destination connected`);
  }

  function createInvite() {
    const code = `FLOAT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setInvites((current) => [{ id: Date.now(), code, status: "Active", created: "Just now" }, ...current]);
    setInviteDialog(false); flash("Invite created");
  }

  if (!signedIn) return <LoginScreen dark={dark} setDark={setDark} onLogin={() => { setSignedIn(true); flash("Signed in with Discord"); }} />;

  return <div className="skeuo-shell min-h-screen bg-background text-foreground">
    {notice && <div className="fixed left-1/2 top-4 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full border bg-popover px-4 py-2 text-sm font-medium shadow-xl"><Check className="size-4 text-lime-500" />{notice}</div>}
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar/95 p-5 shadow-[4px_0_24px_rgba(15,23,42,0.03)] backdrop-blur-xl lg:flex lg:flex-col"><Brand /><div className="mt-10 flex-1"><Navigation view={view} onNavigate={navigate} /></div><button onClick={() => navigate("settings")} className={`mb-3 flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium ${view === "settings" ? "bg-lime-400/12 text-lime-500 dark:text-lime-400" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Settings className="size-4" />Settings</button><div className="rounded-xl border bg-background/70 p-3"><div className="flex items-center gap-2 text-xs font-medium"><span className="relative flex size-2"><span className={`relative inline-flex size-2 rounded-full ${apiStatus === "online" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" : apiStatus === "offline" ? "bg-red-500" : "animate-pulse bg-amber-400"}`} /></span>{apiStatus === "online" ? "API online" : apiStatus === "offline" ? "API offline" : "Checking API"}</div><p className="mt-1 text-xs text-muted-foreground">{apiStatus === "online" ? "Database connected" : apiStatus === "offline" ? "Check the backend service" : "Connecting to backend"}</p></div></aside>
    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><div className="lg:hidden"><Sheet><SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}><Menu /></SheetTrigger><SheetContent side="left" className="w-72 p-5"><SheetHeader className="p-0"><SheetTitle className="sr-only">Navigation</SheetTitle><SheetDescription className="sr-only">FloatScout navigation</SheetDescription><Brand /></SheetHeader><div className="mt-6"><Navigation view={view} onNavigate={navigate} /></div></SheetContent></Sheet></div><p className="hidden text-sm font-medium lg:block">{viewMeta[view].label}</p><div className="lg:hidden"><Brand /></div><div className="flex items-center gap-1.5"><Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setDark((value) => !value)}>{dark ? <Sun /> : <Moon />}</Button><Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => navigate("alerts")}><Bell /></Button><button onClick={() => navigate("settings")}><Avatar className="ml-1 size-8"><AvatarFallback className="bg-indigo-500 text-xs font-semibold text-white">DN</AvatarFallback></Avatar></button></div></div></header>
      <main className="skeuo-page mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
        {view === "overview" && <Overview monitors={monitors} currency={preferences.currency} apiStatus={apiStatus} onNew={openNewMonitor} onNavigate={navigate} toggleMonitor={toggleMonitor} />}
        {view === "monitors" && <MonitorsView monitors={monitors} loading={monitorsLoading} error={monitorsError} onNew={openNewMonitor} onEdit={(monitor) => { setEditingMonitor(monitor); setMonitorDialog(true); }} onDelete={removeMonitor} onToggle={toggleMonitor} />}
        {view === "alerts" && <AlertsView alerts={filteredAlerts} currency={preferences.currency} search={alertSearch} setSearch={setAlertSearch} filter={alertFilter} setFilter={setAlertFilter} monitors={monitors} />}
        {view === "destinations" && <DestinationsView destinations={destinations} onAdd={() => setDestinationDialog(true)} onDelete={(id) => { setDestinations((items) => items.filter((item) => item.id !== id)); flash("Destination removed"); }} onToggle={(id, active) => setDestinations((items) => items.map((item) => item.id === id ? { ...item, active } : item))} />}
        {view === "invites" && <InvitesView invites={invites} onNew={() => setInviteDialog(true)} onCopy={(code) => { void navigator.clipboard?.writeText(`https://floatscout.app/invite/${code}`); flash("Invite link copied"); }} onRevoke={(id) => { setInvites((items) => items.map((item) => item.id === id ? { ...item, status: "Revoked" } : item)); flash("Invite revoked"); }} />}
        {view === "settings" && <SettingsView preferences={preferences} setPreferences={setPreferences} dark={dark} setDark={setDark} onSave={() => flash("Settings saved")} onSignOut={() => setSignedIn(false)} />}
      </main>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"><div className="mx-auto flex max-w-md items-center justify-between">{(["overview", "monitors", "alerts", "settings"] as View[]).map((item) => { const Icon = viewMeta[item].icon; return <button key={item} onClick={() => navigate(item)} className={`flex min-w-16 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium ${view === item ? "text-lime-500" : "text-muted-foreground"}`}><Icon className="size-4" />{item === "overview" ? "Home" : viewMeta[item].label.split(" ")[0]}</button>; })}</div></nav>

    <MonitorDialog open={monitorDialog} onOpenChange={setMonitorDialog} monitor={editingMonitor} destinations={destinations} onSubmit={saveMonitor} />
    <Dialog open={destinationDialog} onOpenChange={setDestinationDialog}><DialogContent><DialogHeader><DialogTitle>Connect a destination</DialogTitle><DialogDescription>This mock simulates the installation flow. No external bot is contacted.</DialogDescription></DialogHeader><form onSubmit={saveDestination} className="space-y-4"><div className="grid grid-cols-2 gap-2">{(["Discord", "Telegram"] as const).map((type) => <button type="button" key={type} onClick={() => setNewDestinationType(type)} className={`rounded-xl border p-3 text-left ${newDestinationType === type ? "border-lime-400 bg-lime-400/10" : "bg-muted/30"}`}><p className="font-medium">{type}</p><p className="text-xs text-muted-foreground">{type === "Discord" ? "Install app" : "Connect group"}</p></button>)}</div><Field label="Display name"><Input name="name" required placeholder="e.g. Deals HQ" /></Field>{newDestinationType === "Discord" ? <Field label="Channel"><Input name="channel" required placeholder="float-alerts" /></Field> : <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">After saving, send <strong className="text-foreground">/connect FLOAT-4821</strong> in your Telegram group.</div>}<DialogFooter><Button type="submit" className="bg-lime-400 text-zinc-950 hover:bg-lime-300">{newDestinationType === "Discord" ? "Install Discord bot" : "Generate connection code"}</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={inviteDialog} onOpenChange={setInviteDialog}><DialogContent><DialogHeader><DialogTitle>Create an invite</DialogTitle><DialogDescription>Generate a single-use link for one trusted person.</DialogDescription></DialogHeader><div className="rounded-xl border bg-muted/30 p-4 text-sm"><div className="flex items-center gap-2 font-medium"><ShieldCheck className="size-4 text-lime-500" />Single use</div><p className="mt-1 text-xs text-muted-foreground">The invite expires after its first successful Discord sign-in.</p></div><DialogFooter><Button onClick={createInvite} className="bg-lime-400 text-zinc-950 hover:bg-lime-300"><UserPlus /> Create invite</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function PageHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) { return <section className="skeuo-page-heading flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-lime-500">Control module</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{action}</section>; }

function Overview({ monitors, currency, apiStatus, onNew, onNavigate, toggleMonitor }: { monitors: Monitor[]; currency: string; apiStatus: ApiStatus; onNew: () => void; onNavigate: (view: View) => void; toggleMonitor: (id: string, active: boolean) => void }) {
  return <div className="skeuo-dashboard">
    <section className="skeuo-console flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-lime-500"><span className="skeuo-led" /><Activity className="size-3.5" />Live market intelligence</div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Good morning, Davi.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your scouts are watching CSFloat for the right deals.</p>
      </div>
      <Button size="lg" onClick={onNew} className="skeuo-button h-11 bg-lime-400 px-5 text-zinc-950 hover:bg-lime-300"><Plus />New monitor</Button>
    </section>

    <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      { label: "Active monitors", value: String(monitors.filter((item) => item.active).length), detail: `${monitors.length} total`, icon: Radar },
      { label: "Deals today", value: "12", detail: "+4 from yesterday", icon: Target },
      { label: "Best discount", value: "31.8%", detail: "M4A1-S | Printstream", icon: Sparkles },
      { label: "Backend", value: apiStatus === "online" ? "Online" : apiStatus === "offline" ? "Offline" : "Checking", detail: apiStatus === "online" ? "API + database healthy" : "Live health check", icon: Gauge },
    ].map((stat) => <Card key={stat.label} className="skeuo-stat relative min-h-32 justify-between bg-card/70"><CardHeader><CardDescription className="pr-8 text-xs font-semibold uppercase tracking-[0.08em]">{stat.label}</CardDescription><CardAction><span className="skeuo-icon-well"><stat.icon className="size-4 text-lime-500" /></span></CardAction><CardTitle className="mt-1 text-2xl font-semibold tracking-tight">{stat.value}</CardTitle></CardHeader><CardContent className="text-[11px] text-muted-foreground">{stat.detail}</CardContent></Card>)}</section>

    <section className="skeuo-bank mt-7 p-4 sm:p-5"><SectionHeader title="Your monitors" subtitle="Each scout has its own filters and destinations." onMore={() => onNavigate("monitors")} /><div className="grid gap-3 xl:grid-cols-2">{monitors.slice(0, 2).map((monitor) => <MonitorCard key={monitor.id} monitor={monitor} onToggle={toggleMonitor} />)}</div></section>
    <section className="skeuo-bank mt-7 p-4 sm:p-5"><SectionHeader title="Recent alerts" subtitle="Opportunities that matched your monitors." onMore={() => onNavigate("alerts")} /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{alerts.slice(0, 3).map((alert) => <AlertCard key={alert.id} alert={alert} currency={currency} />)}</div></section>
  </div>;
}

function SectionHeader({ title, subtitle, onMore }: { title: string; subtitle: string; onMore: () => void }) { return <div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold tracking-tight">{title}</h2><p className="text-xs text-muted-foreground">{subtitle}</p></div><Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onMore}>View all <ChevronRight /></Button></div>; }

function MonitorCard({ monitor, onToggle, onEdit, onDelete }: { monitor: Monitor; onToggle: (id: string, active: boolean) => void; onEdit?: (monitor: Monitor) => void; onDelete?: (id: string) => void }) {
  return <Card className="bg-card/70"><CardHeader><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime-400/10 text-lime-500"><Compass className="size-5" /></div><div><CardTitle>{monitor.name}</CardTitle><CardDescription className="mt-0.5 text-xs">{monitor.skin} · {monitor.listingType}</CardDescription></div></div><CardAction><Switch checked={monitor.active} onCheckedChange={(checked) => onToggle(monitor.id, checked)} aria-label={`Toggle ${monitor.name}`} className="data-checked:bg-lime-400" /></CardAction></CardHeader><CardContent><div className="flex flex-wrap gap-1.5"><Badge variant="outline" className="font-normal">${monitor.minPrice}–${monitor.maxPrice}</Badge><Badge variant="outline" className="font-normal">Float ≤ {monitor.maxFloat}</Badge><Badge variant="outline" className="font-normal">{monitor.minDiscount}%+ off</Badge><Badge variant="outline" className="font-normal">{monitor.itemType}</Badge></div><div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{formatInterval(monitor.scanIntervalSeconds)}</span><span className="flex items-center gap-1.5"><Bell className="size-3.5" />{monitor.destinations.length} destinations</span>{onEdit && <span className="flex gap-1"><Button variant="ghost" size="icon-xs" onClick={() => onEdit(monitor)} aria-label="Edit monitor"><Pencil /></Button><Button variant="ghost" size="icon-xs" onClick={() => onDelete?.(monitor.id)} aria-label="Delete monitor" className="text-destructive"><Trash2 /></Button></span>}</div></CardContent></Card>;
}

function MonitorsView({ monitors, loading, error, onNew, onEdit, onDelete, onToggle }: { monitors: Monitor[]; loading: boolean; error: string; onNew: () => void; onEdit: (monitor: Monitor) => void; onDelete: (id: string) => void; onToggle: (id: string, active: boolean) => void }) { return <><PageHeading title="Monitors" description="Create independent scouts for different market strategies." action={<Button onClick={onNew} className="bg-lime-400 text-zinc-950 hover:bg-lime-300"><Plus />New monitor</Button>} />{error && <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}{loading ? <div className="mt-6 rounded-xl border p-6 text-sm text-muted-foreground">Loading monitors from the API...</div> : monitors.length === 0 ? <EmptyState icon={Radar} title="No monitors yet" description="Create your first monitor to start watching CSFloat." /> : <div className="mt-6 grid gap-3 xl:grid-cols-2">{monitors.map((monitor) => <MonitorCard key={monitor.id} monitor={monitor} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}</div>}</>; }

function AlertsView({ alerts: items, currency, search, setSearch, filter, setFilter, monitors }: { alerts: typeof alerts; currency: string; search: string; setSearch: (value: string) => void; filter: string; setFilter: (value: string) => void; monitors: Monitor[] }) { return <><PageHeading title="Alert history" description="Review the deals discovered by every monitor." /><div className="mt-6 flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search skins..." className="h-10 pl-9" /></div><SelectField value={filter} onChange={setFilter} className="sm:w-56"><option>All monitors</option>{monitors.map((monitor) => <option key={monitor.id}>{monitor.name}</option>)}</SelectField></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((alert) => <AlertCard key={alert.id} alert={alert} currency={currency} />)}</div>{items.length === 0 && <EmptyState icon={Search} title="No alerts found" description="Try a different search or monitor filter." />}</>; }

function DestinationsView({ destinations, onAdd, onDelete, onToggle }: { destinations: Destination[]; onAdd: () => void; onDelete: (id: number) => void; onToggle: (id: number, active: boolean) => void }) { return <><PageHeading title="Destinations" description="Connect every place that should receive deal alerts." action={<Button onClick={onAdd} className="bg-lime-400 text-zinc-950 hover:bg-lime-300"><Link2 />Connect destination</Button>} /><div className="mt-6 grid gap-3 lg:grid-cols-2">{destinations.map((item) => <Card key={item.id} className="bg-card/70"><CardHeader><div className="flex items-center gap-3"><div className={`grid size-11 place-items-center rounded-xl ${item.type === "Discord" ? "bg-indigo-500/15 text-indigo-400" : "bg-sky-500/15 text-sky-400"}`}>{item.type === "Discord" ? <MessageCircle /> : <Webhook />}</div><div><CardTitle>{item.name}</CardTitle><CardDescription>{item.type} · {item.detail}</CardDescription></div></div><CardAction><Switch checked={item.active} onCheckedChange={(checked) => onToggle(item.id, checked)} className="data-checked:bg-lime-400" /></CardAction></CardHeader><CardContent className="flex items-center justify-between border-t pt-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`size-2 rounded-full ${item.active ? "bg-lime-400" : "bg-zinc-500"}`} />{item.active ? "Connected" : "Paused"}</div><Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(item.id)}><Trash2 />Remove</Button></CardContent></Card>)}</div><div className="mt-6 rounded-xl border border-dashed p-5"><div className="flex gap-3"><ShieldCheck className="size-5 text-lime-500" /><div><p className="text-sm font-medium">Mock connections only</p><p className="mt-1 text-xs text-muted-foreground">The Discord installation and Telegram command flows are simulated locally in this prototype.</p></div></div></div></>; }

function InvitesView({ invites, onNew, onCopy, onRevoke }: { invites: Invite[]; onNew: () => void; onCopy: (code: string) => void; onRevoke: (id: number) => void }) { return <><PageHeading title="Invites" description="Give trusted friends access with single-use links." action={<Button onClick={onNew} className="bg-lime-400 text-zinc-950 hover:bg-lime-300"><UserPlus />Create invite</Button>} /><Card className="mt-6 bg-card/70"><CardContent className="px-0"><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Status</TableHead><TableHead className="hidden sm:table-cell">Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{invites.map((invite) => <TableRow key={invite.id}><TableCell className="font-mono font-medium">{invite.code}</TableCell><TableCell><Badge variant={invite.status === "Active" ? "default" : "secondary"} className={invite.status === "Active" ? "bg-lime-400 text-zinc-950" : ""}>{invite.status}</Badge>{invite.usedBy && <span className="ml-2 hidden text-xs text-muted-foreground md:inline">by {invite.usedBy}</span>}</TableCell><TableCell className="hidden text-muted-foreground sm:table-cell">{invite.created}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" aria-label="Copy invite" disabled={invite.status !== "Active"} onClick={() => onCopy(invite.code)}><Copy /></Button><Button variant="ghost" size="icon-sm" aria-label="Revoke invite" disabled={invite.status !== "Active"} onClick={() => onRevoke(invite.id)} className="text-destructive"><Trash2 /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></>; }

function SettingsView({ preferences, setPreferences, dark, setDark, onSave, onSignOut }: { preferences: Preferences; setPreferences: (value: Preferences) => void; dark: boolean; setDark: (value: boolean) => void; onSave: () => void; onSignOut: () => void }) { const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => setPreferences({ ...preferences, [key]: value }); return <><PageHeading title="Settings" description="Manage your account, monitoring plan, and preferences." /><div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]"><Card className="bg-card/70"><CardHeader><CardTitle>Account</CardTitle><CardDescription>Signed in through Discord</CardDescription></CardHeader><CardContent><div className="flex items-center gap-3"><Avatar className="size-11"><AvatarFallback className="bg-indigo-500 text-white">DN</AvatarFallback></Avatar><div><p className="font-medium">Davi Noah</p><p className="text-xs text-muted-foreground">@davi.noah · Owner</p></div></div><Button variant="outline" className="mt-4 text-destructive" onClick={onSignOut}><LogOut />Sign out</Button></CardContent></Card><Card className="bg-card/70"><CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Choose display defaults for this device.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Dark mode</p><p className="text-xs text-muted-foreground">FloatScout defaults to dark.</p></div><Switch checked={dark} onCheckedChange={setDark} className="data-checked:bg-lime-400" /></div><Field label="Display currency"><SelectField value={preferences.currency} onChange={(value) => update("currency", value)}><option>USD</option><option>BRL</option><option>EUR</option><option>CNY</option></SelectField></Field><Field label="Timezone"><SelectField value={preferences.timezone} onChange={(value) => update("timezone", value)}><option>America/Fortaleza</option><option>America/Sao_Paulo</option><option>UTC</option><option>Europe/London</option><option>Asia/Shanghai</option></SelectField></Field></CardContent></Card><Card className="bg-card/70"><CardHeader><CardTitle>Monitoring plan</CardTitle><CardDescription>Shared access is slower; your own key unlocks faster scans.</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 gap-2">{(["shared", "personal"] as const).map((mode) => <button key={mode} onClick={() => update("apiMode", mode)} className={`rounded-xl border p-3 text-left ${preferences.apiMode === mode ? "border-lime-400 bg-lime-400/10" : "bg-muted/30"}`}><div className="flex items-center gap-2 font-medium">{mode === "shared" ? <Users className="size-4" /> : <KeyRound className="size-4" />}{mode === "shared" ? "Shared" : "Personal key"}</div><p className="mt-1 text-xs text-muted-foreground">{mode === "shared" ? "Updates hourly" : "Faster intervals"}</p></button>)}</div>{preferences.apiMode === "personal" && <Field label="CSFloat API key"><Input type="password" value={preferences.apiKey} onChange={(event) => update("apiKey", event.target.value)} placeholder="Paste your API key" className="mt-4" /></Field>}</CardContent></Card><Card className="bg-card/70"><CardHeader><CardTitle>Quiet hours</CardTitle><CardDescription>Matching deals remain in history without sending messages.</CardDescription><CardAction><Switch checked={preferences.quietHours} onCheckedChange={(value) => update("quietHours", value)} className="data-checked:bg-lime-400" /></CardAction></CardHeader><CardContent className="grid grid-cols-2 gap-3"><Field label="Starts"><Input type="time" value={preferences.quietStart} onChange={(event) => update("quietStart", event.target.value)} disabled={!preferences.quietHours} /></Field><Field label="Ends"><Input type="time" value={preferences.quietEnd} onChange={(event) => update("quietEnd", event.target.value)} disabled={!preferences.quietHours} /></Field></CardContent></Card></div><Button className="mt-5 bg-lime-400 text-zinc-950 hover:bg-lime-300" onClick={onSave}><Check />Save settings</Button></>; }

function MonitorDialog({ open, onOpenChange, monitor, destinations, onSubmit }: { open: boolean; onOpenChange: (value: boolean) => void; monitor: Monitor | null; destinations: Destination[]; onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void> }) { return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{monitor ? "Edit monitor" : "Create a monitor"}</DialogTitle><DialogDescription>Define exactly which CSFloat listings should trigger an alert.</DialogDescription></DialogHeader><form onSubmit={onSubmit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Monitor name"><Input name="name" required defaultValue={monitor?.name} placeholder="e.g. AK low float" /></Field><Field label="Skin or weapon"><Input name="skin" required defaultValue={monitor?.skin ?? "Any skin"} /></Field><Field label="Minimum price (USD)"><Input name="minPrice" type="number" min="0" step="0.01" required defaultValue={monitor?.minPrice ?? 10} /></Field><Field label="Maximum price (USD)"><Input name="maxPrice" type="number" min="0" step="0.01" required defaultValue={monitor?.maxPrice ?? 100} /></Field><Field label="Maximum float"><Input name="maxFloat" type="number" min="0" max="1" step="0.0001" required defaultValue={monitor?.maxFloat ?? 0.2} /></Field><Field label="Minimum discount (%)"><Input name="minDiscount" type="number" min="0" max="100" required defaultValue={monitor?.minDiscount ?? 15} /></Field><Field label="Item type"><select name="itemType" defaultValue={monitor?.itemType ?? "Any"} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"><option>Any</option><option>Normal</option><option>StatTrak</option><option>Souvenir</option></select></Field><Field label="Listing type"><select name="listingType" defaultValue={monitor?.listingType ?? "Buy now"} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"><option>Any</option><option>Buy now</option><option>Auction</option></select></Field><Field label="Scan interval"><select name="scanIntervalSeconds" defaultValue={monitor?.scanIntervalSeconds ?? 3600} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"><option value="30">30 sec</option><option value="60">1 min</option><option value="300">5 min</option><option value="3600">1 hour</option></select></Field></div><div><Label>Destinations</Label><div className="mt-2 grid gap-2 sm:grid-cols-2">{destinations.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm"><Checkbox name={`destination-${item.id}`} defaultChecked={monitor?.destinations.includes(item.name)} />{item.name}<span className="ml-auto text-xs text-muted-foreground">{item.type}</span></label>)}</div></div><DialogFooter><Button type="submit" className="bg-lime-400 text-zinc-950 hover:bg-lime-300"><Zap />{monitor ? "Save changes" : "Create monitor"}</Button></DialogFooter></form></DialogContent></Dialog>; }

function EmptyState({ icon: Icon, title, description }: { icon: typeof Search; title: string; description: string }) { return <div className="mt-8 grid place-items-center rounded-xl border border-dashed p-10 text-center"><Icon className="size-8 text-muted-foreground" /><p className="mt-3 font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>; }

function LoginScreen({ dark, setDark, onLogin }: { dark: boolean; setDark: (value: boolean) => void; onLogin: () => void }) { return <main className="skeuo-page skeuo-login grid min-h-screen place-items-center px-4"><Button variant="ghost" size="icon" className="fixed right-4 top-4" onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</Button><Card className="w-full max-w-sm bg-card/80 p-2 text-center backdrop-blur"><CardHeader><div className="mx-auto mb-3"><Brand /></div><CardTitle className="text-xl">Welcome to FloatScout</CardTitle><CardDescription>This is a local interactive preview. Discord authentication is simulated.</CardDescription></CardHeader><CardContent><Button className="skeuo-button h-11 w-full bg-lime-400 text-zinc-950 hover:bg-lime-300" onClick={onLogin}><MessageCircle />Continue with Discord</Button><p className="mt-4 text-xs text-muted-foreground">Invite-only access · No real account will be created</p></CardContent></Card></main>; }
