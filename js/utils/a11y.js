/**
 * Announces a message to screen readers via the ARIA live region
 * @param {string} message - The message to announce
 */
export function announce(message) {
    const announcer = document.getElementById('a11y-announcer');
    if (announcer) {
        // Clearing it first ensures repeated identical messages are still read
        announcer.textContent = '';
        setTimeout(() => {
            announcer.textContent = message;
        }, 50);
    }
}

/**
 * Traps focus within a specific container (useful for modals/dropdowns)
 * @param {HTMLElement} element - The container to trap focus in
 * @returns {Function} A function to clean up the event listeners
 */
export function trapFocus(element) {
    const focusableEls = element.querySelectorAll('a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])');
    
    if (focusableEls.length === 0) return () => {};
    
    const firstFocusableEl = focusableEls[0];  
    const lastFocusableEl = focusableEls[focusableEls.length - 1];

    function handleKeyDown(e) {
        const isTabPressed = e.key === 'Tab' || e.keyCode === 9;

        if (!isTabPressed) { 
            return; 
        }

        if (e.shiftKey) { // shift + tab
            if (document.activeElement === firstFocusableEl) {
                lastFocusableEl.focus();
                e.preventDefault();
            }
        } else { // tab
            if (document.activeElement === lastFocusableEl) {
                firstFocusableEl.focus();
                e.preventDefault();
            }
        }
    }

    element.addEventListener('keydown', handleKeyDown);
    firstFocusableEl.focus();

    // Return cleanup function
    return () => {
        element.removeEventListener('keydown', handleKeyDown);
    };
}
