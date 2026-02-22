document.addEventListener('DOMContentLoaded', () => {
  const speedButtons = document.querySelectorAll('.speed-btn');
  const customInput = document.getElementById('customSpeed');
  const setCustomBtn = document.getElementById('setCustom');
  const statusMessage = document.getElementById('statusMessage');

  // Helper to show status
  function showStatus(text) {
    statusMessage.textContent = text;
    statusMessage.classList.add('visible');
    setTimeout(() => {
      statusMessage.classList.remove('visible');
    }, 2000);
  }

  // Function to inject script
  async function setPlaybackSpeed(speed) {
    if (!speed || isNaN(speed)) return;
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (speedValue) => {
          const videos = document.querySelectorAll('video');
          videos.forEach(v => v.playbackRate = speedValue);
          return videos.length;
        },
        args: [parseFloat(speed)]
      });

      showStatus(`Speed set to ${speed}x`);
    } catch (err) {
      console.error('Failed to set speed:', err);
      showStatus('Error setting speed');
    }
  }

  // Event listeners for preset buttons
  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = btn.getAttribute('data-speed');
      setPlaybackSpeed(speed);
    });
  });

  // Event listener for custom set button
  setCustomBtn.addEventListener('click', () => {
    const speed = customInput.value;
    if (speed) {
      setPlaybackSpeed(speed);
    }
  });

  // Allow Enter key in custom input
  customInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const speed = customInput.value;
      if (speed) {
        setPlaybackSpeed(speed);
      }
    }
  });
});
