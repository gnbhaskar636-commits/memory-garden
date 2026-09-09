import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInEmail, signInGoogle, signUpEmail } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Mode = "sign-in" | "sign-up";

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Already signed in and landed here anyway (e.g. a stale bookmark) — go home.
  if (!isPending && user) {
    void navigate({ to: "/" });
    return null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      if (mode === "sign-up") {
        await signUpEmail(email, password, name);
        // Supabase projects default to "confirm email" on — sign-up doesn't
        // hand back an active session until the visitor clicks that link.
        setNotice("Check your email to confirm your account, then sign in below.");
        setMode("sign-in");
      } else {
        await signInEmail(email, password);
        await navigate({ to: "/" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setError(null);
    try {
      await signInGoogle("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reach Google sign-in.");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="paper w-full max-w-sm rounded-[1.75rem] p-8 shadow-border">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mt-6 text-center font-hand text-lg text-accent">
          {mode === "sign-in" ? "welcome back" : "plant your first seed"}
        </p>
        <h1 className="text-center font-display text-2xl text-foreground">
          {mode === "sign-in" ? "Sign in to your garden" : "Create your garden"}
        </h1>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
          {mode === "sign-up" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
              />
            </div>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="text-sm text-moss">
              {notice}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting} className="mt-1">
            {submitting
              ? mode === "sign-in"
                ? "Signing in…"
                : "Creating your garden…"
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button type="button" variant="secondary" className="mt-4 w-full" onClick={() => void onGoogle()}>
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-muted">
          {mode === "sign-in" ? (
            <>
              New here?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode("sign-up");
                  setError(null);
                  setNotice(null);
                }}
              >
                Plant your first memory
              </button>
            </>
          ) : (
            <>
              Already have a garden?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode("sign-in");
                  setError(null);
                  setNotice(null);
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
        <p className="mt-4 text-center text-xs text-muted">
          <Link to="/" className="underline-offset-4 hover:underline">
            ← Back
          </Link>
        </p>
      </div>
    </div>
  );
}
