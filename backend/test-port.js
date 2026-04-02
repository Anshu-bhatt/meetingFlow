import express from "express";

const app = express();
app.use(express.json());

app.post("/test", (req, res) => {
  console.log("Request received!");
  res.json({ ok: true });
});

const PORT = 9999;
app.listen(PORT, () => {
  console.log(`Server on ${PORT}`);
});
