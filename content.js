console.log("SpeedController content script injected!");

document.addEventListener('keydown', (e) => {
  // If user is typing in an input field, search box, or textarea, don't trigger
  if (
    e.target.tagName === 'INPUT' ||
    e.target.tagName === 'TEXTAREA' ||
    e.target.isContentEditable
  ) {
    return;
  }

  // ] increases speed
  if (e.key === ']' || e.code === 'BracketRight') {
    e.preventDefault();
    e.stopPropagation();
    changeVideoSpeed(0.25);
  }
  // [ decreases speed
  else if (e.key === '[' || e.code === 'BracketLeft') {
    e.preventDefault();
    e.stopPropagation();
    changeVideoSpeed(-0.25);
  }
  // = resets speed to 1.0
  else if (e.key === '=' || e.code === 'Equal') {
    e.preventDefault();
    e.stopPropagation();
    setExactVideoSpeed(1.0);
  }
}, true); // Use capture phase so website scripts (like YouTube player) can't block this event

function setExactVideoSpeed(speed) {
  const videos = document.querySelectorAll('video');
  if (videos.length === 0) {
    return;
  }

  videos.forEach(video => {
    video.playbackRate = speed;
  });

  showSpeedIndicator(speed);
}

function changeVideoSpeed(delta) {
  const videos = document.querySelectorAll('video');
  if (videos.length === 0) {
    // Look inside common shadow roots or iframes if necessary?
    // For now, simple querySelectorAll('video') catches most standard HTML5 players (YouTube, etc)
    return;
  }

  let finalSpeed = 1.0;
  videos.forEach(video => {
    let currentSpeed = video.playbackRate;
    let newSpeed = Math.max(0.25, currentSpeed + delta); // Prevent negative or zero speed
    video.playbackRate = newSpeed;
    finalSpeed = newSpeed;
  });

  showSpeedIndicator(finalSpeed);
}

function showSpeedIndicator(speed) {
  let indicator = document.getElementById('speedchanger-indicator');
  if (!indicator) {
    // Create indicator if it doesn't exist
    indicator = document.createElement('div');
    indicator.id = 'speedchanger-indicator';
    indicator.style.position = 'fixed';
    indicator.style.top = '20px';
    indicator.style.right = '20px';
    indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    indicator.style.color = '#fff';
    indicator.style.padding = '10px 15px';
    indicator.style.borderRadius = '5px';
    indicator.style.zIndex = '2147483647'; // Max z-index to appear above everything
    indicator.style.fontFamily = 'Arial, sans-serif';
    indicator.style.fontSize = '18px';
    indicator.style.fontWeight = 'bold';
    indicator.style.pointerEvents = 'none'; // Don't block clicks
    indicator.style.transition = 'opacity 0.2s';

    // Fallback if body doesn't exist yet
    if (document.body) {
      document.body.appendChild(indicator);
    } else {
      document.documentElement.appendChild(indicator);
    }
  }

  indicator.textContent = `Speed: ${speed.toFixed(2)}x`;
  indicator.style.opacity = '1';

  // Clear previous timeout if user presses keys quickly
  if (indicator.hideTimeout) {
    clearTimeout(indicator.hideTimeout);
  }

  // Fade out after 1.5s
  indicator.hideTimeout = setTimeout(() => {
    indicator.style.opacity = '0';
  }, 1500);
}
