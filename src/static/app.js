document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options (keep placeholder)
      if (activitySelect) {
        activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      }

      // Helper to format participant display text
      function formatParticipant(p) {
        if (!p && p !== 0) return "";
        if (typeof p === "string") return p;
        if (typeof p === "object") {
          return p.name || p.email || JSON.stringify(p);
        }
        return String(p);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML with delete icon
        let participantsHtml = "";
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const items = details.participants
            .map((p) => {
              const participantId = typeof p === "object" ? (p.email || p.name || JSON.stringify(p)) : p;
              return `<li data-activity="${escapeHtml(name)}" data-participant="${escapeHtml(participantId)}">
                <span class="participant-name">${escapeHtml(formatParticipant(p))}</span>
                <span class="delete-participant" title="Remove participant">&#128465;</span>
              </li>`;
            })
            .join("");
          participantsHtml = `<ul class="participants-list no-bullets">${items}</ul>`;
        } else {
          participantsHtml = `<p class="participants-empty">No participants yet</p>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <h5>Participants</h5>
            ${participantsHtml}
          </div>
        `;
  // Delegate click event for delete icon
  document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-participant")) {
      const li = event.target.closest("li[data-activity][data-participant]");
      if (!li) return;
      const activity = li.getAttribute("data-activity");
      const participant = li.getAttribute("data-participant");
      if (!activity || !participant) return;

      // Call API to unregister participant
      try {
        const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?participant=${encodeURIComponent(participant)}`, {
          method: "POST"
        });
        const result = await response.json();
        if (response.ok) {
          messageDiv.textContent = result.message || "Participant removed.";
          messageDiv.className = "success";
          fetchActivities();
        } else {
          messageDiv.textContent = result.detail || "Failed to remove participant.";
          messageDiv.className = "error";
        }
        messageDiv.classList.remove("hidden");
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 3000);
      } catch (error) {
        messageDiv.textContent = "Error removing participant.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    }
  });

        activitiesList.appendChild(activityCard);

    // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Small helper to escape HTML to avoid injection when inserting strings
  function escapeHtml(str) {
    if (typeof str !== "string") return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the UI shows the newly-registered participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
