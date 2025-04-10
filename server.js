import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const API_URL = "https://api.mail.tm";
let tempEmail = "";
let authToken = "";

app.get("/get-email", async (req, res) => {
    try {
        // Fetch available domains
        const domainRes = await fetch(`${API_URL}/domains`);
        const domainText = await domainRes.text();

        let domainData;
        try {
            domainData = JSON.parse(domainText);
        } catch {
            console.error("Invalid JSON response:", domainText);
            return res.status(500).json({ error: "Invalid response from API" });
        }

        if (!domainData["hydra:member"] || domainData["hydra:member"].length === 0) {
            return res.status(500).json({ error: "No domains available" });
        }

        const domain = domainData["hydra:member"][0].domain;
        tempEmail = `user${Date.now()}@${domain}`;
        const password = "SecurePass123";

        // Create a new account
        const accountRes = await fetch(`${API_URL}/accounts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: tempEmail, password })
        });

        if (!accountRes.ok) {
            const errorText = await accountRes.text();
            console.error("Failed to create account:", errorText);
            return res.status(500).json({ error: "Failed to create account" });
        }

        // Get authentication token
        const tokenRes = await fetch(`${API_URL}/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: tempEmail, password })
        });

        const tokenText = await tokenRes.text();
        let tokenData;
        try {
            tokenData = JSON.parse(tokenText);
        } catch {
            console.error("Invalid JSON response for token:", tokenText);
            return res.status(500).json({ error: "Invalid response when getting token" });
        }

        if (!tokenData.token) {
            return res.status(500).json({ error: "Failed to get authentication token" });
        }

        authToken = tokenData.token;
        console.log("✅ Temporary Email Created:", tempEmail);

        res.json({ email: tempEmail });

    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// ✅ NEW: Get Inbox Messages
app.get("/get-inbox", async (req, res) => {
    try {
        if (!authToken) {
            return res.status(401).json({ error: "Authentication token missing. Generate an email first." });
        }

        // Fetch inbox messages from Mail.tm
        const inboxRes = await fetch(`${API_URL}/messages`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        });

        const inboxText = await inboxRes.text();
        let inboxData;
        try {
            inboxData = JSON.parse(inboxText);
        } catch {
            console.error("❌ Invalid JSON response for inbox:", inboxText);
            return res.status(500).json({ error: "Invalid response when fetching inbox" });
        }

        console.log("📩 Inbox Data:", inboxData);

        res.json({ messages: inboxData["hydra:member"] || [] });

    } catch (error) {
        console.error("❌ Error fetching inbox:", error);
        res.status(500).json({ error: "Something went wrong while fetching inbox" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
