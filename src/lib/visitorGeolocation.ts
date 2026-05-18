export type VisitorPlace = {
  city: string;
  country: string;
  /** Affichage « Ville, Pays » (≤ 80 car.). */
  label: string;
};

function pickAddressPart(
  address: Record<string, string> | undefined,
  keys: string[],
): string {
  if (!address) return "";
  for (const key of keys) {
    const v = address[key]?.trim();
    if (v) return v;
  }
  return "";
}

function formatPlace(city: string, country: string, lang: "fr" | "ar-dz"): string {
  const c = city.trim();
  const co = country.trim();
  if (c && co) return lang === "ar-dz" ? `${c} · ${co}` : `${c}, ${co}`;
  return (c || co).slice(0, 80);
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

function getCurrentPosition(
  timeoutMs: number,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: timeoutMs,
      maximumAge: 60_000,
    });
  });
}

async function reverseGeocode(
  lat: number,
  lon: number,
  lang: "fr" | "ar-dz",
): Promise<VisitorPlace | null> {
  const acceptLang = lang === "ar-dz" ? "ar,fr,en" : "fr,en";
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": acceptLang,
    },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    address?: Record<string, string>;
  };
  const address = data.address;
  const city = pickAddressPart(address, [
    "city",
    "town",
    "village",
    "municipality",
    "county",
    "state_district",
  ]);
  const country = pickAddressPart(address, ["country"]);
  if (!city && !country) return null;

  return {
    city,
    country,
    label: formatPlace(city, country, lang),
  };
}

/** Demande la position puis résout ville / pays (Nominatim). */
export async function fetchVisitorPlace(
  lang: "fr" | "ar-dz",
): Promise<VisitorPlace | null> {
  if (!isGeolocationSupported()) return null;
  try {
    const pos = await getCurrentPosition(12_000);
    return await reverseGeocode(pos.coords.latitude, pos.coords.longitude, lang);
  } catch {
    return null;
  }
}
