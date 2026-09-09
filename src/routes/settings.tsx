import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useMemoryStore } from "@/lib/memories/store";
import type { ThemePreference } from "@/lib/memories/types";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const THEMES: Array<{ value: ThemePreference; label: string; hint: string }> = [
  { value: "light", label: "Morning", hint: "Warm ivory, like stationery in the sun" },
  { value: "dark", label: "Evening", hint: "A quieter garden after dusk" },
  { value: "system", label: "Follow the day", hint: "Match this device" },
];

function SettingsPage() {
  const settings = useMemoryStore((state) => state.settings);
  const memories = useMemoryStore((state) => state.memories);
  const updateSettings = useMemoryStore((state) => state.updateSettings);
  const clearGarden = useMemoryStore((state) => state.clearGarden);
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);

  function exportMemories() {
    const payload = {
      exportedAt: new Date().toISOString(),
      memories,
      settings: { displayName: settings.displayName },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "memory-garden.json";
    link.click();
    URL.revokeObjectURL(url);
    toast("Your garden is packed for keeping");
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <header>
        <p className="font-hand text-lg text-accent">the potting shed</p>
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="mt-2 text-sm text-muted">Small preferences for how the garden feels on this device.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {user?.isDevFallback
              ? "Running without sign-in configured — everyone shares this sandbox account."
              : "Signed in and synced to your account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="truncate text-sm font-medium">
            {user?.primaryEmail ?? user?.displayName ?? "—"}
          </p>
          {user && !user.isDevFallback ? (
            <Button
              variant="secondary"
              disabled={signingOut}
              onClick={() => {
                setSigningOut(true);
                void signOut().catch(() => setSigningOut(false));
              }}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How you are greeted</CardTitle>
          <CardDescription>Shown around the garden — not your account email.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="display-name">Name</Label>
          <Input
            id="display-name"
            className="mt-2"
            value={settings.displayName}
            onChange={(event) => updateSettings({ displayName: event.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Light</CardTitle>
          <CardDescription>Choose a morning garden, an evening one, or follow the hour.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {THEMES.map((theme) => (
            <label
              key={theme.value}
              className="flex cursor-pointer items-start gap-3 rounded-2xl bg-background px-4 py-3 shadow-border"
            >
              <input
                type="radio"
                name="theme"
                className="mt-1 size-4 accent-primary"
                checked={settings.theme === theme.value}
                onChange={() => updateSettings({ theme: theme.value })}
              />
              <span>
                <span className="block font-medium">{theme.label}</span>
                <span className="text-sm text-muted">{theme.hint}</span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motion</CardTitle>
          <CardDescription>Flowers can rest if movement is too much.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <Label htmlFor="reduced-motion">Reduce motion</Label>
          <Switch
            id="reduced-motion"
            checked={settings.reducedMotion}
            onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Your garden is private to your account, protected by row-level security.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Only you can see your memories</p>
              <p className="text-sm text-muted">
                Every memory is scoped to your signed-in account — nobody else's garden can read it.
              </p>
            </div>
            <Switch checked disabled aria-label="Only you can see your memories" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Hide places</p>
              <p className="text-sm text-muted">Locations stay in the record, but not on the cards.</p>
            </div>
            <Switch
              checked={settings.hideLocations}
              onCheckedChange={(checked) => updateSettings({ hideLocations: checked })}
            />
          </div>
          <div className="flex items-center justify-between gap-4 opacity-80">
            <div>
              <p className="text-sm font-medium">Lock the garden</p>
              <p className="text-sm text-muted">A latch for later. Not yet grown.</p>
            </div>
            <Switch disabled aria-label="Lock the garden, not yet available" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Take the garden with you</CardTitle>
          <CardDescription>Download every moment as a file you can keep.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" onClick={exportMemories}>
            Export memories
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Let the whole garden rest</CardTitle>
          <CardDescription>
            This deletes every memory in your account. Your sign-in itself stays active — export first if you
            want to keep a copy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Clear all memories</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear this garden?</AlertDialogTitle>
                <AlertDialogDescription>
                  Every planted moment in your account will rest. This cannot be undone unless you have an export.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep the garden</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive/90 text-cream hover:opacity-90"
                  onClick={() => {
                    clearGarden();
                    toast("The garden has been cleared");
                  }}
                >
                  Clear it
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
