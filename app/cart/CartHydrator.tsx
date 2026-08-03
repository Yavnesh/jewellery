"use client";
import { useEffect } from "react";
import { useProductStore } from "@/app/_zustand/store";

export function CartHydrator({ serverCart }: { serverCart: any }) {
  const syncCart = useProductStore((state) => state.syncCart);

  useEffect(() => {
    syncCart(serverCart);
  }, [serverCart, syncCart]);

  return null;
}
