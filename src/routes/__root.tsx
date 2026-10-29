import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
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

const bootSplashCss = `
#td-boot{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#faf6ef;color:#231c15;font-family:"IBM Plex Sans",system-ui,sans-serif;transition:opacity .35s ease}
#td-boot.td-boot-done{opacity:0;pointer-events:none}
#td-boot img{width:44px;height:auto;display:block}
#td-boot .td-word{font-family:"Instrument Serif",Georgia,serif;font-size:34px;line-height:1;letter-spacing:-0.01em}
#td-boot .td-word em{font-style:normal;color:#b3641f}
#td-boot .td-status{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8a7c6c}
#td-boot .td-bar{width:180px;height:2px;background:#e6dccb;overflow:hidden;border-radius:1px}
#td-boot .td-bar i{display:block;height:100%;width:40%;background:#b3641f;animation:td-boot-slide 1.1s ease-in-out infinite}
@keyframes td-boot-slide{0%{transform:translateX(-100%)}100%{transform:translateX(450%)}}
#td-boot .td-retry{display:none;flex-direction:column;align-items:center;gap:12px;text-align:center;max-width:320px}
#td-boot.td-boot-slow .td-bar,#td-boot.td-boot-slow .td-status-loading{display:none}
#td-boot.td-boot-slow .td-retry{display:flex}
#td-boot .td-retry p{margin:0;font-size:14px;line-height:1.5;color:#5c5142}
#td-boot .td-retry button{font:inherit;font-size:13px;letter-spacing:.08em;text-transform:uppercase;padding:10px 22px;background:#7a2e12;color:#faf6ef;border:0;border-radius:2px;cursor:pointer}
#td-boot .td-retry button:hover{background:#8f3a1a}
@media (prefers-reduced-motion:reduce){#td-boot .td-bar i{animation:none;width:100%}}
`;

const bootWatchdogScript = `
window.__tdBootTimer=setTimeout(function(){
  var el=document.getElementById('td-boot');
  if(el&&!window.__tdBooted){el.classList.add('td-boot-slow');}
},12000);
document.addEventListener('click',function(e){
  var t=e.target;
  if(t&&t.id==='td-boot-reload'){window.location.reload();}
});
`;

function BootSplash() {
  return (
    <div id="td-boot" role="status" aria-label="Trackdub is loading">
      <img src="/favicon.png" alt="" width={44} height={44} />
      <div className="td-word">
        Trackdub<em>.</em>
      </div>
      <div className="td-bar" aria-hidden="true">
        <i />
      </div>
      <div className="td-status td-status-loading">Loading the workstation</div>
      <div className="td-retry">
        <p>
          This is taking longer than usual. The site may be restarting — try reloading, and it
          should be ready in a moment.
        </p>
        <button id="td-boot-reload" type="button">
          Reload page
        </button>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{ __html: bootSplashCss }} />
      </head>
      <body>
        <BootSplash />
        {children}
        <script dangerouslySetInnerHTML={{ __html: bootWatchdogScript }} />
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
