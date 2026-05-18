export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  return res.status(503).json({
    error: "Monark service temporarily unavailable",
    plans: [],
  });
}
