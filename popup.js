document.addEventListener('DOMContentLoaded', async () => {
  const speedButtons = document.querySelectorAll('.speed-btn');
  const customInput = document.getElementById('customSpeed');
  const setCustomBtn = document.getElementById('setCustom');
  const statusMessage = document.getElementById('statusMessage');
  const currentSpeedDisplay = document.getElementById('currentSpeedDisplay');
  const preservePitchCheckbox = document.getElementById('preservePitch');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const rememberSiteCheckbox = document.getElementById('rememberSite');

  let currentSpeed = 1.0;
  let currentDomain = '';

  async function init() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      try {
        const url = new URL(tab.url);
        currentDomain = url.hostname;
      } catch (e) {}
    }

    const settings = await chrome.storage.sync.get(['preservePitch', 'theme']);
    const siteSettings = await chrome.storage.local.get(['siteSpeeds']);

    preservePitchCheckbox.checked = settings.preservePitch ?? true;
    if (settings.theme === 'dark') {
      document.body.classList.add('dark');
      themeIcon.textContent = '☀️';
    }

    if (siteSettings.siteSpeeds && siteSettings.siteSpeeds[currentDomain]) {
      rememberSiteCheckbox.checked = true;
    }

    await fetchCurrentSpeed();
    updateActiveButton();
  }

  async function fetchCurrentSpeed() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const videos = document.querySelectorAll('video');
          if (videos.length > 0) {
            let bestVideo = videos[0];
            for (const v of videos) {
              if (!v.paused && v.currentTime > 0) {
                bestVideo = v;
                break;
              }
              if (v.offsetWidth > bestVideo.offsetWidth) {
                bestVideo = v;
              }
            }
            return bestVideo.playbackRate;
          }
          return null;
        }
      });

      if (results && results[0] && results[0].result !== null) {
        currentSpeed = results[0].result;
        currentSpeedDisplay.textContent = currentSpeed.toFixed(2) + 'x';
      }
    } catch (e) {
      console.error('Failed to fetch speed:', e);
    }
  }

  function updateActiveButton() {
    speedButtons.forEach(btn => {
      const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
      btn.classList.toggle('active', Math.abs(btnSpeed - currentSpeed) < 0.01);
    });
  }

  function showStatus(text) {
    statusMessage.textContent = text;
    statusMessage.classList.add('visible');
    setTimeout(() => {
      statusMessage.classList.remove('visible');
    }, 2000);
  }

  async function setPlaybackSpeed(speed) {
    if (!speed || isNaN(speed)) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const preservePitch = preservePitchCheckbox.checked;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (speedValue, pp) => {
          function getAllVideos() {
            const videos = [];
            document.querySelectorAll('video').forEach(v => videos.push(v));
            document.querySelectorAll('iframe').forEach(iframe => {
              try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) iframeDoc.querySelectorAll('video').forEach(v => videos.push(v));
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

          const videos = getAllVideos();
          let primaryVideo = null;
          
          if (videos.length > 0) {
            primaryVideo = videos.find(v => !v.paused && v.currentTime > 0);
            if (!primaryVideo) {
              primaryVideo = videos.reduce((best, v) => 
                (v.offsetWidth * v.offsetHeight) > (best.offsetWidth * best.offsetHeight) ? v : best, videos[0]);
            }
          }

          videos.forEach(v => v.playbackRate = speedValue);
          if (primaryVideo) primaryVideo.preservesPitch = pp;
          
          return videos.length;
        },
        args: [parseFloat(speed), preservePitch]
      });

      currentSpeed = parseFloat(speed);
      currentSpeedDisplay.textContent = currentSpeed.toFixed(2) + 'x';
      updateActiveButton();
      showStatus(`Speed set to ${speed}x`);

      if (rememberSiteCheckbox.checked && currentDomain) {
        const siteSpeeds = await chrome.storage.local.get(['siteSpeeds']).then(r => r.siteSpeeds || {});
        siteSpeeds[currentDomain] = { speed: currentSpeed, timestamp: Date.now() };
        await chrome.storage.local.set({ siteSpeeds });
      }
    } catch (err) {
      console.error('Failed to set speed:', err);
      showStatus('Error setting speed');
    }
  }

  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = btn.getAttribute('data-speed');
      setPlaybackSpeed(speed);
    });
  });

  setCustomBtn.addEventListener('click', () => {
    const speed = customInput.value;
    if (speed) setPlaybackSpeed(speed);
  });

  customInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const speed = customInput.value;
      if (speed) setPlaybackSpeed(speed);
    }
  });

  preservePitchCheckbox.addEventListener('change', async () => {
    const preservePitch = preservePitchCheckbox.checked;
    await chrome.storage.sync.set({ preservePitch });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (pp) => {
          document.querySelectorAll('video').forEach(v => v.preservesPitch = pp);
          document.querySelectorAll('iframe').forEach(iframe => {
            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
              if (iframeDoc) iframeDoc.querySelectorAll('video').forEach(v => v.preservesPitch = pp);
            } catch (e) {}
          });
        },
        args: [preservePitch]
      });

      showStatus(preservePitch ? 'Pitch preservation ON' : 'Pitch preservation OFF');
    } catch (e) {
      console.error('Failed to update pitch:', e);
    }
  });

  themeToggle.addEventListener('click', async () => {
    const isDark = document.body.classList.toggle('dark');
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    await chrome.storage.sync.set({ theme: isDark ? 'dark' : 'light' });
  });

  init();
});
