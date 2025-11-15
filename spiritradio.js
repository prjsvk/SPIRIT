// Spirit Radio - AI-Powered Music Generator using Beatoven.ai API
class SpiritRadio {
  constructor() {
    this.currentTaskId = null;
    this.isGenerating = false;
    this.pollInterval = null;
    this.BEATOVEN_API_KEY = 'zl9akEJjTzvIUIsLICmqdQ';
    this.BASE_URL = 'https://public-api.beatoven.ai/api/v1';

    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Generate button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateMusic());
    }
  }

  async generateMusic() {
    if (this.isGenerating) return;

    this.isGenerating = true;
    this.showLoadingState();

    try {
      // Get user preferences
      const mood = document.getElementById('mood').value;
      const taskType = document.getElementById('task').value;

      // Call Beatoven API to generate beat
      const response = await fetch(`${this.BASE_URL}/tracks/compose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.BEATOVEN_API_KEY}`
        },
        body: JSON.stringify({
          prompt: { text: `30 seconds ${this.resolveMood(mood)} ${this.resolveGenre(taskType)} track` },
          format: 'mp3',
          looping: false
        })
      });

      if (!response.ok) throw new Error('Failed to start generation');

      const data = await response.json();
      this.currentTaskId = data.task_id;

      // Start polling for status
      this.pollStatus();

    } catch (error) {
      console.error('Error generating music:', error);
      this.showError('Failed to generate music. Please try again.');
    }
  }

  async pollStatus() {
    this.pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this.BASE_URL}/tasks/${this.currentTaskId}`, {
          headers: { 'Authorization': `Bearer ${this.BEATOVEN_API_KEY}` }
        });
        const data = await response.json();

        const statusEl = document.getElementById('status');
        const progressBar = document.getElementById('progressBar');

        if (statusEl) statusEl.textContent = data.status === 'composed' ? '✅ Track ready to vibe!' : '⏳ Composing your custom beat...';

        if (data.status === 'composed') {
          clearInterval(this.pollInterval);
          this.isGenerating = false;
          this.showPlayer(data.meta.track_url);
        } else {
          // Update progress based on status
          if (progressBar) {
            const progress = this.getProgressForStatus(data.status);
            progressBar.style.width = `${progress}%`;
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(this.pollInterval);
        this.showError('Failed to check generation status.');
      }
    }, 2000); // Poll every 2 seconds
  }

  getProgressForStatus(status) {
    const progressMap = {
      'pending': 10,
      'processing': 30,
      'composing': 70,
      'finalizing': 90
    };
    return progressMap[status] || 50;
  }

  showPlayer(trackUrl) {
    const player = document.getElementById('player');
    const downloadLink = document.getElementById('downloadLink');
    const progressContainer = document.getElementById('progressContainer');
    const generateBtn = document.getElementById('generateBtn');
    const statusEl = document.getElementById('status');

    if (player) {
      player.src = trackUrl;
      player.style.display = 'block';
    }
    if (downloadLink) {
      downloadLink.href = trackUrl;
      downloadLink.style.display = 'block';
    }
    if (progressContainer) progressContainer.style.display = 'none';
    if (generateBtn) generateBtn.disabled = false;
    if (statusEl) statusEl.textContent = 'NEURAL PATTERN READY';

    // Create visualizer bars
    this.createVisualizer();

    // Add badges
    this.addBadges();
  }

  createVisualizer() {
    const visualizer = document.getElementById('visualizer');
    if (!visualizer) return;

    visualizer.innerHTML = '';
    for (let i = 0; i < 50; i++) {
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.animationDelay = `${Math.random()}s`;
      bar.style.height = `${10 + Math.random() * 90}px`;
      visualizer.appendChild(bar);
    }
  }

  addBadges() {
    const badgesContainer = document.getElementById('badges');
    if (!badgesContainer) return;

    const mood = document.getElementById('mood').value;
    const badgeText = {
      happy: "😊 NEON BLISS MODE",
      sad: "😢 MELANCHOLIC WAVES",
      focused: "🧠 HYPERFOCUS ENGAGED",
      tired: "😴 CHILL FREQUENCIES",
      energetic: "⚡ POWER SURGE"
    }[mood];

    badgesContainer.innerHTML =
      `<div class="badge">${badgeText}</div>
       <div class="badge">🎧 AUDIO MATRIX SYNCHRONIZED</div>`;
  }

  showLoadingState() {
    const progressContainer = document.getElementById('progressContainer');
    const statusEl = document.getElementById('status');
    const generateBtn = document.getElementById('generateBtn');

    if (progressContainer) progressContainer.style.display = 'block';
    if (statusEl) statusEl.textContent = 'INITIALIZING NEURAL SYNTHESIS...';
    if (generateBtn) generateBtn.disabled = true;
  }

  showError(message) {
    const statusEl = document.getElementById('status');
    const generateBtn = document.getElementById('generateBtn');
    const progressContainer = document.getElementById('progressContainer');

    if (this.pollInterval) clearInterval(this.pollInterval);
    this.isGenerating = false;

    if (statusEl) statusEl.textContent = `ERROR: ${message}`;
    if (generateBtn) generateBtn.disabled = false;
    if (progressContainer) progressContainer.style.display = 'none';
  }

  resolveGenre(task) {
    const map = {
      study: 'lo-fi',
      writing: 'cinematic',
      coding: 'chill hop',
      workout: 'electronic',
      relax: 'ambient'
    };
    return map[task.toLowerCase()] || 'lo-fi';
  }

  resolveMood(mood) {
    const map = {
      happy: 'peaceful',
      sad: 'melancholy',
      tired: 'calm',
      neutral: 'neutral',
      focused: 'intense',
      energetic: 'uplifting'
    };
    return map[mood.toLowerCase()] || 'neutral';
  }
}

// Initialize Spirit Radio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SpiritRadio();
});
be