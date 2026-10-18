/**
 * QR Studio - Smart QR Code Generator & JPG Downloader
 * Handles QR generation, smooth stage transitions, high-res JPG export, and interactive micro-animations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const clearInputBtn = document.getElementById('clearInputBtn');
  const submitBtn = document.getElementById('submitBtn');
  
  const qrDisplaySection = document.getElementById('qrDisplaySection');
  const qrInteractiveCard = document.getElementById('qrInteractiveCard');
  const qrcodeContainer = document.getElementById('qrcodeCanvasContainer');
  const rippleCanvas = document.getElementById('clickRippleCanvas');
  
  const activeUrlText = document.getElementById('activeUrlText');
  const urlPreviewPill = document.getElementById('urlPreviewPill');
  const downloadJpgBtn = document.getElementById('downloadJpgBtn');
  const copyQrImageBtn = document.getElementById('copyQrImageBtn');
  const openWebBtn = document.getElementById('openWebBtn');
  
  const logoBtn = document.getElementById('logoBtn');
  const resetHeaderBtn = document.getElementById('resetHeaderBtn');
  const quickChips = document.querySelectorAll('.sample-chip');
  const toastContainer = document.getElementById('toastContainer');

  // Application State
  let currentQrCode = null;
  let currentUrl = '';
  let isGenerating = false;

  // Set initial focus
  setTimeout(() => {
    urlInput.focus();
  }, 300);

  // Initialize Canvas for Click Ripple Effect
  function setupRippleCanvas() {
    if (!rippleCanvas) return;
    const rect = qrInteractiveCard.getBoundingClientRect();
    rippleCanvas.width = rect.width;
    rippleCanvas.height = rect.height;
  }

  // ==========================================================================
  // URL Formatting & Validation Helper
  // ==========================================================================
  function normalizeUrl(input) {
    let trimmed = input.trim();
    if (!trimmed) return '';
    
    // Check if it already has a protocol
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed)) {
      // If it looks like a domain, prepend https://
      if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
        trimmed = 'https://' + trimmed;
      }
    }
    return trimmed;
  }

  function getCleanFileName(url) {
    try {
      const parsed = new URL(url);
      let host = parsed.hostname.replace('www.', '').replace(/[^a-zA-Z0-9]/g, '_');
      return `QR_${host || 'code'}_${Date.now()}.jpg`;
    } catch {
      return `QR_Code_${Date.now()}.jpg`;
    }
  }

  // ==========================================================================
  // QR Code Generation Logic
  // ==========================================================================
  function generateQRCode(text) {
    if (!text) return;
    
    isGenerating = true;
    currentUrl = text;
    
    // Clear existing QR element
    qrcodeContainer.innerHTML = '';
    
    try {
      // Create display QR code (240x240)
      currentQrCode = new QRCode(qrcodeContainer, {
        text: text,
        width: 240,
        height: 240,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });

      // Update URL Preview display
      activeUrlText.textContent = text;

      // Transition to Generated state (URL input docks to bottom)
      body.classList.remove('state-initial');
      body.classList.add('state-generated');

      // Update ripple canvas dimensions
      setTimeout(setupRippleCanvas, 350);

      showToast('고화질 QR코드가 생성되었습니다! 클릭 시 다운로드됩니다.', 'success');
    } catch (err) {
      console.error('QR Generation failed:', err);
      showToast('QR 코드 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      isGenerating = false;
    }
  }

  // ==========================================================================
  // High-Resolution JPG Downloader
  // ==========================================================================
  function createHighResJpgCanvas(text, targetSize = 1024, padding = 70) {
    return new Promise((resolve) => {
      // Create an offscreen temporary div
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.visibility = 'hidden';
      document.body.appendChild(tempDiv);

      const qrInnerSize = targetSize - (padding * 2);
      
      const offscreenQr = new QRCode(tempDiv, {
        text: text,
        width: qrInnerSize,
        height: qrInnerSize,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });

      // Wait briefly for QRCode library to complete canvas/image rendering
      setTimeout(() => {
        const sourceCanvas = tempDiv.querySelector('canvas');
        const sourceImg = tempDiv.querySelector('img');

        // Master export canvas with white background
        const masterCanvas = document.createElement('canvas');
        masterCanvas.width = targetSize;
        masterCanvas.height = targetSize;
        const ctx = masterCanvas.getContext('2d');

        // 1. Fill solid crisp white background (ensures pure JPG scanability)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetSize, targetSize);

        // 2. Draw the QR code with uniform padding
        if (sourceCanvas) {
          ctx.drawImage(sourceCanvas, padding, padding, qrInnerSize, qrInnerSize);
          document.body.removeChild(tempDiv);
          resolve(masterCanvas);
        } else if (sourceImg && sourceImg.src) {
          const imgObj = new Image();
          imgObj.onload = () => {
            ctx.drawImage(imgObj, padding, padding, qrInnerSize, qrInnerSize);
            document.body.removeChild(tempDiv);
            resolve(masterCanvas);
          };
          imgObj.src = sourceImg.src;
        } else {
          document.body.removeChild(tempDiv);
          resolve(masterCanvas);
        }
      }, 80);
    });
  }

  async function triggerJpgDownload() {
    if (!currentUrl) return;

    // Visual button feedback
    downloadJpgBtn.style.transform = 'scale(0.95)';
    setTimeout(() => { downloadJpgBtn.style.transform = ''; }, 150);

    try {
      const highResCanvas = await createHighResJpgCanvas(currentUrl, 1024, 70);
      const fileName = getCleanFileName(currentUrl);

      // Convert to JPG Data URL with maximum quality (0.95)
      const jpgDataUrl = highResCanvas.toDataURL('image/jpeg', 0.95);

      // Trigger automatic browser download
      const downloadLink = document.createElement('a');
      downloadLink.href = jpgDataUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast(`✨ ${fileName} 파일로 다운로드되었습니다!`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('다운로드 처리 중 문제가 발생했습니다.', 'error');
    }
  }

  // ==========================================================================
  // Click Ripple / Flash Effect on QR Card
  // ==========================================================================
  function playClickRipple(e) {
    if (!rippleCanvas) return;
    const ctx = rippleCanvas.getContext('2d');
    const rect = qrInteractiveCard.getBoundingClientRect();
    
    // Position relative to card
    const clickX = (e && e.clientX) ? (e.clientX - rect.left) : (rect.width / 2);
    const clickY = (e && e.clientY) ? (e.clientY - rect.top) : (rect.height / 2);

    let radius = 10;
    const maxRadius = Math.max(rect.width, rect.height) * 1.2;
    let opacity = 0.5;

    function animate() {
      ctx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height);
      
      if (radius < maxRadius && opacity > 0) {
        ctx.beginPath();
        ctx.arc(clickX, clickY, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${opacity})`;
        ctx.fill();

        radius += 18;
        opacity -= 0.025;
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height);
      }
    }

    animate();
  }

  // ==========================================================================
  // Clipboard Copy (Image & Text)
  // ==========================================================================
  async function copyQrImageToClipboard() {
    if (!currentUrl) return;

    try {
      const highResCanvas = await createHighResJpgCanvas(currentUrl, 600, 40);
      highResCanvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Blob conversion failed');
        
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showToast('📋 QR 이미지가 클립보드에 복사되었습니다!', 'success');
        } else {
          showToast('브라우저에서 클립보드 이미지 복사를 지원하지 않습니다.', 'info');
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Clipboard write error:', err);
      showToast('클립보드 복사에 실패했습니다. JPG 저장을 이용해주세요.', 'info');
    }
  }

  function copyUrlToClipboard() {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl).then(() => {
      showToast('🔗 URL 주소가 복사되었습니다!', 'success');
    }).catch(() => {
      showToast('URL 복사에 실패했습니다.', 'error');
    });
  }

  // ==========================================================================
  // Toast Notification System
  // ==========================================================================
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `
        <span class="toast-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
      `;
    } else {
      iconSvg = `
        <span class="toast-icon" style="color: #6366f1;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </span>
      `;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => {
        if (toast.parentNode) {
          toastContainer.removeChild(toast);
        }
      }, 300);
    }, 2800);
  }

  // ==========================================================================
  // State Reset (Back to Initial State)
  // ==========================================================================
  function resetToInitial() {
    body.classList.remove('state-generated');
    body.classList.add('state-initial');
    urlInput.value = '';
    clearInputBtn.style.display = 'none';
    currentUrl = '';
    urlInput.focus();
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  // Input Clear Button Toggle
  urlInput.addEventListener('input', () => {
    clearInputBtn.style.display = urlInput.value.length > 0 ? 'inline-flex' : 'none';
  });

  clearInputBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearInputBtn.style.display = 'none';
    urlInput.focus();
  });

  // Submit Handler
  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formattedUrl = normalizeUrl(urlInput.value);
    if (!formattedUrl) {
      showToast('유효한 URL 또는 텍스트를 입력해주세요.', 'error');
      urlInput.focus();
      return;
    }
    urlInput.value = formattedUrl;
    generateQRCode(formattedUrl);
  });

  // Main QR Code Card Click -> Trigger JPG Download
  qrInteractiveCard.addEventListener('click', (e) => {
    playClickRipple(e);
    triggerJpgDownload();
  });

  // Keyboard accessibility for card (Enter/Space)
  qrInteractiveCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playClickRipple();
      triggerJpgDownload();
    }
  });

  // Action Buttons
  downloadJpgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerJpgDownload();
  });

  copyQrImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    copyQrImageToClipboard();
  });

  openWebBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUrl) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    }
  });

  urlPreviewPill.addEventListener('click', (e) => {
    e.stopPropagation();
    copyUrlToClipboard();
  });

  // Header & Logo Reset
  logoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetToInitial();
  });

  resetHeaderBtn.addEventListener('click', () => {
    resetToInitial();
  });

  // Quick Sample Chips
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const sampleUrl = chip.getAttribute('data-url');
      if (sampleUrl) {
        urlInput.value = sampleUrl;
        clearInputBtn.style.display = 'inline-flex';
        generateQRCode(sampleUrl);
      }
    });
  });

  // Window Resize: re-adjust ripple canvas
  window.addEventListener('resize', setupRippleCanvas);
});
