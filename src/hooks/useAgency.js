import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

let cachedAgency = null;
let listeners = [];

export function useAgency() {
  const [agency, setAgency] = useState(cachedAgency);
  const [loading, setLoading] = useState(!cachedAgency);

  useEffect(() => {
    if (cachedAgency) {
      setAgency(cachedAgency);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const data = await base44.entities.Agency.list("-created_date", 1);
      const found = data[0] || null;
      cachedAgency = found;
      listeners.forEach((l) => l(found));
      setAgency(found);
      setLoading(false);
    };

    listeners.push(setAgency);
    fetch();

    return () => {
      listeners = listeners.filter((l) => l !== setAgency);
    };
  }, []);

  const refetch = async () => {
    cachedAgency = null;
    setLoading(true);
    const data = await base44.entities.Agency.list("-created_date", 1);
    const found = data[0] || null;
    cachedAgency = found;
    listeners.forEach((l) => l(found));
    setAgency(found);
    setLoading(false);
  };

  return { agency, loading, refetch };
}