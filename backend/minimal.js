import express from "express";

const app = express();
app.use(express.json());

app.post("/api/ai/extract-tasks", (req, res) => {
  res.json({ tasks: [{ id: "1", title: "Test task" }] });
});

app.listen(5000, () => {
  console.log("Minimal server on 5000");
});
