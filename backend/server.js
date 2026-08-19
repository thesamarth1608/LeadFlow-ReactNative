const express = require("express");
require("dotenv").config();

const app = express();
const path = require("path");

app.get("/privacy-policy", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "privacyPolicy", "index.html"));
});
// const PORT = 3000;
const leads = [];

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

async function fetchLeadDetails(leadgenId) {
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;

  if (!pageAccessToken) {
    console.error("META_PAGE_ACCESS_TOKEN is missing from the .env file.");
    return;
  }

  const query = new URLSearchParams({
    fields: "field_data",
    access_token: pageAccessToken
  });

  try {
    const response = await fetch(
      "https://graph.facebook.com/" + encodeURIComponent(leadgenId) + "?" + query.toString()
    );

    if (!response.ok) {
      const errorBody = await response.text();
      const safeErrorBody = errorBody.replace(pageAccessToken, "[REDACTED]");

      console.error("Meta Graph API request failed.");
      console.error("HTTP status:", response.status);
      console.error("Meta error:", safeErrorBody);

      return;
    }

    const lead = await response.json();
    const leadDetails = {
      leadgen_id: leadgenId,
      full_name: lead.full_name || lead.name || "",
      email: lead.email || "",
      phone_number: lead.phone_number || ""
    };

    if (Array.isArray(lead.field_data)) {
      lead.field_data.forEach((field) => {
        const fieldValue = Array.isArray(field.values) ? field.values[0] || "" : "";

        if (field.name === "full_name" || field.name === "name") {
          leadDetails.full_name = fieldValue;
        }

        if (field.name === "email") {
          leadDetails.email = fieldValue;
        }

        if (field.name === "phone_number") {
          leadDetails.phone_number = fieldValue;
        }
      });
    }

    console.log("Fetched lead details:");
    console.dir(leadDetails, { depth: null });

    leads.push(leadDetails);
    return leadDetails;
  } catch (error) {
    console.error("Could not fetch lead details from the Meta Graph API.");
  }
}

app.get("/leads", (req, res) => {
  try {
    return res.status(200).json({
      leads: leads
    });
  } catch (error) {
    console.error("Could not return stored leads.");
    return res.status(500).json({
      message: "Could not return stored leads"
    });
  }
});

app.post("/leads", (req, res) => {
  const { leadgen_id, full_name, email, phone_number } = req.body || {};

  if (!leadgen_id || !full_name || !email || !phone_number) {
    return res.status(400).json({
      message: "leadgen_id, full_name, email, and phone_number are required"
    });
  }

  const newLead = {
    leadgen_id: leadgen_id,
    full_name: full_name,
    email: email,
    phone_number: phone_number
  };

  leads.push(newLead);

  return res.status(201).json({
    lead: newLead
  });
});

app.post('/webhook', (req, res) => {
  console.log("Received Meta webhook payload:");
  console.dir(req.body, { depth: null });

  const leadgenIds = [];

  if (req.body && Array.isArray(req.body.entry)) {
    req.body.entry.forEach((entry) => {
      if (!Array.isArray(entry.changes)) {
        return;
      }

      entry.changes.forEach((change) => {
        if (
          change.field === "leadgen" &&
          change.value &&
          change.value.leadgen_id
        ) {
          leadgenIds.push(change.value.leadgen_id);
        }
      });
    });
  }

  leadgenIds.forEach((leadgenId) => {
    console.log("Received leadgen_id: " + leadgenId);
    fetchLeadDetails(leadgenId);
  });

 res.status(200).json({
    message: "webhook received successfully"
  });
});

app.listen(3000, () => {
  console.log("Server started is successfully");
});
