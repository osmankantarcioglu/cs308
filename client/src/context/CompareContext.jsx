import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CompareContext = createContext(null);

const STORAGE_KEY = "compare_products_v1";
const MAX_COMPARE = 3;

export function CompareProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const isSelected = (id) => items.some((p) => String(p._id ?? p.id) === String(id));

  const toggle = (product) => {
    const id = String(product._id ?? product.id);
    setItems((prev) => {
      const exists = prev.some((p) => String(p._id ?? p.id) === id);
      if (exists) return prev.filter((p) => String(p._id ?? p.id) !== id);
      if (prev.length >= MAX_COMPARE) return prev; // ignore if full
      // store only what you need
      return [
        ...prev,
        {
          _id: product._id ?? product.id,
          name: product.name ?? product.title ?? "Unnamed",
          price: product.price ?? 0,
          image: product.image ?? product.imageUrl ?? product.thumbnail ?? null,
          brand: product.brand ?? "",
          category: product.category?.name ?? product.category ?? "",
          // keep raw product too if you want:
          raw: product,
        },
      ];
    });
  };

  const remove = (id) => setItems((prev) => prev.filter((p) => String(p._id ?? p.id) !== String(id)));
  const clear = () => setItems([]);

  const value = useMemo(
    () => ({ items, toggle, remove, clear, isSelected, MAX_COMPARE }),
    [items]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
