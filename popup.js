document.getElementById("generateEmail").addEventListener("click", async () => {
    try {
        const response = await fetch("http://localhost:5000/get-email"); // Calling your existing server
        const data = await response.json();
        
        if (data.email) {
            localStorage.setItem("tempEmail", data.email);
            document.getElementById("email").innerText = data.email;
        } else {
            document.getElementById("email").innerText = "Failed to generate email.";
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("email").innerText = "Server Error.Please try again later";
    }
});

document.getElementById("refreshInbox").addEventListener("click", async () => {
    try {
        const email = localStorage.getItem("tempEmail");
        if (!email) return alert("Generate an email first!");

        const response = await fetch("http://localhost:5000/get-inbox"); // Fetch messages
        const data = await response.json();
        console.log("📩 Inbox Response:", data); // Debugging log

        let inboxDiv = document.getElementById("inbox");
        inboxDiv.innerHTML = "";

        if (!data.messages || data.messages.length === 0) {
            inboxDiv.innerHTML = "<p>No new messages.</p>";
        } else {
            data.messages.forEach(msg => {
                let emailItem = document.createElement("div");

                // Extract email fields properly
                let from = msg.from ? msg.from.address : "Unknown Sender"; 
                let subject = msg.subject || "No Subject"; 
                let body = msg.intro || msg.text || "No Message Content"; 

                emailItem.innerHTML = `
                    <strong>From:</strong> ${from} <br>
                    <strong>Subject:</strong> ${subject} <br>
                    <strong>Message:</strong> ${body}
                    <hr>
                `;
                inboxDiv.appendChild(emailItem);
            });
        }
    } catch (error) {
        console.error("Error fetching inbox:", error);
        document.getElementById("inbox").innerText = "Failed to load inbox.";
    }
});
