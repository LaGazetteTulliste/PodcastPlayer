let audioPlayer = null;

class AudioPlayer {
  constructor() {
    this.audioPlayer = null;
    this.isPlaying = false;
    this.progressBar = null;
    this.progressTime = null;
    this.autoStopDuration = 300;
    this.autoStopTimeout = null;
    this.title = "";
    this.autoStopEnabled = false;
  }

  preloadAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';

    // Add an event listener to handle the loadedmetadata event
    audio.addEventListener('loadedmetadata', () => {
      // Update the timestamp with the duration of the audio
      this.progressTime.textContent = `0:00 / ${this.formatTime(audio.duration)}`;
    });

    // Add an event listener to handle the canplaythrough event
    audio.addEventListener('canplaythrough', () => {
      // Remove the loading animation and update the title
      const episodeTitle = document.getElementById('episodeTitle');
      episodeTitle.textContent = audioPlayer.title;
    });
  }

  createPlayer(audioUrl, title) {
    this.title = title;
    if (this.audioPlayer) {
      // Replace the audio source with the new URL
      this.audioPlayer.src = audioUrl;

      // Preload the new audio file
      this.preloadAudio(audioUrl);

      // Set the title to indicate loading
      const episodeTitle = document.getElementById('episodeTitle');
      episodeTitle.textContent = 'Chargement...';

      // Set the timestamp to 0/...
      this.progressTime.textContent = '0:00 / ...';
    } else {
      const playerContainer = document.createElement('div');
      playerContainer.id = 'audioPlayerContainer';
      playerContainer.innerHTML = `
        <div id="episodeTitle">Chargement...</div>
        <button title="Arrêter la lecture" id="stopButton">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#161C20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div id="progressBarContainer">
          <div id="progressBar"></div>
        </div>
        <div id="utils">
          <div id="progressTime">00:00 / ...</div>
          <div title="Mise en veille automatique" id="autoStop">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="butt" stroke-linejoin="bevel">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>
        </div>
        <div id="audioPlayer">
          <audio id="audio_element" title="${title}" src="${audioUrl}"></audio>
        </div>
        <div id="playerControls">
          <button title="Reculer de 15s" id="backwardButton" class="playerButton">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"/>
            </svg>
          </button>
          <button title="Reprendre la lecture" id="playButton" class="playerButton">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          <button title="Mettre la lecture en pause" id="pauseButton" class="playerButton">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </button>
          <button title="Avancer de 15s" id="forwardButton" class="playerButton">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
            </svg>
          </button>
        </div>
      `;
      document.body.appendChild(playerContainer);

      this.audioPlayer = document.getElementById('audio_element');
      this.progressBar = document.querySelector('#progressBar');
      this.progressTime = document.querySelector('#progressTime');
      this.addEventListeners();

      // Preload the audio file
      this.preloadAudio(audioUrl);

      // Set the source of the audio player
      this.audioPlayer.src = audioUrl;
      this.updateProgressBar();
    }
  }

  addEventListeners() {
    const playButton = document.querySelector('#playButton');
    const pauseButton = document.querySelector('#pauseButton');
    const backwardButton = document.querySelector('#backwardButton');
    const forwardButton = document.querySelector('#forwardButton');
    const stopButton = document.querySelector('#stopButton');
    const autoStopButton = document.querySelector('#autoStop');
    const progressBarContainer = document.querySelector('#progressBarContainer');

    autoStopButton.addEventListener('click', this.toggleAutoStop.bind(this));
    playButton.addEventListener('click', this.play.bind(this));
    pauseButton.addEventListener('click', this.pause.bind(this));
    backwardButton.addEventListener('click', this.backward.bind(this));
    forwardButton.addEventListener('click', this.forward.bind(this));
    stopButton.addEventListener('click', this.stop.bind(this));
    this.audioPlayer.addEventListener('ended', this.handleAudioEnd.bind(this));
    progressBarContainer.addEventListener('click', (event) => {
      this.changeTime(event);
    });
  }

  toggleAutoStop() {
    const autoStopDialog = document.querySelector('#autoStopDialog');

    if (autoStopDialog) {
      autoStopDialog.remove();
    } else {
      this.promptAutoStopDuration();
    }
  }

  promptAutoStopDuration() {
    const options = [300, 900, 1800, 3600]; // Durations in seconds
    const optionLabels = ['5m', '15m', '30m', '60m'];

    const dialogContainer = document.createElement('div');
    dialogContainer.id = 'autoStopDialog';
    dialogContainer.style.position = 'fixed';
    dialogContainer.style.top = '34%';
    dialogContainer.style.left = '50%';
    dialogContainer.style.transform = 'translate(-50%, -50%)';
    dialogContainer.style.backgroundColor = '#fff';
    dialogContainer.style.border = '1px solid #cccccc';
    dialogContainer.style.borderRadius = '10px';
    dialogContainer.style.padding = '16px';
    dialogContainer.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.1)';
    dialogContainer.style.zIndex = '9999';
    dialogContainer.style.display = 'flex';
    dialogContainer.style.flexDirection = 'column';
    dialogContainer.style.gap = '10px';
    dialogContainer.style.width = '60%';
    dialogContainer.style.textAlign = 'center';
    dialogContainer.style.alignItems = 'center';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Annuler';
    closeButton.style.marginRight = '8px';
    closeButton.style.background = '#ccc';
    closeButton.style.color = '#000';
    closeButton.style.outline = 'none';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '8px';
    closeButton.style.width = '100px';

    // Add cursor pointer style
    closeButton.style.cursor = 'pointer';

    closeButton.addEventListener('click', () => {
      dialogContainer.remove();
    });

    dialogContainer.appendChild(closeButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Désactiver';
    cancelButton.style.marginRight = '8px';
    cancelButton.style.background = '#ccc';
    cancelButton.style.color = '#000';
    cancelButton.style.outline = 'none';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '8px';
    cancelButton.style.width = '100px';

    cancelButton.addEventListener('click', () => {
        if (this.autoStopTimeout) {
            clearTimeout(this.autoStopTimeout);
            this.autoStopTimeout = null;
            this.autoStopEnabled = false;
            console.log('Auto-stop canceled.');
            dialogContainer.remove();
        }
    });

    // Add cursor pointer style
    cancelButton.style.cursor = 'pointer';

    if (this.autoStopEnabled) {
        dialogContainer.appendChild(cancelButton);
    }

    const titleElement = document.createElement('h2');
    titleElement.textContent = 'Mise en veille automatique';
    titleElement.style.marginTop = '0';
    titleElement.style.marginBottom = '16px';

    dialogContainer.appendChild(titleElement);

    options.forEach((duration, index) => {
      const button = document.createElement('button');
      button.textContent = optionLabels[index];
      button.style.marginRight = '8px';
      button.style.background = '#13357a';
      button.style.color = '#fff';
      button.style.outline = 'none';
      button.style.border = 'none';
      button.style.borderRadius = '8px';
      button.style.width = '150px';

      // Add cursor pointer style
      button.style.cursor = 'pointer';

      button.addEventListener('click', () => {
        this.startAutoStopTimer(duration);
        dialogContainer.remove();
      });
      dialogContainer.appendChild(button);
    });

    document.body.appendChild(dialogContainer);
  }

  startAutoStopTimer(duration) {
    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
    }

    this.autoStopDuration = duration;

    this.autoStopTimeout = setTimeout(() => {
      this.stop();
    }, this.autoStopDuration * 1000); // Convert seconds to milliseconds

    this.autoStopEnabled = true;
    console.log(`Auto-stop enabled. The audio will stop after ${this.formatTime(this.autoStopDuration)}.`);
  }

  play() {
    if (!this.isPlaying) {
      // Show the player
      const audioPlayerContainer = document.querySelector('#audioPlayerContainer');
      if (audioPlayerContainer) {
        audioPlayerContainer.style.display = "flex";
      }
      this.audioPlayer.play();
      this.isPlaying = true;
      this.updateButtons();
      this.updateProgressBar();
    }
  }

  pause() {
    if (this.isPlaying) {
      this.audioPlayer.pause();
      this.isPlaying = false;
      this.updateButtons();
    }
  }

  stop() {
    this.pause();
    this.audioPlayer.currentTime = 0;
    // Remove the player
    const audioPlayerContainer = document.querySelector('#audioPlayerContainer');
    if (audioPlayerContainer) {
      audioPlayerContainer.style.display = "none";
    }

    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
      this.autoStopTimeout = null;
      this.autoStopEnabled = false;
      console.log('Auto-stop canceled.');
    }
  }

  backward() {
    this.audioPlayer.currentTime -= 15;
  }

  forward() {
    this.audioPlayer.currentTime += 15;
  }

  handleAudioEnd() {
    this.isPlaying = false;
    this.updateButtons();
  }

  updateButtons() {
    const playButton = document.querySelector('#playButton');
    const pauseButton = document.querySelector('#pauseButton');

    if (this.isPlaying) {
      playButton.style.display = 'none';
      pauseButton.style.display = 'block';
    } else {
      playButton.style.display = 'block';
      pauseButton.style.display = 'none';
    }
  }

  updateProgressBar() {
    this.audioPlayer.addEventListener('timeupdate', () => {
      const currentTime = this.audioPlayer.currentTime;
      const duration = this.audioPlayer.duration;

      // Check if duration is a finite number
      if (duration && Number.isFinite(duration)) {
        const progress = (currentTime / duration) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.progressTime.textContent = this.formatTime(currentTime) + " / " + this.formatTime(duration);
      } else {
        console.error('Invalid duration value:', duration);
      }
    });
  }

  changeTime(event) {
    const progressBarContainer = document.querySelector('#progressBarContainer');
    const progressBarRect = progressBarContainer.getBoundingClientRect();
    const clickPosition = event.clientX - progressBarRect.left;
    const progressBarWidth = progressBarRect.width;
    const percentage = clickPosition / progressBarWidth;
    this.audioPlayer.currentTime = this.audioPlayer.duration * percentage;
    this.updateProgressBar();
  }

  formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${this.padZero(minutes)}:${this.padZero(seconds)}`;
  }

  padZero(num) {
    return num.toString().padStart(2, '0');
  }
}

function play(audioUrl, title) {
  if (!audioPlayer) {
    audioPlayer = new AudioPlayer();
  } else {
    audioPlayer.pause();
  }

  audioPlayer.createPlayer(audioUrl, title);
  audioPlayer.play();
}
