import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { exchangeOAuthCode } from "@/lib/auth/server";

const exchangeCode = createServerFn({ method: "GET" })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    await exchangeOAuthCode(data.code);
    return { ok: true };
  });

export const Route = createFileRoute("/auth/callback")({
  loader: async ({ location }) => {
    const code = new URLSearchParams(location.searchStr.replace(/^\?/, "")).get("code");
    const error = new URLSearchParams(location.searchStr.replace(/^\?/, "")).get("error");
    const errorDescription = new URLSearchParams(location.searchStr.replace(/^\?/, "")).get(
      "error_description",
    );

    if (error) {
      throw new Error(errorDescription ?? error);
    }

    if (!code) {
      throw redirect({ to: "/login" });
    }

    await exchangeCode({ data: { code } });
    throw redirect({ to: "/" });
  },
  component: () => null,
});
