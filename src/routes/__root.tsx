import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { WebMcpProvider } from "@/components/webmcp-provider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Trackdub · Dub videos without giving up control" },
      {
        name: "description",
        content:
          "A Windows desktop workstation for AI video dubbing. Translate, voice, and mix in one workflow. Inspect every stage and fix what needs fixing.",
      },
      { name: "author", content: "Trackdub" },
      { property: "og:title", content: "Trackdub · Dub videos without giving up control" },
      {
        property: "og:description",
        content:
          "A Windows desktop workstation for AI video dubbing. Inspect every stage and fix what needs fixing.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Trackdub" },
      { property: "og:image", content: "https://trackdub.com/og.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Trackdub · dub videos into other languages without giving up control",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Trackdub · Dub videos without giving up control" },
      {
        name: "twitter:description",
        content: "A Windows desktop workstation for AI video dubbing.",
      },
      { name: "twitter:image", content: "https://trackdub.com/og.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/instrument-serif-400.woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/ibm-plex-sans-400.woff2",
        crossOrigin: "anonymous",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Trackdub",
          url: "https://trackdub.com",
          logo: "https://trackdub.com/icon-512.png",
          image: "https://trackdub.com/og.png",
          description: "Local-first desktop workstation for AI video dubbing.",
          email: "hello@trackdub.com",
          contactPoint: [
            {
              "@type": "ContactPoint",
              email: "hello@trackdub.com",
              contactType: "customer support",
            },
            {
              "@type": "ContactPoint",
              email: "press@trackdub.com",
              contactType: "public relations",
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <WebMcpProvider />
      <Toaster />
    </QueryClientProvider>
  );
}
