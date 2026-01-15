// Get DOM elements
const passwordInput = document.getElementById('password-input');
const strengthBar = document.getElementById('strength-bar');
const strengthText = document.getElementById('strength-text');
const engineSlider = document.getElementById('engine-slider');
const timeDisplay = document.getElementById('time-display');
const toggleBtn = document.getElementById('toggle-visibility');

// Initialize
passwordInput.addEventListener('input', handlePasswordInput);
toggleBtn.addEventListener('click', togglePasswordVisibility);
engineSlider.addEventListener('input', handleEngineSliderChange);

/**
 * Handle password input change
 */
function handlePasswordInput() {
    const password = passwordInput.value;
    
    if (password.length === 0) {
        updateStrengthBar(0, 'Enter a password');
        engineSlider.value = 50;
        timeDisplay.textContent = 'N/A';
        return;
    }
    
    // Calculate password strength (0-100)
    const strength = calculatePasswordStrength(password);
    
    // Calculate time to crack with current engine strength
    const engineStrength = engineSlider.value;
    const timeToCrack = calculateTimeToCrack(password, engineStrength);
    
    // Update UI
    updateStrengthBar(strength, getStrengthLabel(strength));
    updateTimeToCrack(timeToCrack);
}

/**
 * Calculate password strength (0-100)
 * Leave this method empty as requested - to be implemented
 */
function calculatePasswordStrength(password) {
    let strength = 0;
    debugger;
    // Length score
    strength += Math.min(password.length * 5, 30);
    
    // Uppercase letters
    if (/[A-Z]/.test(password)) strength += 10;
    
    // Lowercase letters
    if (/[a-z]/.test(password)) strength += 10;
    
    // Numbers
    if (/[0-9]/.test(password)) strength += 15;
    
    // Special characters
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 35;
    
    // Common patterns (reduce score)
    if (/(.)\1{2,}/.test(password)) strength -= 10; // Repeating characters
    if (/^(123|abc|password)/i.test(password)) strength -= 20; // Common patterns
    
    return Math.max(0, Math.min(strength, 100));
}
/**
 * Calculate time to crack based on password strength and engine strength
 * * @param {string} password - The password to analyze
 * @param {number} engineStrength - Engine strength (0-100): 0=Toaster, 50=Avg Computer, 100=Quantum Computer
 */
function calculateTimeToCrack(password, engineStrength) {
    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10; 
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

    if (poolSize === 0) poolSize = 1;

    const combinations = Math.pow(poolSize, password.length);
    const rate = Math.pow(10, engineStrength * 0.2);

    const seconds = combinations / rate;

    return seconds * 1000;
}

/**
 * Get strength label based on percentage
 */
function getStrengthLabel(strength) {
    if (strength < 20) return 'Very Weak';
    if (strength < 40) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    if (strength < 95) return 'Strong';
    return 'Very Strong';
}

/**
 * Format time to readable string
 */
function formatTime(seconds) {
    if (seconds < 1) return '< 1 second';
    if (seconds < 60) return Math.round(seconds) + ' seconds';
    if (seconds < 3600) return Math.round(seconds / 60) + ' minutes';
    if (seconds < 86400) return Math.round(seconds / 3600) + ' hours';
    if (seconds < 2592000) return Math.round(seconds / 86400) + ' days';
    if (seconds < 31536000) return Math.round(seconds / 2592000) + ' months';
    return Math.round(seconds / 31536000) + ' years';
}

/**
 * Update strength bar visual
 */
function updateStrengthBar(strength, label) {
    strengthBar.style.width = strength + '%';
    strengthText.textContent = label + ' (' + strength + '%)';
    
    // Update color dynamically
    if (strength < 20) {
        strengthBar.style.background = 'linear-gradient(90deg, #ff4444 0%, #ff6666 100%)';
    } else if (strength < 40) {
        strengthBar.style.background = 'linear-gradient(90deg, #ff8844 0%, #ffaa44 100%)';
    } else if (strength < 60) {
        strengthBar.style.background = 'linear-gradient(90deg, #ffbb33 0%, #ffdd44 100%)';
    } else if (strength < 80) {
        strengthBar.style.background = 'linear-gradient(90deg, #99dd44 0%, #bbee44 100%)';
    } else {
        strengthBar.style.background = 'linear-gradient(90deg, #00cc44 0%, #00ff66 100%)';
    }
}
/**
 * Update time to crack display
 * @param {number} milliseconds - Time in milliseconds
 */
function updateTimeToCrack(milliseconds) {
    const formatted = formatTimeToCrack(milliseconds);
    timeDisplay.textContent = formatted;
}

/**
 * Format time to crack with max 3 digits before decimal, with unit suffix
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time (e.g., "999ms", "1.5s", "23min", "4.2h")
 */
function formatTimeToCrack(milliseconds) {
    if (milliseconds < 1000) {
        return Math.round(milliseconds) + 'ms';
    }
    
    const seconds = milliseconds / 1000;
    if (seconds < 60) {
        return (seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)) + 's';
    }
    
    const minutes = seconds / 60;
    if (minutes < 60) {
        return (minutes < 10 ? minutes.toFixed(1) : Math.round(minutes)) + 'min';
    }
    
    const hours = minutes / 60;
    if (hours < 24) {
        return (hours < 10 ? hours.toFixed(1) : Math.round(hours)) + 'h';
    }
    
    const days = hours / 24;
    if (days < 365) {
        return (days < 10 ? days.toFixed(1) : Math.round(days)) + 'd';
    }
    
    const years = days / 365;
    return (years < 10 ? years.toFixed(1) : Math.round(years)) + 'y';
}

/**
 * Handle engine slider change
 */
function handleEngineSliderChange() {
    // Recalculate time to crack based on new engine strength
    const password = passwordInput.value;
    if (password.length > 0) {
        const engineStrength = engineSlider.value;
        const timeToCrack = calculateTimeToCrack(password, engineStrength);
        updateTimeToCrack(timeToCrack);
    }
}

/**
 * Handle time slider change
 */
function handleTimeSliderChange() {
    // This slider is mainly visual and shows the current strength
    // You can add additional logic here if needed
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
    const isPassword = passwordInput.type === 'password';
    
    if (isPassword) {
        passwordInput.type = 'text';
        toggleBtn.textContent = '👁️ Hide';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️ Show';
    }
}
