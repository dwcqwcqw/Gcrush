// Candy.ai Combined JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Components
    initSidebar();
    initScrollAnimations();
    initAccordion();
    initCountdownTimer();
    initCharacterVideoHover();
    initLogoLoading();
    
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
                let loadAttempted = false;
                
                // Preload video on first hover attempt for better performance
                const preloadVideo = () => {
                    if (!loadAttempted) {
                        video.load();
                        loadAttempted = true;
                    }
                };
                
                // Mouse enter - start video
                card.addEventListener('mouseenter', () => {
                    isHovered = true;
                    preloadVideo();
                    
                    video.currentTime = 0; // Reset video to start
                    video.play().catch(error => {
                        console.log('Video playback failed:', error);
                    });
                });
                
                // Mouse leave - pause video and show image
                card.addEventListener('mouseleave', () => {
                    isHovered = false;
                    video.pause();
                    video.currentTime = 0; // Reset to beginning
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
                video.addEventListener('error', () => {
                    console.log('Video failed to load for card:', card);
                    // Hide video if it fails to load
                    video.style.display = 'none';
                });
                
                // Optimize video loading
                video.addEventListener('loadeddata', () => {
                    console.log('Video loaded successfully for card:', card);
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