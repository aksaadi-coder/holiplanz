import app from "./app.js";

const port = Number(process.env.BACKEND_PORT) || 3001;

app.listen(port, () => {
  console.log(`Holiplanz backend listening on http://localhost:${port}`);
  console.log(`Anthropic API key present: ${Boolean(process.env.ANTHROPIC_API_KEY)}`);
});
