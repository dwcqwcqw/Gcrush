// Candy.ai Combined JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Components
    initSidebar();
    initScrollAnimations();
    initAccordion();
    initCountdownTimer();
    initCharacterVideoHover();
    initLogoLoading();
    initImageLoading();
    initBannerCarousel();
    initBannerImageLoading();
    
    // Sidebar toggle functionality
    function initSidebar() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            // Toggle sidebar collapsed state
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                
                // Store sidebar state in local storage
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            });
            
            // Check local storage for saved state
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
            }
            
            // Auto-collapse on small screens
            const handleResize = () => {
                if (window.innerWidth <= 768 && !sidebar.classList.contains('collapsed')) {
                    sidebar.classList.add('collapsed');
                }
            };
            
            // Call once on load
            handleResize();
            
            // Add event listener for window resize
            window.addEventListener('resize', handleResize);
        }
    }
    
    // Character video hover functionality
    function initCharacterVideoHover() {
        const characterCards = document.querySelectorAll('.character-card:not(.premium-card)');
        
        characterCards.forEach(card => {
            const video = card.querySelector('.character-video');
            const img = card.querySelector('.character-image img');
            
            if (video && img) {
                let isHovered = false;
                let videoReady = false;
                
                // Preload video in background
                const preloadVideo = () => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    
                    try {
                        // Check video format support
                        console.log(`${characterName} - Browser video format support:`);
                        console.log('MP4:', video.canPlayType('video/mp4'));
                        console.log('MOV:', video.canPlayType('video/quicktime'));
                        console.log('MOV (mp4):', video.canPlayType('video/mp4; codecs="avc1.42E01E"'));
                        
                        // Set preload attribute
                        video.preload = 'metadata';
                        
                        // Test video sources
                        const sources = video.querySelectorAll('source');
                        sources.forEach((source, index) => {
                            console.log(`Source ${index + 1} for ${characterName}:`, source.src, source.type);
                            console.log(`Can play this type: ${video.canPlayType(source.type)}`);
                        });
                        
                        // Manually trigger load
                        video.load();
                        
                        console.log('Started loading video for:', characterName);
                        
                    } catch (error) {
                        console.error('Error loading video:', error);
                    }
                };
                
                // Start preloading immediately after DOM is ready, with small delays
                const cardIndex = Array.from(characterCards).indexOf(card);
                setTimeout(() => {
                    preloadVideo();
                }, 100 + (cardIndex * 200)); // Reduced delay to 200ms each
                
                // Video loading events with detailed tracking
                video.addEventListener('loadstart', () => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    console.log(`${characterName}: loadstart - Loading started`);
                });
                
                video.addEventListener('progress', () => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    console.log(`${characterName}: progress - Downloading`);
                });
                
                video.addEventListener('loadedmetadata', () => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    console.log(`${characterName}: loadedmetadata - Metadata loaded`);
                });
                
                video.addEventListener('loadeddata', () => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    console.log(`${characterName}: loadeddata - Data loaded`);
                    videoReady = true;
                    video.classList.add('loaded');
                });
                
                video.addEventListener('canplay', () => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    console.log(`${characterName}: canplay - Can start playing`);
                    videoReady = true;
                    video.classList.add('loaded');
                });
                
                video.addEventListener('canplaythrough', () => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    console.log(`${characterName}: canplaythrough - Can play through`);
                });
                
                video.addEventListener('suspend', () => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    console.log(`${characterName}: suspend - Loading suspended`);
                });
                
                video.addEventListener('abort', () => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    console.log(`${characterName}: abort - Loading aborted`);
                });
                
                video.addEventListener('stalled', () => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    console.log(`${characterName}: stalled - Loading stalled`);
                });
                
                // Mouse enter - start video only if loaded
                card.addEventListener('mouseenter', () => {
                    isHovered = true;
                    
                    if (videoReady) {
                        img.style.opacity = '0';
                        video.classList.add('playing');
                        video.currentTime = 0;
                        video.play().catch(error => {
                            console.log('Video playback failed:', error);
                            // Fallback to image
                            img.style.opacity = '1';
                            video.classList.remove('playing');
                        });
                    }
                });
                
                // Mouse leave - pause video and show image
                card.addEventListener('mouseleave', () => {
                    isHovered = false;
                    video.pause();
                    video.currentTime = 0;
                    video.classList.remove('playing');
                    img.style.opacity = '1';
                });
                
                // Ensure video loops properly when hovered
                video.addEventListener('ended', () => {
                    if (isHovered) {
                        video.currentTime = 0;
                        video.play().catch(error => {
                            console.log('Video loop failed:', error);
                        });
                    }
                });
                
                // Handle video load errors gracefully
                video.addEventListener('error', (e) => {
                    const characterName = card.querySelector('.character-name')?.textContent || 'Unknown';
                    console.error(`Video failed to load for ${characterName}:`, e);
                    console.log('Video element:', video);
                    console.log('Video sources:', Array.from(video.querySelectorAll('source')).map(s => ({ src: s.src, type: s.type })));
                    videoReady = false;
                    video.classList.remove('loaded');
                    
                    // Try to test the URLs directly
                    const sources = video.querySelectorAll('source');
                    sources.forEach((source, index) => {
                        fetch(source.src, { method: 'HEAD' })
                            .then(response => {
                                console.log(`${characterName} source ${index + 1} (${source.src}): ${response.status} ${response.statusText}`);
                            })
                            .catch(error => {
                                console.error(`${characterName} source ${index + 1} fetch failed:`, error);
                            });
                    });
                });
                
                // Pause all videos when page visibility changes
                document.addEventListener('visibilitychange', () => {
                    if (document.hidden) {
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
                    img.parentElement.style.animation = 'none';
                }
            } else {
                img.addEventListener('load', function() {
                    this.classList.remove('loading');
                    this.classList.add('loaded');
                    if (this.parentElement) {
                        this.parentElement.style.animation = 'none';
                    }
                });
                
                img.addEventListener('error', function() {
                    console.error('Failed to load image:', this.src);
                    this.classList.remove('loading');
                    // Keep skeleton animation on error
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
        let endX = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isPaused = true;
        });
        
        carousel.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const difference = startX - endX;
            
            if (Math.abs(difference) > 50) { // Minimum swipe distance
                if (difference > 0) {
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
    
    // Add loading state handling
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        
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
});