export default async function handler(req, res) {
  try {
    const { lat, lon } = req.query || {};
    if (!lat || !lon) return res.status(400).json({ error: "lat & lon required" });

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&units=metric&appid=${process.env.OPENWEATHER_KEY}`;

    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text || "Upstream error" });
    }

    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
