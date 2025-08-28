// app.js - Main application logic
import { authManager } from "./auth.js";
import {
  db,
  auth,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  query,
  orderBy,
} from "./firebase.js";

class RootrixApp {
  constructor() {
    // Add these Konami code properties
    this.konamiCode = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "KeyB",
      "KeyA",
    ];
    this.konamiInput = [];
    this.sakuraPetalsClicked = 0;

    this.init();
  }

  init() {
    this.setupAuthStateListener();
    this.initializeComponents();
    this.setupEventListeners();
  }

  setupAuthStateListener() {
    authManager.onAuthStateChange((authState) => {
      this.updateUI(authState);
    });
  }

  updateUI(authState) {
    // Update navigation
    const authLink = document.getElementById("authLink");
    const adminNav = document.getElementById("adminNav");

    if (authState.isAuthenticated) {
      if (authLink) {
        authLink.textContent = "Sign Out";
        authLink.href = "#";
        authLink.onclick = (e) => {
          e.preventDefault();
          this.handleSignOut();
        };
      }

      // Show admin navigation if user is admin
      if (adminNav) {
        adminNav.style.display = authState.isAdmin ? "block" : "none";
      }
    } else {
      if (authLink) {
        authLink.textContent = "Sign In";
        authLink.href = "../html/login.html";
        authLink.onclick = null;
      }

      if (adminNav) {
        adminNav.style.display = "none";
      }
    }
  }

  async handleSignOut() {
    const result = await authManager.signOut();
    if (result.success) {
      this.showNotification("Logged out successfully! 👋", "info");
    } else {
      this.showNotification("Error signing out: " + result.error, "error");
    }
  }

  initializeComponents() {
    this.initializeSakuraPetals();
    this.initializeMatrixRain();
    this.initializeScrollEffects();
    this.loadWriteups();
    this.initializeEasterEggs(); // Add this line!
    this.loadAchievements();
    this.loadEvents(); // Add this line to load events
    this.setupAdminModals();
    console.log("🌸 Rootrix Crew website initialized successfully!");
  }

  setupEventListeners() {
    // Admin modal handlers
    this.setupAdminHandlers();
  }

  // Add these new methods
  initializeEasterEggs() {
    // Konami code listener
    document.addEventListener("keydown", (e) => this.handleKonamiCode(e));

    // Sakura petal click handler
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("sakura-petal")) {
        this.handleSakuraPetalClick(e.target);
      }
    });
  }

  handleKonamiCode(e) {
    const konamiIndicator = document.getElementById("konamiIndicator");
    const konamiProgress = konamiIndicator?.querySelector(".konami-progress");

    if (!konamiIndicator || !konamiProgress) return;

    this.konamiInput.push(e.code);
    konamiIndicator.classList.add("active");

    const progress = (this.konamiInput.length / this.konamiCode.length) * 100;
    konamiProgress.style.width = progress + "%";

    // Check if sequence is correct
    let isCorrect = true;
    for (let i = 0; i < this.konamiInput.length; i++) {
      if (this.konamiInput[i] !== this.konamiCode[i]) {
        isCorrect = false;
        break;
      }
    }

    if (!isCorrect) {
      this.konamiInput = [];
      setTimeout(() => {
        konamiIndicator.classList.remove("active");
        konamiProgress.style.width = "0%";
      }, 500);
      return;
    }

    if (this.konamiInput.length === this.konamiCode.length) {
      setTimeout(() => {
        konamiIndicator.classList.remove("active");
        konamiProgress.style.width = "0%";
      }, 1000);

      this.activateKonamiCode();
      this.konamiInput = [];
    }
  }

  // ============= WRITEUPS MODULE =============
  async openWriteupEditor() {
    if (!authManager.isAdmin()) {
      this.showNotification(
        "Access denied! Admin privileges required.",
        "error"
      );
      return;
    }
    document.getElementById("writeupEditorModal").style.display = "block";
    await this.loadWriteupsList();
  }

  async handleAddWriteup(e) {
    e.preventDefault();

    if (!authManager.isAdmin()) {
      this.showNotification(
        "Access denied! Admin privileges required.",
        "error"
      );
      return;
    }

    const newWriteup = {
      title: document.getElementById("writeupTitle").value,
      type: document.getElementById("writeupType").value,
      topic: document.getElementById("writeupTopic").value,
      url: document.getElementById("writeupUrl").value,
      description: document.getElementById("writeupDescription").value,
      rating: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "writeups"), newWriteup);
      await this.loadWriteups();
      await this.loadWriteupsList();
      document.getElementById("addWriteupForm").reset();
      this.showNotification("Writeup added successfully! ✅", "achievement");
    } catch (error) {
      console.error("Error adding writeup:", error);
      this.showNotification("Error adding writeup: " + error.message, "error");
    }
  }
  // ============= EVENTS MODULE =============

  // Open Events Editor (Admin)
  async openEventsEditor() {
    if (!authManager.isAdmin()) {
      this.showNotification(
        "Access denied! Admin privileges required.",
        "error"
      );
      return;
    }
    document.getElementById("eventsEditorModal").style.display = "block";
    await this.loadEventsList();
  }

  // Handle Add Event (Admin)
  async handleAddEvent(e) {
    e.preventDefault();

    if (!authManager.isAdmin()) {
      this.showNotification(
        "Access denied! Admin privileges required.",
        "error"
      );
      return;
    }

    const newEvent = {
      title: document.getElementById("eventTitle").value,
      date: document.getElementById("eventDate").value,
      description: document.getElementById("eventDescription").value,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "events"), newEvent);
      await this.loadEvents();
      await this.loadEventsList();
      document.getElementById("addEventForm").reset();
      this.showNotification("Event added successfully! ✅", "achievement");
    } catch (error) {
      console.error("Error adding event:", error);
      this.showNotification("Error adding event: " + error.message, "error");
    }
  }

  // Load Events (Public View)
  async loadEvents() {
    const grid = document.getElementById("eventsGrid");
    if (!grid) return;

    try {
      grid.innerHTML = "";
      const q = query(collection(db, "events"), orderBy("date", "asc"));
      const snapshot = await getDocs(q);

      snapshot.forEach((docSnap) => {
        const event = docSnap.data();
        const card = this.createEventCard(event, docSnap.id);
        grid.appendChild(card);
      });
    } catch (error) {
      console.error("Error loading events:", error);
    }
  }

  // Create Event Card
  createEventCard(event, id) {
    const card = document.createElement("div");
    card.className = "event-card";
    card.setAttribute("data-event", id);

    card.innerHTML = `
        <h3 class="event-title">${event.title}</h3>
        <p class="event-date">📅 ${event.date}</p>
        <p class="event-desc">${event.description}</p>
    `;
    return card;
  }

  // Load Events in Admin Panel
  async loadEventsList() {
    const list = document.getElementById("eventsList");
    if (!list) return;

    try {
      list.innerHTML = "";
      const snapshot = await getDocs(collection(db, "events"));

      snapshot.forEach((docSnap) => {
        const event = docSnap.data();
        const item = this.createEventListItem(event, docSnap.id);
        list.appendChild(item);
      });
    } catch (error) {
      console.error("Error loading events list:", error);
    }
  }

  // Create Admin List Item
  createEventListItem(event, id) {
    const item = document.createElement("div");
    item.className = "event-admin-item";
    item.innerHTML = `
        <div>
            <strong>${event.title}</strong>
            <p>${event.date} - ${event.description}</p>
        </div>
        <button class="delete-btn" onclick="app.deleteEvent('${id}')">Delete</button>
    `;
    return item;
  }

  // Delete Event (Admin)
  async deleteEvent(id) {
    if (!authManager.isAdmin()) {
      this.showNotification(
        "Access denied! Admin privileges required.",
        "error"
      );
      return;
    }
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteDoc(doc(db, "events", id));
      await this.loadEvents();
      await this.loadEventsList();
      this.showNotification("Event deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting event:", error);
      this.showNotification("Error deleting event: " + error.message, "error");
    }
  }

  async loadWriteups() {
    const grid = document.getElementById("writeupsGrid");
    if (!grid) return;

    try {
      grid.innerHTML = "";
      const q = query(collection(db, "writeups"), orderBy("rating", "desc"));
      const snapshot = await getDocs(q);

      let writeups = [];
      snapshot.forEach((docSnap) => {
        writeups.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Top 4 by rating
      writeups.slice(0, 4).forEach((w) => {
        const card = this.createWriteupCard(w);
        grid.appendChild(card);
      });
    } catch (error) {
      console.error("Error loading writeups:", error);
    }
  }
  async voteOnWriteup(writeupId, value) {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to vote.");
      return;
    }

    const voteRef = doc(db, "writeups", writeupId, "votes", user.uid);
    const voteSnap = await getDoc(voteRef);

    let change = 0;

    if (!voteSnap.exists()) {
      await setDoc(voteRef, {
        value: value,
        timestamp: new Date(),
      });
      change = value;
    } else {
      const prevValue = voteSnap.data().value;
      if (prevValue === value) {
        await updateDoc(voteRef, { value: 0 });
        change = -prevValue;
      } else {
        await updateDoc(voteRef, { value: value });
        change = value - prevValue;
      }
    }

    if (change !== 0) {
      const writeupRef = doc(db, "writeups", writeupId);
      await updateDoc(writeupRef, {
        rating: increment(change),
      });

      // --- Fix rating text in UI ---
      const ratingEl = document.getElementById(`rating-${writeupId}`);
      if (ratingEl) {
        const current =
          parseInt(ratingEl.textContent.replace("⭐", "").trim()) || 0;
        ratingEl.textContent = `⭐ ${current + change}`;
      }
    }

    await this.loadWriteups();
  }
  createWriteupCard(writeup) {
    const card = document.createElement("article");
    card.className = "blog-card";
    card.innerHTML = `
    <div class="blog-category">${writeup.topic}</div>
    <h3 class="blog-title">${writeup.title}</h3>
    <p class="blog-preview">${writeup.description}</p>

    <div class="blog-meta">
      <div class="meta-left">
        <span class="type-pill">${writeup.type}</span>
        <span class="rating" id="rating-${writeup.id}">⭐ ${writeup.rating}</span>
      </div>

      <div class="meta-center">
        <button class="read-more" onclick="redirectTo('${writeup.url}')">Read More</button>
      </div>

      <div class="meta-right">
        <button class="vote-btn like-btn" onclick="app.voteOnWriteup('${writeup.id}', 1)">Like</button>
        <button class="vote-btn unlike-btn" onclick="app.voteOnWriteup('${writeup.id}', -1)">Unlike</button>
      </div>
    </div>
  `;
    return card;
  }

  async loadWriteupsList() {
    const list = document.getElementById("writeupsList");
    if (!list) return;

    try {
      list.innerHTML = "";
      const snapshot = await getDocs(collection(db, "writeups"));

      snapshot.forEach((docSnap) => {
        const writeup = docSnap.data();
        const item = document.createElement("div");
        item.className = "writeup-item";
        item.innerHTML = `
                <div>
                    <strong>${writeup.title}</strong>
                    <p>${writeup.description}</p>
                </div>
                <button class="delete-btn" onclick="app.deleteWriteup('${docSnap.id}')">Delete</button>
            `;
        list.appendChild(item);
      });
    } catch (error) {
      console.error("Error loading writeups list:", error);
    }
  }

  async deleteWriteup(id) {
    if (!authManager.isAdmin()) {
      this.showNotification(
        "Access denied! Admin privileges required.",
        "error"
      );
      return;
    }
    if (!confirm("Are you sure you want to delete this writeup?")) return;

    try {
      await deleteDoc(doc(db, "writeups", id));
      await this.loadWriteups();
      await this.loadWriteupsList();
      this.showNotification("Writeup deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting writeup:", error);
      this.showNotification(
        "Error deleting writeup: " + error.message,
        "error"
      );
    }
  }

  activateKonamiCode() {
    const terminal = document.getElementById("hiddenTerminal");
    if (terminal) {
      terminal.style.display = "block";
      terminal.style.animation = "slideIn 0.5s ease-out";
    }

    document.body.style.animation = "admin-unlock 2s ease-in-out";
    this.showNotification(
      "🎮 Konami Code Activated! Matrix Mode Unlocked!",
      "achievement"
    );

    const matrixRain = document.getElementById("matrixRain");
    if (matrixRain) {
      matrixRain.style.opacity = "0.3";
    }
  }

  handleSakuraPetalClick(petal) {
    // Prevent multiple clicks on the same petal
    if (petal.classList.contains("clicked")) return;

    this.sakuraPetalsClicked++;
    petal.classList.add("clicked");

    // Apply the burst animation
    petal.style.animation = "burst 0.5s forwards";

    // Show +1 feedback
    this.showPetalFeedback(petal);

    // Remove the petal after animation completes
    setTimeout(() => {
      if (petal.parentNode) {
        petal.parentNode.removeChild(petal);
      }
    }, 500);

    // Show achievement notifications
    if (this.sakuraPetalsClicked === 10) {
      this.showNotification(
        "🌸 Sakura Master! You've caught 10 petals!",
        "achievement"
      );
    } else if (this.sakuraPetalsClicked === 25) {
      this.showNotification(
        "🌸 Petal Collector! 25 petals collected!",
        "achievement"
      );
    }
  }

  showPetalFeedback(petal) {
    const feedback = document.createElement("div");
    feedback.className = "petal-feedback";
    feedback.textContent = "+1";

    // Position the feedback near the clicked petal
    const rect = petal.getBoundingClientRect();
    feedback.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top}px;
            font-family: 'Press Start 2P', cursive;
            font-size: 16px;
            color: #ff69b4;
            text-shadow: 0 0 10px #ff69b4, 0 0 20px #ff69b4;
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transform: translate(-50%, 0);
            animation: petalFeedback 1s ease-out forwards;
        `;

    document.body.appendChild(feedback);

    // Remove feedback after animation completes
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 1000);
  }

  setupAdminHandlers() {
    // Hall of Fame Editor
    const hofEditorBtn = document.querySelector(
      '[onclick="openHallOfFameEditor()"]'
    );
    if (hofEditorBtn) {
      hofEditorBtn.onclick = () => this.openHallOfFameEditor();
    }
    // Add Event Form
    const addEventForm = document.getElementById("addEventForm");
    if (addEventForm) {
      addEventForm.onsubmit = (e) => this.handleAddEvent(e);
    }

    const writeupEditorBtn = document.querySelector(
      '[onclick="openWriteupEditor()"]'
    );
    if (writeupEditorBtn) {
      writeupEditorBtn.onclick = () => this.openWriteupEditor();
    }
    // Add Writeup Form
    const addWriteupForm = document.getElementById("addWriteupForm");
    if (addWriteupForm) {
      addWriteupForm.onsubmit = (e) => this.handleAddWriteup(e);
    }

    // Add Achievement Form
    const addAchievementForm = document.getElementById("addAchievementForm");
    if (addAchievementForm) {
      addAchievementForm.onsubmit = (e) => this.handleAddAchievement(e);
    }
  }

  setupAdminModals() {
    // Hall of Fame Modal
    const hofModal = document.getElementById("hofEditorModal");
    const hofClose = hofModal?.querySelector(".hof-close");

    if (hofClose) {
      hofClose.onclick = () => {
        hofModal.style.display = "none";
      };
    }
    const writeupModal = document.getElementById("writeupEditorModal");
    const writeupClose = writeupModal?.querySelector(".writeup-close");

    if (writeupClose) {
      writeupClose.onclick = () => {
        writeupModal.style.display = "none";
      };
    }
    const eventsModal = document.getElementById("eventsEditorModal");
    const eventsClose = eventsModal?.querySelector(".events-close");

    if (eventsClose) {
      eventsClose.onclick = () => {
        eventsModal.style.display = "none";
      };
    }

    window.onclick = function (event) {
      if (event.target === hofModal) hofModal.style.display = "none";
      if (event.target === writeupModal) writeupModal.style.display = "none";
      if (event.target === eventsModal) eventsModal.style.display = "none";
    };

    window.onclick = function (event) {
      if (event.target === hofModal) hofModal.style.display = "none";
      if (event.target === writeupModal) writeupModal.style.display = "none";
    };
  }

  async openHallOfFameEditor() {
    if (!authManager.isAdmin()) {
      this.showNotification(
        "Access denied! Admin privileges required.",
        "error"
      );
      return;
    }

    document.getElementById("hofEditorModal").style.display = "block";
    await this.loadAchievementsList();
  }

  async handleAddAchievement(e) {
    e.preventDefault();

    if (!authManager.isAdmin()) {
      this.showNotification(
        "Access denied! Admin privileges required.",
        "error"
      );
      return;
    }

    const newAchievement = {
      icon: document.getElementById("achievementIcon").value,
      title: document.getElementById("achievementTitle").value,
      description: document.getElementById("achievementDescription").value,
      date: document.getElementById("achievementDate").value,
      place: document.getElementById("achievementPlace").value || "",
      createdBy: authManager.currentUser.uid,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "Card"), newAchievement);
      await this.loadAchievements();
      await this.loadAchievementsList();

      document.getElementById("addAchievementForm").reset();
      this.showNotification(
        "Achievement added successfully! ✅",
        "achievement"
      );
    } catch (error) {
      console.error("Error adding achievement:", error);
      this.showNotification(
        "Error adding achievement: " + error.message,
        "error"
      );
    }
  }

  async loadAchievements() {
    const grid = document.getElementById("achievementsGrid");
    if (!grid) return;

    try {
      grid.innerHTML = "";
      const snapshot = await getDocs(collection(db, "Card"));

      snapshot.forEach((docSnap) => {
        const achievement = docSnap.data();
        const achievementCard = this.createAchievementCard(
          achievement,
          docSnap.id
        );
        grid.appendChild(achievementCard);
      });
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
  }

  // Add this method to your RootrixApp class
  getIconFromType(iconType) {
    const iconMap = {
      "trophy-gold": "🏆",
      "trophy-silver": "🥈",
      "trophy-bronze": "🥉",
      "badge-security": "🛡️",
      "badge-knowledge": "📚",
      "badge-community": "👥",
    };

    // Return the emoji if it's an icon type, otherwise return the value as-is (in case it's already an emoji)
    return iconMap[iconType] || iconType || "🏆";
  }

  createAchievementCard(achievement, id) {
    const achievementCard = document.createElement("div");
    achievementCard.className = "achievement-card";
    achievementCard.setAttribute("data-achievement", id);

    // Convert icon type to actual emoji
    const displayIcon = this.getIconFromType(achievement.icon);

    achievementCard.innerHTML = `
        <div class="achievement-icon ${this.getIconClass(achievement.icon)}">
            ${displayIcon}
        </div>
        <h3>${achievement.title}</h3>
        <p>${achievement.description}</p>
        <div class="achievement-date">${achievement.date}</div>
        ${
          achievement.place
            ? `<div class="achievement-place">${achievement.place}</div>`
            : ""
        }
    `;
    return achievementCard;
  }

  getIconClass(icon) {
    // Map both icon types and emojis to CSS classes
    const iconClasses = {
      "trophy-gold": "trophy-gold",
      "trophy-silver": "trophy-silver",
      "trophy-bronze": "trophy-bronze",
      "badge-security": "badge-security",
      "badge-knowledge": "badge-knowledge",
      "badge-community": "badge-community",
      "🏆": "trophy-gold",
      "🥈": "trophy-silver",
      "🥉": "trophy-bronze",
      "🛡️": "badge-security",
      "📚": "badge-knowledge",
      "👥": "badge-community",
    };
    return iconClasses[icon] || "badge-security";
  }

  async loadAchievementsList() {
    const list = document.getElementById("achievementsList");
    if (!list) return;

    try {
      list.innerHTML = "";
      const snapshot = await getDocs(collection(db, "Card"));

      snapshot.forEach((docSnap) => {
        const achievement = docSnap.data();
        const item = this.createAchievementListItem(achievement, docSnap.id);
        list.appendChild(item);
      });
    } catch (error) {
      console.error("Error loading achievements list:", error);
    }
  }

  createAchievementListItem(achievement, id) {
    const item = document.createElement("div");
    item.className = "achievement-item";
    item.innerHTML = `
            <div>
                <strong>${achievement.title}</strong>
                <p>${achievement.description} - ${achievement.date}</p>
                ${
                  achievement.place ? `<small>${achievement.place}</small>` : ""
                }
            </div>
            <button class="delete-btn" onclick="app.deleteAchievement('${id}')">Delete</button>
        `;
    return item;
  }

  async deleteAchievement(id) {
    if (!authManager.isAdmin()) {
      this.showNotification(
        "Access denied! Admin privileges required.",
        "error"
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this achievement?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "Card", id));
      await this.loadAchievements();
      await this.loadAchievementsList();
      this.showNotification("Achievement deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting achievement:", error);
      this.showNotification(
        "Error deleting achievement: " + error.message,
        "error"
      );
    }
  }

  // Utility methods
  showNotification(message, type) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById("notification");
    if (!notification) {
      notification = document.createElement("div");
      notification.id = "notification";
      notification.className = "notification";
      document.body.appendChild(notification);
    }

    // Clear any existing timeout to prevent conflicts
    if (this.notificationTimeoutId) {
      clearTimeout(this.notificationTimeoutId);
      this.notificationTimeoutId = null;
    }

    // Update notification content and show it
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    // Set new timeout to hide notification
    this.notificationTimeoutId = setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300); // Wait for transition to finish before removing
      this.notificationTimeoutId = null; // Clear the reference
    }, 4000); // Hide after 4 seconds
  }

  // Initialize visual effects
  initializeSakuraPetals() {
    const container = document.querySelector(".sakura-container");
    if (!container) return;

    // Clear any existing petals first
    container.innerHTML = "";

    setInterval(() => {
      const petal = document.createElement("div");
      petal.className = "sakura-petal";
      petal.style.left = Math.random() * 100 + "%";
      // Make petals fall slower (8-12 seconds) for better interactivity
      const duration = Math.random() * 4 + 8;
      petal.style.animationDuration = duration + "s";

      container.appendChild(petal);

      // Remove petal after animation completes
      setTimeout(() => {
        if (petal.parentNode) {
          petal.parentNode.removeChild(petal);
        }
      }, duration * 1000); // Match the animation duration
    }, 500); // Spawn petals every 0.5 seconds (more petals)
  }

  initializeMatrixRain() {
    const matrixContainer = document.querySelector(".matrix-rain");
    if (!matrixContainer) return;

    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < 100; i++) {
      const char = document.createElement("div");
      char.className = "matrix-char";
      char.textContent = chars[Math.floor(Math.random() * chars.length)];
      char.style.left = Math.random() * 100 + "%";
      char.style.animationDelay = Math.random() * 5 + "s";
      char.style.animationDuration = Math.random() * 3 + 2 + "s";
      matrixContainer.appendChild(char);
    }
  }

  initializeScrollEffects() {
    const scrollProgress = document.querySelector(".scroll-progress");
    if (!scrollProgress) return;

    window.addEventListener("scroll", () => {
      const scrollPercent =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
        100;
      scrollProgress.style.width = scrollPercent + "%";
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new RootrixApp();
});

// Global function for backward compatibility
window.deleteAchievement = (id) => {
  if (window.app) {
    window.app.deleteAchievement(id);
  }
};
window.redirectTo = (url) => {
  if (confirm("You are being redirected to a third-party site. Continue?")) {
    window.open(url, "_blank");
  }
};
