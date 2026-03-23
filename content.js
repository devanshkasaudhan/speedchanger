console.log("SpeedController content script injected!");

let preservePitch = true;
let currentDomain = window.location.hostname;

chrome.storage.sync.get(['preservePitch']).then(result => {
  preservePitch = result.preservePitch ?? true;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.preservePitch) {
    preservePitch = changes.preservePitch.newValue;
    applyPitchToAllVideos();
  }
});

function applyPitchToAllVideos() {
  document.querySelectorAll('video').forEach(video => {
    video.preservesPitch = preservePitch;
  });
}

function getAllVideos() {
  const videos = [];
  
  document.querySelectorAll('video').forEach(v => videos.push(v));
  
  document.querySelectorAll('iframe').forEach(iframe => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.querySelectorAll('video').forEach(v => videos.push(v));
      }
    } catch (e) {}
  });
  
  function findInShadowRoots(root) {
    root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) {
        el.shadowRoot.querySelectorAll('video').forEach(v => videos.push(v));
        findInShadowRoots(el.shadowRoot);
      }
    });
  }
  findInShadowRoots(document);
  
  return videos;
}

function getPrimaryVideo() {
  const allVideos = getAllVideos();
  if (allVideos.length === 0) return null;
  
  const playing = allVideos.find(v => !v.paused && v.currentTime > 0);
  if (playing) return playing;
  
  const visible = allVideos
    .filter(v => v.offsetWidth > 0 && v.offsetHeight > 0)
    .sort((a, b) => (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight));
  
  if (visible.length > 0) return visible[0];
  
  return allVideos[0];
}

document.addEventListener('keydown', (e) => {
  if (
    e.target.tagName === 'INPUT' ||
    e.target.tagName === 'TEXTAREA' ||
    e.target.isContentEditable
  ) {
    return;
  }

  if (e.key === ']' || e.code === 'BracketRight') {
    e.preventDefault();
    e.stopPropagation();
    changeVideoSpeed(0.25);
  } else if (e.key === '[' || e.code === 'BracketLeft') {
    e.preventDefault();
    e.stopPropagation();
    changeVideoSpeed(-0.25);
  } else if (e.key === '=' || e.code === 'Equal') {
    e.preventDefault();
    e.stopPropagation();
    setExactVideoSpeed(1.0);
  } else if (e.key === ',') {
    e.preventDefault();
    skipVideo(-5);
  } else if (e.key === '.') {
    e.preventDefault();
    skipVideo(5);
  }
}, true);

function setExactVideoSpeed(speed) {
  const video = getPrimaryVideo();
  if (!video) return;

  video.playbackRate = speed;
  video.preservesPitch = preservePitch;
  saveSpeedForDomain(speed);
  showSpeedIndicator(speed);
}

function changeVideoSpeed(delta) {
  const video = getPrimaryVideo();
  if (!video) return;

  let currentSpeed = video.playbackRate;
  let newSpeed = Math.max(0.25, currentSpeed + delta);
  video.playbackRate = newSpeed;
  video.preservesPitch = preservePitch;
  saveSpeedForDomain(newSpeed);
  showSpeedIndicator(newSpeed);
}

function skipVideo(seconds) {
  const video = getPrimaryVideo();
  if (!video) return;
  video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
}

function saveSpeedForDomain(speed) {
  chrome.storage.local.get(['siteSpeeds']).then(result => {
    const siteSpeeds = result.siteSpeeds || {};
    siteSpeeds[currentDomain] = { speed, timestamp: Date.now() };
    chrome.storage.local.set({ siteSpeeds });
  });
}

function loadSpeedForDomain() {
  return chrome.storage.local.get(['siteSpeeds']).then(result => {
    const siteSpeeds = result.siteSpeeds || {};
    return siteSpeeds[currentDomain]?.speed || 1.0;
  });
}

loadSpeedForDomain().then(speed => {
  const video = getPrimaryVideo();
  if (video && video.playbackRate === 1.0) {
    video.playbackRate = speed;
  }
});

let indicator = null;
function showSpeedIndicator(speed) {
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'speedchanger-indicator';
    indicator.style.position = 'fixed';
    indicator.style.top = '20px';
    indicator.style.right = '20px';
    indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    indicator.style.color = '#fff';
    indicator.style.padding = '10px 15px';
    indicator.style.borderRadius = '5px';
    indicator.style.zIndex = '2147483647';
    indicator.style.fontFamily = 'Arial, sans-serif';
    indicator.style.fontSize = '18px';
    indicator.style.fontWeight = 'bold';
    indicator.style.pointerEvents = 'none';
    indicator.style.transition = 'opacity 0.2s';

    if (document.body) {
      document.body.appendChild(indicator);
    } else {
      document.documentElement.appendChild(indicator);
    }
  }

  indicator.textContent = `Speed: ${speed.toFixed(2)}x`;
  indicator.style.opacity = '1';

  if (indicator.hideTimeout) {
    clearTimeout(indicator.hideTimeout);
  }

  indicator.hideTimeout = setTimeout(() => {
    indicator.style.opacity = '0';
  }, 1500);
}
