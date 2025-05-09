// Function to check if we're on a YouTube video page
function isVideoPage() {
    return window.location.pathname.includes('/watch');
}

// Function to find the transcript button
function findTranscriptButton() {
    // Look for the "..." menu button first
    const menuButton = document.querySelector('button[aria-label="More actions"]');
    if (!menuButton) return null;
    
    // Click the menu button to open the menu
    menuButton.click();
    
    // Wait for the menu to appear and find the "Show transcript" option
    return new Promise((resolve) => {
        setTimeout(() => {
            const transcriptButton = Array.from(document.querySelectorAll('tp-yt-paper-item'))
                .find(item => item.textContent.includes('Show transcript'));
            resolve(transcriptButton);
        }, 100);
    });
}

function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const interval = 100;
        let elapsed = 0;
        const check = () => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            elapsed += interval;
            if (elapsed >= timeout) return reject();
            setTimeout(check, interval);
        };
        check();
    });
}

// Function to create and add the copy button
function createCopyButton() {
    if (document.querySelector('.yt-transcript-copy-btn')) return;
    const button = document.createElement('button');
    button.className = 'yt-transcript-copy-btn';
    button.title = 'Copy Transcript';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.background = 'none';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.marginRight = '8px';
    button.style.position = 'relative';

    // Create the icon background div
    const iconBg = document.createElement('div');
    iconBg.className = 'yt-transcript-copy-icon-bg';
    iconBg.style.display = 'flex';
    iconBg.style.alignItems = 'center';
    iconBg.style.justifyContent = 'center';

    // Create the icon image
    const icon = document.createElement('img');
    try {
        icon.src = chrome.runtime.getURL('icon48.png');
    } catch {
        icon.src = 'icon48.png';
    }
    icon.alt = 'Copy Transcript';
    icon.style.display = 'block';
    iconBg.appendChild(icon);
    button.appendChild(iconBg);

    button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const transcriptButton = await findTranscriptButton();
        if (transcriptButton) {
            transcriptButton.click();
            setTimeout(() => {
                const transcriptText = Array.from(document.querySelectorAll('.segment-text'))
                    .map(segment => segment.textContent)
                    .join('\n');
                if (transcriptText) {
                    navigator.clipboard.writeText(transcriptText)
                        .then(() => {
                            icon.style.filter = 'grayscale(1)';
                            setTimeout(() => {
                                icon.style.filter = '';
                            }, 1200);
                        })
                        .catch(err => {
                            console.error('Failed to copy transcript:', err);
                            alert('Failed to copy transcript');
                        });
                } else {
                    alert('No transcript available for this video');
                }
            }, 1000);
        } else {
            // Fallback: copy visible captions
            const captionSegments = Array.from(document.querySelectorAll('.ytp-caption-segment'));
            const captionsText = captionSegments.map(el => el.textContent.trim()).join('\n');
            if (captionsText) {
                navigator.clipboard.writeText(captionsText)
                    .then(() => {
                        iconBg.classList.add('yt-transcript-copy-flash');
                        setTimeout(() => {
                            iconBg.classList.remove('yt-transcript-copy-flash');
                        }, 600);
                        icon.style.filter = 'grayscale(1)';
                        setTimeout(() => {
                            icon.style.filter = '';
                        }, 1200);
                    })
                    .catch(err => {
                        console.error('Failed to copy captions:', err);
                        alert('Failed to copy captions');
                    });
            } else {
                alert('No transcript or captions available for this video');
            }
        }
    });

    waitForElement('#top-level-buttons-computed').then(topLevelButtons => {
        topLevelButtons.insertBefore(button, topLevelButtons.firstChild);
    });
}

// Main function to initialize the extension
function init() {
    if (isVideoPage()) {
        createCopyButton();
    }
}

// Run the initialization when the page loads
init();

// Listen for URL changes (for YouTube's SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        init();
    }
}).observe(document, { subtree: true, childList: true }); 