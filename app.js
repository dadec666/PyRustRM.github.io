// Application State
let appState = {
    progress: {},
    expandedPhases: new Set(),
    currentFilter: 'all',
    totalItems: 0,
    completedItems: 0
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadProgress();
    setupEventListeners();
    updateProgressDisplay();
    calculateTotalItems();
    updateFrameworkCount();
});

// Initialize the application
function initializeApp() {
    // Add animation delays for phase cards
    const phaseCards = document.querySelectorAll('.phase-card');
    phaseCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Initialize tooltips for framework cards
    initializeTooltips();
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => handleFilterChange(btn.dataset.filter));
    });
    
    // Phase navigation buttons
    const phaseNavButtons = document.querySelectorAll('.phase-nav-btn');
    phaseNavButtons.forEach(btn => {
        btn.addEventListener('click', () => scrollToPhase(btn.dataset.phase));
    });
    
    // Reset progress button
    document.getElementById('reset-progress').addEventListener('click', resetProgress);
    
    // Comparison modal
    document.getElementById('show-comparison').addEventListener('click', showComparison);
    
    // Checkbox change handlers
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-item]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Close modal on outside click
    document.getElementById('comparison-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeComparison();
        }
    });
}

// Handle filter changes
function handleFilterChange(filter) {
    appState.currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Filter phase cards
    const phaseCards = document.querySelectorAll('.phase-card');
    phaseCards.forEach(card => {
        const shouldShow = shouldShowPhase(card, filter);
        
        if (shouldShow) {
            card.classList.remove('filtered-out');
        } else {
            card.classList.add('filtered-out');
        }
    });
    
    // Update phase navigation buttons
    const phaseNavButtons = document.querySelectorAll('.phase-nav-btn');
    phaseNavButtons.forEach((btn, index) => {
        const phaseCard = document.querySelector(`[data-phase="${index + 1}"]`);
        if (phaseCard && shouldShowPhase(phaseCard, filter)) {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        } else {
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
        }
    });
}

// Determine if phase should be shown based on filter
function shouldShowPhase(phaseCard, filter) {
    const language = phaseCard.dataset.language;
    const isFramework = phaseCard.dataset.isFramework === 'true';
    
    switch (filter) {
        case 'all':
            return true;
        case 'python':
            return language === 'python' || language === 'both';
        case 'rust':
            return language === 'rust' || language === 'both';
        case 'frameworks':
            return isFramework;
        default:
            return true;
    }
}

// Toggle phase expansion
function togglePhase(phaseNumber) {
    const content = document.getElementById(`phase-${phaseNumber}-content`);
    const toggle = content.parentElement.querySelector('.phase-toggle');
    
    if (appState.expandedPhases.has(phaseNumber)) {
        // Collapse
        content.classList.remove('expanded');
        toggle.classList.remove('rotated');
        appState.expandedPhases.delete(phaseNumber);
    } else {
        // Expand
        content.classList.add('expanded');
        toggle.classList.add('rotated');
        appState.expandedPhases.add(phaseNumber);
    }
    
    // Animate checkbox items
    const checkboxItems = content.querySelectorAll('.checkbox-item');
    checkboxItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = content.classList.contains('expanded') ? '1' : '0';
        }, index * 50);
    });
}

// Scroll to specific phase
function scrollToPhase(phaseNumber) {
    const phaseCard = document.querySelector(`[data-phase="${phaseNumber}"]`);
    if (phaseCard) {
        const headerHeight = document.querySelector('.header').offsetHeight + 
                           document.querySelector('.nav-bar').offsetHeight;
        
        const targetPosition = phaseCard.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // Highlight the phase card briefly
        phaseCard.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.5)';
        setTimeout(() => {
            phaseCard.style.boxShadow = '';
        }, 2000);
    }
}

// Handle checkbox changes
function handleCheckboxChange(event) {
    const itemId = event.target.dataset.item;
    const isChecked = event.target.checked;
    const checkboxItem = event.target.closest('.checkbox-item');
    
    // Update state
    appState.progress[itemId] = isChecked;
    
    // Update UI
    if (isChecked) {
        checkboxItem.classList.add('completed');
        // Add completion animation
        checkboxItem.style.transform = 'scale(1.05)';
        setTimeout(() => {
            checkboxItem.style.transform = '';
        }, 200);
    } else {
        checkboxItem.classList.remove('completed');
    }
    
    // Save progress and update displays
    saveProgress();
    updateProgressDisplay();
    updateFrameworkCount();
    
    // Add celebration effect for milestones
    const completedCount = Object.values(appState.progress).filter(Boolean).length;
    if (completedCount > 0 && completedCount % 10 === 0) {
        showCelebration();
    }
}

// Update progress display
function updateProgressDisplay() {
    const completed = Object.values(appState.progress).filter(Boolean).length;
    const total = appState.totalItems;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Update progress bar
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = `${percentage}%`;
    
    // Update text displays
    document.getElementById('progress-percentage').textContent = `${percentage}%`;
    document.getElementById('completed-items').textContent = completed;
    document.getElementById('total-items').textContent = total;
    
    // Update state
    appState.completedItems = completed;
}

// Calculate total items
function calculateTotalItems() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-item]');
    appState.totalItems = checkboxes.length;
    document.getElementById('total-items').textContent = appState.totalItems;
}

// Update framework count
function updateFrameworkCount() {
    const frameworkCheckboxes = document.querySelectorAll('input[data-item^="framework-"]');
    const completedFrameworks = Array.from(frameworkCheckboxes)
        .filter(cb => appState.progress[cb.dataset.item])
        .length;
    
    document.getElementById('framework-count').textContent = 
        `${completedFrameworks} из ${frameworkCheckboxes.length} изучено`;
}

// Show comparison modal
function showComparison() {
    const modal = document.getElementById('comparison-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close comparison modal
function closeComparison() {
    const modal = document.getElementById('comparison-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Reset progress
function resetProgress() {
    if (confirm('Вы уверены, что хотите сбросить весь прогресс?')) {
        appState.progress = {};
        
        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-item]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.checkbox-item').classList.remove('completed');
        });
        
        // Clear in-memory progress
        appState.progress = {};
        
        // Update displays
        updateProgressDisplay();
        updateFrameworkCount();
        
        // Show reset animation
        showResetAnimation();
    }
}

// Save progress (using variables since localStorage is blocked)
function saveProgress() {
    // In sandbox environment, we just keep it in memory
    console.log('Progress saved to memory:', appState.progress);
}

// Load progress (using in-memory storage)
function loadProgress() {
    // In sandbox environment, start with empty progress
    appState.progress = {};
    console.log('Starting with empty progress in sandbox environment');
    
    // Apply loaded progress to checkboxes
    Object.entries(appState.progress).forEach(([itemId, isCompleted]) => {
        const checkbox = document.querySelector(`[data-item="${itemId}"]`);
        if (checkbox && isCompleted) {
            checkbox.checked = true;
            checkbox.closest('.checkbox-item').classList.add('completed');
        }
    });
}

// Initialize tooltips
function initializeTooltips() {
    const frameworkCards = document.querySelectorAll('.framework-card');
    frameworkCards.forEach(card => {
        card.addEventListener('mouseenter', showTooltip);
        card.addEventListener('mouseleave', hideTooltip);
    });
}

// Show tooltip (placeholder function)
function showTooltip(event) {
    // Could implement custom tooltips here
    // For now, we rely on the existing hover effects
}

// Hide tooltip (placeholder function)
function hideTooltip(event) {
    // Could implement custom tooltips here
}

// Handle keyboard navigation
function handleKeyboardNavigation(event) {
    // ESC key closes modal
    if (event.key === 'Escape') {
        closeComparison();
    }
    
    // Number keys 1-7 navigate to phases
    const phaseNumber = parseInt(event.key);
    if (phaseNumber >= 1 && phaseNumber <= 7 && !event.ctrlKey && !event.altKey) {
        scrollToPhase(phaseNumber.toString());
    }
    
    // Space bar toggles current phase
    if (event.key === ' ' && event.target.classList.contains('phase-header')) {
        event.preventDefault();
        const phaseNumber = event.target.closest('[data-phase]').dataset.phase;
        togglePhase(parseInt(phaseNumber));
    }
}

// Show celebration animation
function showCelebration() {
    // Create celebration effect
    const celebration = document.createElement('div');
    celebration.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 4rem;
        z-index: 1001;
        pointer-events: none;
        animation: celebrationPop 1s ease-out forwards;
    `;
    celebration.textContent = '🎉';
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes celebrationPop {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(celebration);
    
    // Remove after animation
    setTimeout(() => {
        document.body.removeChild(celebration);
        document.head.removeChild(style);
    }, 1000);
}

// Show reset animation
function showResetAnimation() {
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.transition = 'width 1s ease-out';
    
    // Reset with animation
    setTimeout(() => {
        progressFill.style.transition = 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 1000);
}

// Utility function to format numbers
function formatNumber(num) {
    return new Intl.NumberFormat('ru-RU').format(num);
}

// Utility function to get progress statistics
function getProgressStats() {
    const total = appState.totalItems;
    const completed = appState.completedItems;
    const remaining = total - completed;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return {
        total,
        completed,
        remaining,
        percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal place
    };
}

// Export functions for potential testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        togglePhase,
        handleFilterChange,
        scrollToPhase,
        resetProgress,
        getProgressStats
    };
}

// Initialize intersection observer for animations
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

// Observe phase cards for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    const phaseCards = document.querySelectorAll('.phase-card');
    phaseCards.forEach(card => {
        observer.observe(card);
    });
});

// Add smooth scrolling polyfill for older browsers
if (!('scrollBehavior' in document.documentElement.style)) {
    const smoothScrollPolyfill = () => {
        const links = document.querySelectorAll('a[href*="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    };
    
    document.addEventListener('DOMContentLoaded', smoothScrollPolyfill);
}

// Performance optimization: debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add scroll progress indicator
const updateScrollProgress = debounce(() => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    // Could add a scroll progress bar here if desired
    // document.getElementById('scroll-progress').style.width = scrolled + '%';
}, 10);

window.addEventListener('scroll', updateScrollProgress);