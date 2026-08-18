const express = require("express");
require("dotenv").config();

const app = express();
// const PORT = 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send("LeadFlow Backend is running!");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post('/webhook', (req, res) => {
  // console.log("Received webhook event:", req.body);
  console.dir(req.body, { depth: null });
 res.status(200).json({
    message: "webhook received successfully"
  });
});

app.listen(3000, () => {
  console.log("Server started is successfully");
});
