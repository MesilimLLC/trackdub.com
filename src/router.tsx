import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { initializeGT } from "gt-tanstack-start";
import gtConfig from "../gt.config.json";
import loadTranslations from "../loadTranslations";
import { routeTree } from "./routeTree.gen";

initializeGT({ ...gtConfig, loadTranslations });

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
