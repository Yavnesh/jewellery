"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useFilterStore } from "@/app/_zustand/filterStore";

export const FilterSync = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const store = useFilterStore();
  const isInitialMount = useRef(true);

  // Sync Zustand -> URL
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    // Helper to sync array state to URL
    const syncArrayToUrl = (key: string, stateArray: string[]) => {
      if (stateArray.length > 0) {
        params.set(key, stateArray.join(","));
      } else {
        params.delete(key);
      }
    };

    syncArrayToUrl("jewelryTypes", store.jewelryTypes);
    syncArrayToUrl("metalColors", store.metalColors);
    syncArrayToUrl("occasions", store.occasions);
    syncArrayToUrl("collections", store.collections);
    syncArrayToUrl("purities", store.purities);
    syncArrayToUrl("genders", store.genders);
    syncArrayToUrl("features", store.features);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    store.jewelryTypes,
    store.metalColors,
    store.occasions,
    store.collections,
    store.purities,
    store.genders,
    store.features,
    pathname,
    router
  ]);

  return null;
};
