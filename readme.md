# Video Speed Controller

A minimal, premium browser extension that allows you to change the playback speed of any video on any website.

## Features

- **Preset Speeds**: Quickly switch between common speeds (0.25x to 4.0x).
- **Custom Speed**: Set any playback speed up to 16x using the custom input field.
- **Persistent Logic**: Works on any website with video elements.
- **Modern UI**: A clean, "Inter" font-based design with smooth transitions.

## Installation

1. Clone or download this repository to your local machine.
2. Open your browser and navigate to the extensions page:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
3. Enable **Developer mode** (usually a toggle in the top-right corner).
4. Click on **Load unpacked**.
5. Select the `speedchanger` folder you downloaded/cloned.

## How to Use

1. Click the **Video Speed Controller** icon in your browser's extension toolbar.
2. Select a speed from the grid of buttons.
3. To set a specific speed, type the value in the "Custom" box and click **Set** or press **Enter**.
4. The speed of all videos on the current page will be updated immediately.

## Technical Details

- **Manifest Version**: 3
- **Permissions**:
  - `activeTab`: Used to access the current page's video elements.
  - `scripting`: Used to inject the playback speed change logic.

---

*Enjoy a more efficient viewing experience!*
