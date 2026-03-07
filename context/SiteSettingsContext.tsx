"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface SiteSettings {
  logoWide:     string;
  logoSquare:   string;
  platformName: string;
  placementFee: number;
}

const defaultSettings: SiteSettings = {
  logoWide:     "",
  logoSquare:   "",
  platformName: "Websevix",
  placementFee: 500,
};

const SiteSettingsContext = createContext<SiteSettings>(defaultSettings);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    fetch("/api/site-settings")
      .then(r => r.json())
      .then(d => {
        if (d.platformName) setSettings(d);
      })
      .catch(() => {}); // silent fail — use defaults
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
