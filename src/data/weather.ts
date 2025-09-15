export async function getWeather(lat: number, lon: number) {
  const u = new URL("/api/weather", location.origin);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lon", String(lon));
  const r = await fetch(u.toString());
  if (!r.ok) throw new Error("weather failed");
  return r.json();
}
