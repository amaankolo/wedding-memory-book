class WeddingMemoryBookUploader {
  constructor() {
    this.selectedFiles = [];
    this.uploadedPhotos = [];
    this.currentFilter = 'all';
    this.isAdminMode = false;
    this.initializeElements();
    this.bindEvents();
    this.loadExistingPhotos();
    this.initializeAnimations();
    this.checkAdminAccess();
  }

  initializeElements() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadArea = document.getElementById('uploadArea');
    this.uploadBtn = document.getElementById('uploadBtn');
    this.status = document.getElementById('status');
    this.progressBar = document.getElementById('progressBar');
    this.progressFill = this.progressBar?.querySelector('.progress-fill');
    this.previewSection = document.getElementById('previewSection');
    this.previewGrid = document.getElementById('previewGrid');
    this.clearBtn = document.getElementById('clearBtn');
    this.galleryGrid = document.getElementById('galleryGrid');
    
    // Guest form elements
    this.guestNameInput = document.getElementById('guestName');
    this.photoCaptionInput = document.getElementById('photoCaption');
    this.eventMomentSelect = document.getElementById('eventMoment');
    
    // Gallery filter elements
    this.filterBtns = document.querySelectorAll('.filter-btn');
    
    // Admin elements
    this.adminPanel = document.getElementById('adminPanel');
    this.downloadAllBtn = document.getElementById('downloadAllBtn');
    this.togglePublicBtn = document.getElementById('togglePublicBtn');
    this.exportDataBtn = document.getElementById('exportDataBtn');
  }

  bindEvents() {
    // File input change
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    // Upload area click
    this.uploadArea.addEventListener('click', () => this.fileInput.click());
    
    // Drag and drop events
    this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
    
    // Upload button
    this.uploadBtn.addEventListener('click', () => this.uploadPhotos());
    
    // Clear button
    this.clearBtn?.addEventListener('click', () => this.clearSelectedFiles());

    // Gallery filter buttons
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => this.filterGallery(btn.dataset.filter));
    });

    // Admin buttons
    this.downloadAllBtn?.addEventListener('click', () => this.downloadAllPhotos());
    this.togglePublicBtn?.addEventListener('click', () => this.togglePublicGallery());
    this.exportDataBtn?.addEventListener('click', () => this.exportData());

    // Prevent default drag behaviors on document
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());

    // Admin access (Ctrl+Shift+A)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        this.toggleAdminMode();
      }
    });
  }

  handleFileSelect(event) {
    const files = Array.from(event.target.files);
    this.addFiles(files);
  }

  handleDragOver(event) {
    event.preventDefault();
    this.uploadArea.classList.add('dragover');
  }

  handleDragLeave(event) {
    event.preventDefault();
    if (!this.uploadArea.contains(event.relatedTarget)) {
      this.uploadArea.classList.remove('dragover');
    }
  }

  handleDrop(event) {
    event.preventDefault();
    this.uploadArea.classList.remove('dragover');
    
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      this.showStatus('Please select image files only! 📸', 'error');
      return;
    }
    
    if (imageFiles.length !== files.length) {
      this.showStatus(`Selected ${imageFiles.length} image files (${files.length - imageFiles.length} non-image files ignored)`, 'success');
    }
    
    this.addFiles(imageFiles);
  }

  addFiles(files) {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for better performance with local storage
        this.showStatus(`File ${file.name} is too large (max 5MB for local storage)`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add to selected files (avoid duplicates)
    validFiles.forEach(file => {
      if (!this.selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        this.selectedFiles.push(file);
      }
    });

    this.updatePreview();
    this.updateUploadButton();
    this.showStatus(`${validFiles.length} photo(s) selected! 💕`, 'success');
    this.createElegantSparkles();
  }

  updatePreview() {
    if (this.selectedFiles.length === 0) {
      this.previewSection.classList.add('hidden');
      return;
    }

    this.previewSection.classList.remove('hidden');
    this.previewGrid.innerHTML = '';

    this.selectedFiles.forEach((file, index) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      
      const img = document.createElement('img');
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'preview-remove';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.onclick = () => this.removeFile(index);
      
      previewItem.appendChild(img);
      previewItem.appendChild(removeBtn);
      this.previewGrid.appendChild(previewItem);
    });
  }

  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    this.updatePreview();
    this.updateUploadButton();
    
    if (this.selectedFiles.length === 0) {
      this.showStatus('All photos removed.', '');
    } else {
      this.showStatus(`${this.selectedFiles.length} photo(s) selected.`, 'success');
    }
  }

  clearSelectedFiles() {
    this.selectedFiles = [];
    this.fileInput.value = '';
    this.updatePreview();
    this.updateUploadButton();
    this.showStatus('All photos cleared.', '');
    
    // Clear form inputs
    this.guestNameInput.value = '';
    this.photoCaptionInput.value = '';
    this.eventMomentSelect.value = '';
  }

  updateUploadButton() {
    this.uploadBtn.disabled = this.selectedFiles.length === 0;
    this.uploadBtn.innerHTML = this.selectedFiles.length === 0 
      ? '<i class="fas fa-heart"></i> Upload Photos'
      : `<i class="fas fa-heart"></i> Upload ${this.selectedFiles.length} Photo(s)`;
  }

  async uploadPhotos() {
    if (this.selectedFiles.length === 0) {
      this.showStatus('Please select photos first! 📸', 'error');
      return;
    }

    // Get guest information
    const guestName = this.guestNameInput.value.trim();
    const photoCaption = this.photoCaptionInput.value.trim();
    const eventMoment = this.eventMomentSelect.value;

    this.uploadBtn.disabled = true;
    this.showProgressBar();
    
    const totalFiles = this.selectedFiles.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < this.selectedFiles.length; i++) {
      const file = this.selectedFiles[i];
      
      this.showStatus(`Uploading photo ${i + 1} of ${totalFiles}... 💕`, 'uploading');
      this.updateProgress((i / totalFiles) * 100);

      try {
        const result = await this.uploadSingleFile(file);
        if (result.success) {
          successCount++;
          const photoData = {
            url: result.link,
            name: file.name,
            photoId: result.photoId,
            guestName: guestName,
            caption: photoCaption,
            eventMoment: eventMoment,
            timestamp: new Date().toISOString(),
            uploadTime: new Date().toLocaleString(),
            fileSize: result.fileSize,
            githubPath: result.githubPath
          };
          this.addToGallery(photoData);
        } else {
          failCount++;
          console.error(`Failed to upload ${file.name}:`, result);
        }
      } catch (error) {
        failCount++;
        console.error(`Error uploading ${file.name}:`, error);
      }
    }

    this.updateProgress(100);
    
    // Final status
    if (successCount === totalFiles) {
      this.showStatus(`🎉 All ${successCount} photos uploaded successfully!`, 'success');
      this.celebrateSuccess();
    } else if (successCount > 0) {
      this.showStatus(`✅ ${successCount} photos uploaded, ${failCount} failed.`, 'success');
      this.celebrateSuccess();
    } else {
      this.showStatus(`❌ Failed to upload photos. Please try again.`, 'error');
    }

    // Reset after successful upload
    setTimeout(() => {
      if (successCount > 0) {
        this.clearSelectedFiles();
        this.hideProgressBar();
      }
      this.uploadBtn.disabled = false;
    }, 3000);
  }

  async uploadSingleFile(file) {
    try {
      console.log('Starting GitHub upload for:', file.name);
      
      // Convert file to base64
      const base64Content = await this.fileToBase64(file);
      
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomId}.${fileExtension}`;
      
      console.log('Uploading to GitHub...');
      
      // GitHub API configuration
      const githubUsername = 'amaankolo';
      const repoName = 'wedding-memory-book';
      const token = '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';
      
      const response = await fetch(`https://api.github.com/repos/${githubUsername}/${repoName}/contents/uploaded-photos/${fileName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add wedding photo: ${fileName}`,
          content: base64Content,
          branch: 'main'
        })
      });
      
      console.log('GitHub response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub error response:', errorText);
        throw new Error(`GitHub upload failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('GitHub upload successful:', result);
      
      // Create the public URL for GitHub Pages
      const publicUrl = `https://${githubUsername}.github.io/${repoName}/uploaded-photos/${fileName}`;
      
      return {
        success: true,
        link: publicUrl,
        photoId: `${timestamp}_${randomId}`,
        fileName: file.name,
        fileSize: file.size,
        githubPath: `uploaded-photos/${fileName}`
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper function to convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data:image/jpeg;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  showStatus(message, type = '') {
    this.status.textContent = message;
    this.status.className = `status ${type}`;
  }

  showProgressBar() {
    this.progressBar.classList.remove('hidden');
  }

  hideProgressBar() {
    this.progressBar.classList.add('hidden');
    this.updateProgress(0);
  }

  updateProgress(percentage) {
    if (this.progressFill) {
      this.progressFill.style.width = `${percentage}%`;
    }
  }

  addToGallery(photoData) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.dataset.eventMoment = photoData.eventMoment || 'other';
    
    const guestInfo = photoData.guestName ? `<p class="guest-name">📸 ${photoData.guestName}</p>` : '';
    const captionInfo = photoData.caption ? `<p class="photo-caption">"${photoData.caption}"</p>` : '';
    const eventTag = photoData.eventMoment ? `<span class="event-tag">${this.getEventDisplayName(photoData.eventMoment)}</span>` : '';
    
    galleryItem.innerHTML = `
      <img src="${photoData.url}" alt="${photoData.name}" loading="lazy">
      <div class="gallery-item-info">
        ${guestInfo}
        ${captionInfo}
        ${eventTag}
        <small>Uploaded: ${photoData.uploadTime}</small>
      </div>
    `;
    
    // Add click to view full size
    galleryItem.addEventListener('click', () => {
      this.openPhotoModal(photoData);
    });
    
    this.galleryGrid.prepend(galleryItem);
    
    // Save to uploaded photos array
    this.uploadedPhotos.unshift(photoData);
    this.savePhotosToStorage();
    
    // Update gallery display if filter is active
    this.applyCurrentFilter();
  }

  openPhotoModal(photoData) {
    // Create a simple modal to view the photo
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = photoData.url;
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border: 3px solid #d4af37;
      box-shadow: 0 0 50px rgba(212, 175, 55, 0.5);
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close with Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  getEventDisplayName(eventMoment) {
    const eventNames = {
      'lunch': 'Lunch',
      'reception': 'Reception',
      'mehendi': 'Henna Party',
      'family': 'Family Time',
      'dancing': 'Dancing & Celebration',
      'other': 'Special Moment'
    };
    return eventNames[eventMoment] || 'Special Moment';
  }

  filterGallery(filter) {
    this.currentFilter = filter;
    
    // Update active button
    this.filterBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.filter === filter) {
        btn.classList.add('active');
      }
    });
    
    this.applyCurrentFilter();
    
    // Show status
    const visibleCount = this.getVisibleItemsCount();
    this.showStatus(filter === 'all' 
      ? `Showing all ${visibleCount} photos 💕` 
      : `Filtered to ${visibleCount} ${this.getEventDisplayName(filter)} photos 📸`, 'success');
  }

  applyCurrentFilter() {
    const items = this.galleryGrid.querySelectorAll('.gallery-item');
    
    items.forEach(item => {
      const eventMoment = item.dataset.eventMoment;
      const shouldShow = this.currentFilter === 'all' || eventMoment === this.currentFilter;
      
      if (shouldShow) {
        item.style.display = 'block';
        item.style.animation = 'fadeIn 0.5s ease';
      } else {
        item.style.display = 'none';
      }
    });
  }

  getVisibleItemsCount() {
    const items = this.galleryGrid.querySelectorAll('.gallery-item');
    return Array.from(items).filter(item => item.style.display !== 'none').length;
  }

  loadExistingPhotos() {
    const savedPhotos = localStorage.getItem('weddingMemoryBookPhotos');
    if (savedPhotos) {
      try {
        this.uploadedPhotos = JSON.parse(savedPhotos);
        this.uploadedPhotos.forEach(photo => {
          this.addPhotoToGallery(photo);
        });
        console.log(`Loaded ${this.uploadedPhotos.length} existing photos from storage`);
      } catch (error) {
        console.error('Error loading existing photos:', error);
        // Clear corrupted data
        localStorage.removeItem('weddingMemoryBookPhotos');
        this.uploadedPhotos = [];
      }
    }
  }

  addPhotoToGallery(photo) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.dataset.eventMoment = photo.eventMoment || 'other';
    
    const guestInfo = photo.guestName ? `<p class="guest-name">📸 ${photo.guestName}</p>` : '';
    const captionInfo = photo.caption ? `<p class="photo-caption">"${photo.caption}"</p>` : '';
    const eventTag = photo.eventMoment ? `<span class="event-tag">${this.getEventDisplayName(photo.eventMoment)}</span>` : '';
    
    galleryItem.innerHTML = `
      <img src="${photo.url}" alt="${photo.name}" loading="lazy">
      <div class="gallery-item-info">
        ${guestInfo}
        ${captionInfo}
        ${eventTag}
        <small>Uploaded: ${photo.uploadTime || photo.timestamp}</small>
      </div>
    `;
    
    galleryItem.addEventListener('click', () => {
      this.openPhotoModal(photo);
    });
    
    this.galleryGrid.appendChild(galleryItem);
  }

  savePhotosToStorage() {
    localStorage.setItem('weddingMemoryBookPhotos', JSON.stringify(this.uploadedPhotos));
  }

  // Admin Functions
  checkAdminAccess() {
    const adminKey = localStorage.getItem('weddingAdminAccess');
    if (adminKey === 'zahraddeen-laura-admin-2024') {
      this.isAdminMode = true;
      this.adminPanel.classList.remove('hidden');
    }
  }

  toggleAdminMode() {
    const password = prompt('Enter admin password:');
    if (password === 'zahraddeen-laura-admin-2024') {
      this.isAdminMode = true;
      localStorage.setItem('weddingAdminAccess', password);
      this.adminPanel.classList.remove('hidden');
      this.showStatus('✨ Admin mode activated! Welcome to the control panel.', 'success');
      this.createElegantSparkles();
    } else if (password !== null) {
      this.showStatus('❌ Incorrect admin password.', 'error');
    }
  }

  async downloadAllPhotos() {
    if (this.uploadedPhotos.length === 0) {
      this.showStatus('No photos to download.', 'error');
      return;
    }

    this.showStatus('📥 Preparing download package...', 'uploading');
    
    try {
      // Create download data
      const downloadData = {
        photos: this.uploadedPhotos,
        metadata: {
          totalPhotos: this.uploadedPhotos.length,
          exportDate: new Date().toISOString(),
          coupleNames: 'Zaharaddeen & Laurah',
          event: 'Wedding Memory Book'
        }
      };

      const dataStr = JSON.stringify(downloadData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = 'wedding-memory-book-photos-data.json';
      downloadLink.click();
      
      URL.revokeObjectURL(url);
      
      this.showStatus(`✅ Downloaded data for ${this.uploadedPhotos.length} photos!`, 'success');
    } catch (error) {
      this.showStatus('❌ Error creating download package.', 'error');
      console.error('Download error:', error);
    }
  }

  togglePublicGallery() {
    const isPublic = localStorage.getItem('weddingGalleryPublic') === 'true';
    const newState = !isPublic;
    
    localStorage.setItem('weddingGalleryPublic', newState.toString());
    
    this.showStatus(newState 
      ? '🌍 Gallery is now public - guests can view all photos!' 
      : '🔒 Gallery is now private - only admin can view.', 'success');
      
    this.togglePublicBtn.innerHTML = newState 
      ? '<i class="fas fa-eye-slash"></i> Make Private'
      : '<i class="fas fa-eye"></i> Make Public';
  }

  exportData() {
    if (this.uploadedPhotos.length === 0) {
      this.showStatus('No data to export.', 'error');
      return;
    }

    // Create CSV data
    const csvHeaders = ['Guest Name', 'Photo Caption', 'Event Moment', 'Upload Time', 'Photo URL'];
    const csvRows = this.uploadedPhotos.map(photo => [
      photo.guestName || 'Anonymous',
      photo.caption || '',
      this.getEventDisplayName(photo.eventMoment || 'other'),
      photo.uploadTime || photo.timestamp,
      photo.url
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(csvBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'wedding-memory-book-data.csv';
    downloadLink.click();
    
    URL.revokeObjectURL(url);
    
    this.showStatus(`📊 Exported data for ${this.uploadedPhotos.length} photos to CSV!`, 'success');
  }

  // Animation Functions
  celebrateSuccess() {
    // Create a burst of golden and green sparkles
    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.6; // Upper 60% of screen
        this.createCelebrationSparkle(x, y);
      }, i * 80);
    }
  }

  createCelebrationSparkle(x, y) {
    const sparkle = document.createElement('div');
    const sparkleTypes = ['✨', '🌟', '💫', '⭐', '💕', '💚', '💛'];
    sparkle.innerHTML = sparkleTypes[Math.floor(Math.random() * sparkleTypes.length)];
    sparkle.style.position = 'fixed';
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.fontSize = Math.random() * 35 + 20 + 'px';
    sparkle.style.color = Math.random() > 0.5 ? '#d4af37' : '#005f3c';
    sparkle.style.zIndex = '1000';
    sparkle.style.opacity = '0';
    sparkle.style.transform = 'scale(0) rotate(0deg)';
    sparkle.style.transition = 'all 4s ease-out';

    document.body.appendChild(sparkle);

    // Animate sparkle
    requestAnimationFrame(() => {
      sparkle.style.opacity = '1';
      sparkle.style.transform = 'scale(1) rotate(720deg) translateY(-150px)';
    });

    // Remove sparkle
    setTimeout(() => {
      sparkle.style.opacity = '0';
      setTimeout(() => {
        if (sparkle.parentNode) {
          sparkle.parentNode.removeChild(sparkle);
        }
      }, 500);
    }, 3500);
  }

  createElegantSparkles() {
    // Create subtle sparkles for interactions
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.4;
        this.createSparkle(x, y, true);
      }, i * 200);
    }
  }

  initializeAnimations() {
    // Add entrance animations to elements
    this.animateOnScroll();
    this.addFloatingSparkles();
    this.addHoverMagnification();
    this.addIslamicPatternAnimations();
  }

  animateOnScroll() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe all major sections
    document.querySelectorAll('.header, .upload-section, .preview-section, .gallery-section, .footer').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      observer.observe(el);
    });
  }

  addFloatingSparkles() {
    // Add floating Islamic-inspired sparkles
    this.createFloatingSparkles();
    
    // Add sparkle trails on mouse move (reduced frequency for performance)
    let lastSparkleTime = 0;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastSparkleTime > 300 && Math.random() < 0.05) { // 5% chance every 300ms
        this.createSparkle(e.clientX, e.clientY);
        lastSparkleTime = now;
      }
    });
  }

  createFloatingSparkles() {
    const sparkleCount = 6;
    for (let i = 0; i < sparkleCount; i++) {
      setTimeout(() => {
        this.createRandomSparkle();
      }, i * 3000);
    }
    
    // Continue creating sparkles
    setInterval(() => {
      this.createRandomSparkle();
    }, 8000);
  }

  createRandomSparkle() {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    this.createSparkle(x, y, true);
  }

  createSparkle(x, y, isFloating = false) {
    const sparkle = document.createElement('div');
    const sparkleTypes = ['✧', '❋', '✦', '❇'];
    sparkle.innerHTML = sparkleTypes[Math.floor(Math.random() * sparkleTypes.length)];
    sparkle.style.position = 'fixed';
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.fontSize = Math.random() * 25 + 15 + 'px';
    sparkle.style.color = Math.random() > 0.5 ? '#d4af37' : '#005f3c';
    sparkle.style.zIndex = '1000';
    sparkle.style.opacity = '0';
    sparkle.style.transform = 'scale(0)';
    sparkle.style.transition = 'all 3s ease-out';

    document.body.appendChild(sparkle);

    // Animate sparkle
    requestAnimationFrame(() => {
      sparkle.style.opacity = '0.7';
      sparkle.style.transform = 'scale(1) rotate(360deg)';
      
      if (isFloating) {
        sparkle.style.transform += ` translateY(-${Math.random() * 120 + 80}px)`;
      }
    });

    // Remove sparkle
    setTimeout(() => {
      sparkle.style.opacity = '0';
      sparkle.style.transform += ' scale(0)';
      setTimeout(() => {
        if (sparkle.parentNode) {
          sparkle.parentNode.removeChild(sparkle);
        }
      }, 500);
    }, 2500);
  }

  addHoverMagnification() {
    // Add subtle hover effects to images
    document.addEventListener('mouseover', (e) => {
      if (e.target.tagName === 'IMG') {
        e.target.style.filter = 'brightness(1.1) contrast(1.05)';
        e.target.style.transition = 'all 0.3s ease';
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.tagName === 'IMG') {
        e.target.style.filter = 'brightness(1) contrast(1)';
      }
    });
  }

  addIslamicPatternAnimations() {
    // Animate the floating pattern elements
    const patterns = document.querySelectorAll('.pattern-shape');
    patterns.forEach((pattern, index) => {
      pattern.style.animation = `floatPattern ${15 + index * 2}s ease-in-out infinite`;
      pattern.style.animationDelay = `${index * 3}s`;
    });
  }
}

// Initialize the Wedding Memory Book uploader when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Show elegant loading screen
  setTimeout(() => {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 1000);
    }
  }, 3000); // Show loading for 3 seconds

  new WeddingMemoryBookUploader();
});

// Legacy function for backward compatibility
async function uploadPhoto() {
  // This function is kept for compatibility but the new class handles everything
  console.log('Legacy uploadPhoto function called - Wedding Memory Book uploader is handling everything!');
}

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}



