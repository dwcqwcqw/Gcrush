// Candy.ai Combined JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Components
    initSidebar();
    initScrollAnimations();
    initAccordion();
    initCountdownTimer();
    initCharacterVideoHover();
    initLogoLoading();
    // initImageLoading(); // Disabled - character-data-loader.js handles this
    initBannerCarousel();
    initBannerImageLoading();
    
    // Sidebar toggle functionality
    function initSidebar() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            // Toggle sidebar collapsed state
            menuToggle.addEventListener('click', () => {
                // On mobile, don't use collapsed state but show/hide sidebar
                if (window.innerWidth <= 1200) {
                    sidebar.classList.toggle('mobile-hidden');
                } else {
                    sidebar.classList.toggle('collapsed');
                    
                    // Store sidebar state in local storage
                    const isCollapsed = sidebar.classList.contains('collapsed');
                    localStorage.setItem('sidebarCollapsed', isCollapsed);
                    
                    // If in chat interface, adjust chat sidebar position
                    const chatInterface = document.getElementById('chatInterface');
                    const chatSidebar = document.querySelector('.chat-sidebar');
                    if (chatInterface && chatInterface.style.display === 'flex' && chatSidebar) {
                        chatSidebar.style.marginLeft = isCollapsed ? '60px' : '240px';
                    }
                }
            });
            
            // Check local storage for saved state (desktop only)
            if (window.innerWidth > 1200) {
                const savedState = localStorage.getItem('sidebarCollapsed');
                if (savedState === 'true') {
                    sidebar.classList.add('collapsed');
                }
            }
            
            // Handle responsive behavior
            const handleResize = () => {
                if (window.innerWidth <= 1200) {
                    // Mobile/tablet: remove collapsed class and hide sidebar by default on small screens
                    sidebar.classList.remove('collapsed');
                    // Auto-hide sidebar on screens smaller than 768px
                    if (window.innerWidth <= 768) {
                        sidebar.classList.add('mobile-hidden');
                    } else {
                        sidebar.classList.remove('mobile-hidden');
                    }
                } else {
                    // Desktop: restore collapsed state if it was saved
                    const savedState = localStorage.getItem('sidebarCollapsed');
                    if (savedState === 'true') {
                        sidebar.classList.add('collapsed');
                    }
                    sidebar.classList.remove('mobile-hidden');
                }
            };
            
            // Call once on load
            handleResize();
            
            // Add event listener for window resize
            window.addEventListener('resize', handleResize);
            
            // Close mobile sidebar when clicking outside (only on small screens)
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && 
                    !sidebar.contains(e.target) && 
                    !menuToggle.contains(e.target) && 
                    !sidebar.classList.contains('mobile-hidden')) {
                    sidebar.classList.add('mobile-hidden');
                }
            });
        }
    }
    
    // Character video hover functionality
    function initCharacterVideoHover() {
        const characterCards = document.querySelectorAll('.character-card:not(.premium-card)');
        
        characterCards.forEach(card => {
            const video = card.querySelector('.character-video');
            const img = card.querySelector('.character-image img');
            
            if (video && img) {
                // Ensure image is visible by default with !important
                img.style.setProperty('opacity', '1', 'important');
                img.style.setProperty('visibility', 'visible', 'important');
                img.style.setProperty('display', 'block', 'important');
                let isHovered = false;
                let videoReady = false;
                let isLoading = false;
                
                // Set video to not preload initially
                video.preload = 'none';
                video.removeAttribute('autoplay');
                
                // Load video on first hover
                const loadVideo = () => {
                    if (!videoReady && !isLoading) {
                        isLoading = true;
                        const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                        console.log(`Loading video for ${characterName} on hover`);
                        
                        // Set preload to auto and load
                        video.preload = 'auto';
                        video.load();
                    }
                };
                
                // Simplified video loading events
                video.addEventListener('loadeddata', () => {
                    videoReady = true;
                    isLoading = false;
                    video.classList.add('loaded');
                    console.log(`Video ready for ${card.querySelector('.character-name')?.textContent}`);
                    
                    // If hovering, start playing immediately
                    if (isHovered) {
                        video.classList.add('playing');
                        video.currentTime = 0;
                        video.play().then(() => {
                            // Only hide image AFTER video successfully starts playing
                            img.style.setProperty('opacity', '0', 'important');
                        }).catch(error => {
                            console.log('Video playback failed:', error);
                            img.style.setProperty('opacity', '1', 'important');
                            video.classList.remove('playing');
                        });
                    }
                });
                
                // Handle video errors
                video.addEventListener('error', (e) => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    console.error(`Video failed to load for ${characterName}`);
                    videoReady = false;
                    isLoading = false;
                });
                
                // Mouse enter - load and play video
                card.addEventListener('mouseenter', () => {
                    isHovered = true;
                    
                    if (videoReady) {
                        // Video is ready, play it
                        video.classList.add('playing');
                        video.currentTime = 0;
                        video.play().then(() => {
                            // Only hide image AFTER video successfully starts playing
                            img.style.setProperty('opacity', '0', 'important');
                        }).catch(error => {
                            console.log('Video playback failed:', error);
                            img.style.setProperty('opacity', '1', 'important');
                            video.classList.remove('playing');
                        });
                    } else {
                        // Load video on first hover
                        loadVideo();
                    }
                });
                
                // Mouse leave - pause video and show image
                card.addEventListener('mouseleave', () => {
                    isHovered = false;
                    video.pause();
                    video.currentTime = 0;
                    video.classList.remove('playing');
                    img.style.setProperty('opacity', '1', 'important');
                });
                
                // Ensure video loops properly when hovered
                video.addEventListener('ended', () => {
                    if (isHovered) {
                        video.currentTime = 0;
                        video.play().catch(error => {
                            console.log('Video loop failed:', error);
                            // If loop fails, show image again
                            img.style.setProperty('opacity', '1', 'important');
                            video.classList.remove('playing');
                        });
                    }
                });
            }
        });
        
        // Pause all videos when page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                characterCards.forEach(card => {
                    const video = card.querySelector('.character-video');
                    if (video) {
                        video.pause();
                    }
                });
            }
        });
    }

    // Logo loading functionality
    function initLogoLoading() {
        const logoImg = document.querySelector('.logo-img');
        
        if (logoImg) {
            logoImg.addEventListener('load', () => {
                logoImg.classList.add('loaded');
            });
            
            logoImg.addEventListener('error', () => {
                console.log('Logo image failed to load, showing fallback text');
                // If logo fails to load, show fallback text
                const logoContainer = logoImg.parentElement;
                logoContainer.innerHTML = '<span class="logo-text">Gcrush</span>';
            });
            
            // If image is already cached and loaded
            if (logoImg.complete) {
                logoImg.classList.add('loaded');
            }
        }
    }

    // Image loading functionality to remove skeleton screen
    function initImageLoading() {
        const characterImages = document.querySelectorAll('.character-image img');
        
        characterImages.forEach(img => {
            // Add loading class initially
            img.classList.add('loading');
            
            // Remove skeleton effect when image loads
            if (img.complete) {
                img.classList.remove('loading');
                img.classList.add('loaded');
                if (img.parentElement) {
                    img.parentElement.classList.add('image-loaded');
                    img.parentElement.style.animation = 'none';
                    img.parentElement.style.background = 'transparent';
                }
            } else {
                img.addEventListener('load', function() {
                    this.classList.remove('loading');
                    this.classList.add('loaded');
                    if (this.parentElement) {
                        this.parentElement.classList.add('image-loaded');
                        this.parentElement.style.animation = 'none';
                        this.parentElement.style.background = 'transparent';
                    }
                });
                
                img.addEventListener('error', function() {
                    console.error('Failed to load image:', this.src);
                    this.classList.remove('loading');
                    if (this.parentElement) {
                        this.parentElement.classList.add('image-loaded');
                        this.parentElement.style.animation = 'none';
                        this.parentElement.style.background = 'transparent';
                    }
                });
            }
        });
    }

    // Accordion functionality for FAQ section
    function initAccordion() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        if (!accordionHeaders.length) return;
        
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const icon = header.querySelector('i');
                
                // Check if this accordion is already active
                const isActive = content.classList.contains('active');
                
                // Close all accordions first
                document.querySelectorAll('.accordion-content').forEach(item => {
                    item.classList.remove('active');
                });
                
                document.querySelectorAll('.accordion-header i').forEach(i => {
                    i.className = 'fas fa-chevron-down';
                });
                
                // If the clicked one wasn't active, open it
                if (!isActive) {
                    content.classList.add('active');
                    if (icon) {
                        icon.className = 'fas fa-chevron-up';
                    }
                }
            });
        });
        
        // Open the first accordion by default
        if (accordionHeaders.length > 0) {
            const firstContent = accordionHeaders[0].nextElementSibling;
            const firstIcon = accordionHeaders[0].querySelector('i');
            
            firstContent.classList.add('active');
            if (firstIcon) {
                firstIcon.className = 'fas fa-chevron-up';
            }
        }
    }
    
    // Scroll animations for glassmorphism elements
    function initScrollAnimations() {
        const glassPanels = document.querySelectorAll('.glass-panel');
        const glassCards = document.querySelectorAll('.glass-card');
        
        // Simple intersection observer for fade-in effect
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px' // Slightly before the element comes into view
        });
        
        // Observe panels and cards
        glassPanels.forEach(panel => {
            observer.observe(panel);
        });
        
        glassCards.forEach(card => {
            observer.observe(card);
        });
        

    }
    
    // Countdown timer for premium card
    function initCountdownTimer() {
        const timerValues = document.querySelectorAll('.timer-value');
        
        if (!timerValues.length) return;
        
        // Set initial values
        let days = 7;
        let hours = 23;
        let minutes = 59;
        
        function updateTimerDisplay() {
            if (timerValues[0]) timerValues[0].textContent = days.toString().padStart(2, '0');
            if (timerValues[1]) timerValues[1].textContent = hours.toString().padStart(2, '0');
            if (timerValues[2]) timerValues[2].textContent = minutes.toString().padStart(2, '0');
        }
        
        function countdown() {
            minutes--;
            
            if (minutes < 0) {
                minutes = 59;
                hours--;
                
                if (hours < 0) {
                    hours = 23;
                    days--;
                    
                    if (days < 0) {
                        // Reset timer
                        days = 7;
                        hours = 23;
                        minutes = 59;
                    }
                }
            }
            
            updateTimerDisplay();
        }
        
        // Update display immediately
        updateTimerDisplay();
        
        // Start countdown
        setInterval(countdown, 60000); // Update every minute
    }
    
    // Enhanced glassmorphism effects
    function enhanceGlassmorphism() {
        const glassElements = document.querySelectorAll('.glass-panel, .glass-card');
        
        glassElements.forEach(element => {
            // Add subtle mouse move effect
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const deltaX = (x - centerX) / centerX;
                const deltaY = (y - centerY) / centerY;
                
                // Apply subtle transform
                element.style.transform = `perspective(1000px) rotateX(${deltaY * 2}deg) rotateY(${deltaX * 2}deg) translateZ(0)`;
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
            });
        });
    }
    
    // Initialize enhanced effects
    enhanceGlassmorphism();
    
    // Banner Carousel functionality
    function initBannerCarousel() {
        const slides = document.querySelectorAll('.banner-slide');
        const navDots = document.querySelectorAll('.nav-dot');
        const carousel = document.querySelector('.banner-carousel');
        const bannerVideo = document.querySelector('.banner-video');
        
        if (!slides.length || !navDots.length || !carousel) return;
        
        let currentSlide = 0;
        let autoplayInterval;
        let isPaused = false;
        
        function showSlide(index) {
            // Remove active classes
            slides.forEach(slide => {
                slide.classList.remove('active', 'prev');
            });
            navDots.forEach(dot => {
                dot.classList.remove('active');
            });
            
            // Add active classes
            slides[index].classList.add('active');
            navDots[index].classList.add('active');
            
            // Add prev class to previous slide
            const prevIndex = index === 0 ? slides.length - 1 : index - 1;
            slides[prevIndex].classList.add('prev');
            
            currentSlide = index;
        }
        
        function nextSlide() {
            const next = (currentSlide + 1) % slides.length;
            showSlide(next);
        }
        
        function startAutoplay() {
            if (autoplayInterval) clearInterval(autoplayInterval);
            autoplayInterval = setInterval(() => {
                if (!isPaused) {
                    nextSlide();
                }
            }, 8000); // 8 seconds
        }
        
        function stopAutoplay() {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
                autoplayInterval = null;
            }
        }
        
        // Navigation dots click handlers
        navDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
                stopAutoplay();
                startAutoplay(); // Restart autoplay
            });
        });
        
        // Pause on hover
        carousel.addEventListener('mouseenter', () => {
            isPaused = true;
        });
        
        carousel.addEventListener('mouseleave', () => {
            isPaused = false;
        });
        
        // Touch/swipe support for mobile
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isPaused = true;
        });
        
        carousel.addEventListener('touchmove', (e) => {
            // Prevent default scrolling while swiping horizontally
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = Math.abs(currentX - startX);
            const deltaY = Math.abs(currentY - startY);
            
            if (deltaX > deltaY && deltaX > 10) {
                e.preventDefault();
            }
        });
        
        carousel.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const differenceX = startX - endX;
            const differenceY = startY - endY;
            
            // Only trigger if horizontal swipe is more prominent than vertical
            if (Math.abs(differenceX) > Math.abs(differenceY) && Math.abs(differenceX) > 50) {
                if (differenceX > 0) {
                    // Swipe left - next slide
                    nextSlide();
                } else {
                    // Swipe right - previous slide
                    const prev = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
                    showSlide(prev);
                }
                stopAutoplay();
                startAutoplay();
            }
            
            isPaused = false;
        });
        
        // Initialize first slide and start autoplay
        showSlide(0);
        startAutoplay();
        
        // Pause autoplay when page is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoplay();
            } else {
                startAutoplay();
            }
        });
        
        // Video autoplay functionality for banner 3
        if (bannerVideo) {
            // Try to ensure autoplay works
            bannerVideo.addEventListener('loadeddata', () => {
                console.log('Banner video loaded');
                bannerVideo.play().catch(error => {
                    console.log('Video autoplay failed:', error);
                    // Try again with user interaction
                    bannerVideo.muted = true;
                    bannerVideo.play();
                });
            });
            
            // Keep video looping
            bannerVideo.addEventListener('ended', () => {
                bannerVideo.currentTime = 0;
                bannerVideo.play();
            });
        }
    }
    
    // Banner image loading functionality
    function initBannerImageLoading() {
        const bannerImages = document.querySelectorAll('.banner-full-img');
        
        bannerImages.forEach(img => {
            // Remove skeleton animation when image loads
            if (img.complete) {
                img.style.animation = 'none';
            } else {
                img.addEventListener('load', function() {
                    this.style.animation = 'none';
                });
                
                img.addEventListener('error', function() {
                    console.error('Failed to load banner image:', this.src);
                    // Keep skeleton animation on error
                });
            }
        });
    }
    
    // Mobile-specific enhancements
    function initMobileEnhancements() {
        // Add touch feedback for interactive elements
        const interactiveElements = document.querySelectorAll(
            '.auth-button, .social-btn, .submit-btn, .character-card, .nav-dot, .dropdown-item, .sidebar-item'
        );
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
                this.style.transition = 'transform 0.1s ease';
            });
            
            element.addEventListener('touchend', function() {
                this.style.transform = '';
                this.style.transition = 'transform 0.3s ease';
            });
            
            element.addEventListener('touchcancel', function() {
                this.style.transform = '';
                this.style.transition = 'transform 0.3s ease';
            });
        });
        
        // Prevent zoom on double tap for certain elements
        const preventZoomElements = document.querySelectorAll(
            '.auth-button, .social-btn, .submit-btn, .nav-dot'
        );
        
        preventZoomElements.forEach(element => {
            element.addEventListener('touchend', function(e) {
                e.preventDefault();
                element.click();
            });
        });
        
        // Add pull-to-refresh hint (visual only)
        if (window.innerWidth <= 768) {
            const pullHint = document.createElement('div');
            pullHint.className = 'pull-hint';
            pullHint.innerHTML = '<i class="fas fa-chevron-down"></i> Pull to refresh';
            pullHint.style.cssText = `
                position: fixed;
                top: 60px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(162, 89, 255, 0.9);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 1001;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(pullHint);
            
            let startY = 0;
            let isAtTop = true;
            
            document.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
                isAtTop = window.scrollY === 0;
            });
            
            document.addEventListener('touchmove', (e) => {
                if (isAtTop) {
                    const currentY = e.touches[0].clientY;
                    const pullDistance = currentY - startY;
                    
                    if (pullDistance > 50) {
                        pullHint.style.opacity = '1';
                    } else {
                        pullHint.style.opacity = '0';
                    }
                }
            });
            
            document.addEventListener('touchend', () => {
                pullHint.style.opacity = '0';
            });
        }
    }
    
    // Add loading state handling
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        
        // Initialize mobile enhancements
        initMobileEnhancements();
        
        // Trigger initial animations
        setTimeout(() => {
            const elementsToAnimate = document.querySelectorAll('.glass-panel, .glass-card');
            elementsToAnimate.forEach((element, index) => {
                setTimeout(() => {
                    element.classList.add('fade-in');
                }, index * 100);
            });
        }, 500);
    });
    
    // Export functions for external use
    window.initCharacterVideoHover = initCharacterVideoHover;
});