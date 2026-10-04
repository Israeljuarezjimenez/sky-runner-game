document.addEventListener("DOMContentLoaded", () => {
  const taskItems = document.querySelectorAll(".task-item");
  taskItems.forEach((task) => {
    task.addEventListener("mouseenter", () => {
      task.style.borderColor = "rgba(139, 92, 246, 0.45)";
    });

    task.addEventListener("mouseleave", () => {
      task.style.borderColor = "rgba(148, 163, 184, 0.2)";
    });
  });

  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatMessages = document.getElementById("chatMessages");

  if (chatForm && chatInput && chatMessages) {
    chatForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      const userMessage = document.createElement("div");
      userMessage.className = "message user";
      userMessage.textContent = message;
      chatMessages.appendChild(userMessage);
      chatInput.value = "";
      chatInput.disabled = true;

      const button = chatForm.querySelector("button[type='submit']");
      if (button) {
        button.disabled = true;
        button.textContent = "Pensando...";
      }

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        });

        const data = await response.json();
        const botMessage = document.createElement("div");
        botMessage.className = "message bot";
        botMessage.textContent = data.reply || "No pude responder en este momento.";
        chatMessages.appendChild(botMessage);
      } catch (error) {
        const fallbackMessage = document.createElement("div");
        fallbackMessage.className = "message bot";
        fallbackMessage.textContent = "Hubo un problema con la IA. Intenta de nuevo en unos segundos.";
        chatMessages.appendChild(fallbackMessage);
      } finally {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.disabled = false;
        chatInput.focus();
        if (button) {
          button.disabled = false;
          button.textContent = "Enviar";
        }
      }
    });
  }
});
