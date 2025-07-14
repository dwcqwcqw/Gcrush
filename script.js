document.addEventListener('DOMContentLoaded', function() {
    // Toggle sidebar on mobile
    const menuBtn = document.querySelector('.menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const footer = document.querySelector('footer');

    menuBtn.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            if (sidebar.style.width === '250px') {
                sidebar.style.width = '0';
                mainContent.style.marginLeft = '0';
                footer.style.marginLeft = '0';
            } else {
                sidebar.style.width = '250px';
                mainContent.style.marginLeft = '250px';
                footer.style.marginLeft = '250px';
            }
        }
    });

    // Accordion functionality
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const accordionItem = this.parentElement;
            const accordionContent = this.nextElementSibling;
            const icon = this.querySelector('i');
            
            // Toggle active class
            accordionContent.classList.toggle('active');
            
            // Update icon
            if (accordionContent.classList.contains('active')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
            
            // Close other accordion items
            const allAccordionContents = document.querySelectorAll('.accordion-content');
            const allIcons = document.querySelectorAll('.accordion-header i');
            
            allAccordionContents.forEach((content, index) => {
                if (content !== accordionContent && content.classList.contains('active')) {
                    content.classList.remove('active');
                    allIcons[index].classList.remove('fa-chevron-up');
                    allIcons[index].classList.add('fa-chevron-down');
                }
            });
        });
    });

    // User profile dropdown
    const userProfile = document.querySelector('.user-profile');
    
    userProfile.addEventListener('click', function() {
        // Here you would toggle a dropdown menu
        console.log('User profile clicked');
    });

    // Language selector dropdown
    const languageSelectors = document.querySelectorAll('.language-selector');
    
    languageSelectors.forEach(selector => {
        selector.addEventListener('click', function() {
            // Here you would toggle a language dropdown
            console.log('Language selector clicked');
        });
    });

    // Create AI button
    const createBtn = document.querySelector('.create-btn');
    
    createBtn.addEventListener('click', function() {
        // Here you would redirect to the create page or show a modal
        console.log('Create AI button clicked');
    });

    // Premium button
    const premiumBtn = document.querySelector('.premium-btn');
    
    premiumBtn.addEventListener('click', function() {
        // Here you would redirect to the premium page
        console.log('Premium button clicked');
    });

    // Add hover effects to character cards if they exist
    const characterCards = document.querySelectorAll('.character-card');
    
    characterCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        });
    });

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Check if we should show chat on load (from generate-media page)
    if (localStorage.getItem('showChatOnLoad') === 'true') {
        localStorage.removeItem('showChatOnLoad');
        // Trigger chat functionality
        setTimeout(() => {
            const chatBtn = document.getElementById('sidebarChatBtn');
            if (chatBtn) {
                chatBtn.click();
            }
        }, 100);
    }

    // Simulate content loading for demonstration
    setTimeout(() => {
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }, 1000);
}); 