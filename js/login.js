// Import auth manager for actual authentication
import { authManager } from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const signUpButton = document.getElementById('signUpBtn');
    const signInButton = document.getElementById('signInBtn');
    const signUpLink = document.getElementById('signUpLink');
    const signInLink = document.getElementById('signInLink');
    const container = document.getElementById('container');
    
    // Form elements
    const signUpForm = document.getElementById('signUpForm');
    const signInForm = document.getElementById('signInForm');
    
    // Debug: Log elements to ensure they're found
    console.log('Elements found:', {
        signUpButton: !!signUpButton,
        signInButton: !!signInButton,
        signUpLink: !!signUpLink,
        signInLink: !!signInLink,
    });
    
    // FIXED: Enhanced transition management to prevent double visibility
    let isTransitioning = false;
    
    // Add event listeners for panel switching with enhanced error handling
    if (signUpButton) {
        signUpButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isTransitioning) {
                switchToSignUp();
            }
        });
    }
    
    if (signInButton) {
        signInButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isTransitioning) {
                switchToSignIn();
            }
        });
    }
    
    if (signUpLink) {
        signUpLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Join Us link clicked'); // Debug log
            if (!isTransitioning) {
                switchToSignUp();
            }
        });
    }
    
    if (signInLink) {
        signInLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Sign In link clicked'); // Debug log
            if (!isTransitioning) {
                switchToSignIn();
            }
        });
    }
    
    // FIXED: Add additional event delegation for links in case of timing issues
    document.addEventListener('click', function(e) {
        // Handle "Join Us" link
        if (e.target && (e.target.matches('#signUpLink') || e.target.closest('#signUpLink'))) {
            e.preventDefault();
            console.log('Join Us link clicked via delegation');
            if (!isTransitioning) {
                switchToSignUp();
            }
        }
        
        // Handle "Sign In" link
        if (e.target && (e.target.matches('#signInLink') || e.target.closest('#signInLink'))) {
            e.preventDefault();
            console.log('Sign In link clicked via delegation');
            if (!isTransitioning) {
                switchToSignIn();
            }
        }
    });
    
    // FIXED: Smooth transition functions with proper state management
    function switchToSignUp() {
        if (!container) return;
        isTransitioning = true;
        container.classList.add('right-panel-active');
        playTransitionEffect();
        console.log('Switched to Sign Up');
        
        // Reset transition lock after animation completes
        setTimeout(() => {
            isTransitioning = false;
        }, 600);
    }
    
    function switchToSignIn() {
        if (!container) return;
        isTransitioning = true;
        container.classList.remove('right-panel-active');
        playTransitionEffect();
        console.log('Switched to Sign In');
        
        // Reset transition lock after animation completes
        setTimeout(() => {
            isTransitioning = false;
        }, 600);
    }
    
    // Enhanced transition effect with cyber sounds simulation
    function playTransitionEffect() {
        // Add a subtle screen flicker effect during transition
        document.body.style.filter = 'brightness(1.1) contrast(1.05)';
        setTimeout(() => {
            document.body.style.filter = 'brightness(1) contrast(1)';
        }, 150);
        
        // Add temporary glow to container during transition
        if (container) {
            container.style.boxShadow = '0 14px 28px rgba(0, 255, 255, 0.4), 0 10px 10px rgba(255, 0, 255, 0.35)';
            setTimeout(() => {
                container.style.boxShadow = '';
            }, 300);
        }
    }
    
    // Form submission handlers
    if (signUpForm) {
        signUpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission(this, 'signUp');
        });
    }

    if (signInForm) {
        signInForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission(this, 'signIn');
        });
    }

    // Google Sign-In button handler
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    // Handle form submission with actual Firebase authentication
    async function handleFormSubmission(form, type) {
        const submitBtn = form.querySelector('button[type="submit"].cyber-btn');
        if (!submitBtn) return;
        
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        // Validate form
        if (!validateForm(form, type)) {
            return;
        }
        
        // Show loading state
        if (btnText) btnText.classList.add('hidden');
        if (btnLoading) {
            btnLoading.classList.remove('hidden');
            btnLoading.classList.add('show');
        }
        submitBtn.disabled = true;
        
        // Add glowing effect during submission
        submitBtn.style.boxShadow = '0 0 30px #00ffff, inset 0 0 30px rgba(0, 255, 255, 0.3)';
        
        try {
            let result;
            
            if (type === 'signIn') {
                const email = form.querySelector('#signInEmail').value;
                const password = form.querySelector('#signInPassword').value;
                result = await authManager.signInWithEmail(email, password);
            } else if (type === 'signUp') {
                const email = form.querySelector('#signUpEmail').value;
                const password = form.querySelector('#signUpPassword').value;
                const username = form.querySelector('#signUpUsername').value;
                result = await authManager.registerWithEmail(email, password, username);
            }
            
            if (result.success) {
                // Show success message
                showNotification(type === 'signIn' ? 'Access Granted! Welcome to the Matrix.' : 'Account Created! Your journey begins now.', 'success');
                
                // Redirect to main page after successful authentication
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1500);
            } else {
                // Show error message
                showNotification(result.error, 'error');
                
                // Reset button state on error
                resetButtonState(submitBtn, btnText, btnLoading);
            }
            
        } catch (error) {
            console.error('Authentication error:', error);
            showNotification('Authentication failed. Please try again.', 'error');
            resetButtonState(submitBtn, btnText, btnLoading);
        }
    }
    
    // Reset button state helper function
    function resetButtonState(submitBtn, btnText, btnLoading) {
        if (btnText) btnText.classList.remove('hidden');
        if (btnLoading) {
            btnLoading.classList.add('hidden');
            btnLoading.classList.remove('show');
        }
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.boxShadow = '';
        }
    }

    // Google Sign-In handler
    async function handleGoogleSignIn() {
        const googleBtn = document.getElementById('googleSignInBtn');
        if (!googleBtn) return;
        
        const textSpan = googleBtn.querySelector('span');
        if (!textSpan) return;
        
        const originalText = textSpan.textContent;
        
        // Show loading state
        googleBtn.disabled = true;
        textSpan.textContent = 'Connecting to Google...';
        googleBtn.style.boxShadow = '0 0 30px #00ffff, inset 0 0 30px rgba(0, 255, 255, 0.3)';
        
        try {
            const result = await authManager.signInWithGoogle();
            
            if (result.success) {
                showNotification('Google authentication successful! Welcome to the Matrix.', 'success');
                
                // Redirect to main page after successful authentication
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1500);
            } else {
                showNotification(result.error, 'error');
                resetGoogleButtonState(googleBtn, originalText);
            }
            
        } catch (error) {
            console.error('Google Sign-In error:', error);
            showNotification('Google authentication failed. Please try again.', 'error');
            resetGoogleButtonState(googleBtn, originalText);
        }
    }
    
    // Reset Google button state helper function
    function resetGoogleButtonState(button, originalText) {
        if (button) {
            button.disabled = false;
            const textSpan = button.querySelector('span');
            if (textSpan) {
                textSpan.textContent = originalText;
            }
            button.style.boxShadow = '';
        }
    }
    
    // Form validation
    function validateForm(form, type) {
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                showInputError(input, 'This field is required');
                isValid = false;
            } else if (input.type === 'email' && !isValidEmail(input.value)) {
                showInputError(input, 'Invalid neural link format');
                isValid = false;
            } else if (input.type === 'password' && input.value.length < 6) {
                showInputError(input, 'Encryption key must be at least 6 characters');
                isValid = false;
            } else {
                clearInputError(input);
            }
        });
        
        return isValid;
    }
    
    // Email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Show input error
    function showInputError(input, message) {
        clearInputError(input);
        
        input.style.borderColor = '#ff0040';
        input.style.boxShadow = '0 0 10px rgba(255, 0, 64, 0.5)';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #ff0040;
            font-size: 11px;
            margin-top: 5px;
            font-family: 'Source Code Pro', monospace;
            text-shadow: 0 0 5px #ff0040;
        `;
        
        input.parentNode.appendChild(errorDiv);
    }
    
    // Clear input error
    function clearInputError(input) {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
    
    // Show notification
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid ${type === 'success' ? '#00ffff' : '#ff0040'};
            color: ${type === 'success' ? '#00ffff' : '#ff0040'};
            padding: 15px 25px;
            border-radius: 8px;
            font-family: 'Source Code Pro', monospace;
            font-size: 12px;
            z-index: 1000;
            box-shadow: 0 0 20px ${type === 'success' ? '#00ffff' : '#ff0040'};
            transform: translateX(100%);
            transition: transform 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Add typing effect to inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.classList.add('focused');
            // Clear any validation errors on focus
            clearInputError(this);
        });
        
        input.addEventListener('blur', function() {
            this.parentNode.classList.remove('focused');
        });
        
        input.addEventListener('input', function() {
            if (this.value) {
                this.parentNode.classList.add('has-value');
            } else {
                this.parentNode.classList.remove('has-value');
            }
            // Clear validation errors as user types
            clearInputError(this);
        });
    });
    
    // Enhanced matrix rain effect on logo click
    let matrixRainActive = false;
    const logo = document.querySelector('.logo');
    
    if (logo) {
        logo.addEventListener('click', function() {
            if (!matrixRainActive) {
                createMatrixRain();
            }
        });
    }
    
    function createMatrixRain() {
        matrixRainActive = true;
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
        
        for (let i = 0; i < 25; i++) {
            setTimeout(() => {
                const rain = document.createElement('div');
                rain.style.cssText = `
                    position: fixed;
                    top: -20px;
                    left: ${Math.random() * window.innerWidth}px;
                    color: ${Math.random() > 0.5 ? '#00ffff' : '#ff00ff'};
                    font-family: 'Source Code Pro', monospace;
                    font-size: ${12 + Math.random() * 6}px;
                    z-index: 999;
                    pointer-events: none;
                    text-shadow: 0 0 10px currentColor;
                    opacity: ${0.7 + Math.random() * 0.3};
                `;
                
                rain.textContent = characters.charAt(Math.floor(Math.random() * characters.length));
                document.body.appendChild(rain);
                
                let position = -20;
                const speed = 3 + Math.random() * 4;
                const fallInterval = setInterval(() => {
                    position += speed;
                    rain.style.top = position + 'px';
                    
                    // Randomly change character as it falls
                    if (Math.random() < 0.1) {
                        rain.textContent = characters.charAt(Math.floor(Math.random() * characters.length));
                    }
                    
                    if (position > window.innerHeight + 20) {
                        clearInterval(fallInterval);
                        if (rain.parentNode) {
                            rain.parentNode.removeChild(rain);
                        }
                    }
                }, 50);
            }, i * 80);
        }
        
        setTimeout(() => {
            matrixRainActive = false;
        }, 4000);
    }
    
    // Add glitch effect to buttons on hover
    const buttons = document.querySelectorAll('.cyber-btn, .ghost-btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        // Add click effect
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(0) scale(0.98)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
    });
    
    // Forgot password handler
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Password reset protocol initiated. Check your neural interface.', 'success');
            
            // Add brief glow effect to the link
            this.style.textShadow = '0 0 15px #ff00ff';
            setTimeout(() => {
                this.style.textShadow = '';
            }, 500);
        });
    }
    
    // Enhanced particle glitch effect
    function addParticleGlitch() {
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => {
            if (Math.random() < 0.15) { // 15% chance
                const originalColor = window.getComputedStyle(particle).backgroundColor;
                particle.style.transform = `scale(${0.5 + Math.random() * 1.5}) rotate(${Math.random() * 360}deg)`;
                particle.style.backgroundColor = Math.random() > 0.5 ? '#00ffff' : '#ff00ff';
                particle.style.boxShadow = `0 0 ${8 + Math.random() * 10}px currentColor`;
                
                setTimeout(() => {
                    particle.style.transform = 'scale(1) rotate(0deg)';
                    particle.style.backgroundColor = '';
                    particle.style.boxShadow = '';
                }, 300);
            }
        });
    }
    
    // Sakura petal click handler
    let sakuraPetalsClicked = 0;
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('sakura-petal')) {
            handleSakuraPetalClick(e.target);
        }
    });
    
    function handleSakuraPetalClick(petal) {
        // Prevent multiple clicks on the same petal
        if (petal.classList.contains('clicked')) return;
        
        sakuraPetalsClicked++;
        petal.classList.add('clicked');
        
        // Apply the burst animation
        petal.style.animation = 'burst 0.5s forwards';
        
        // Show +1 feedback
        showPetalFeedback(petal);
        
        // Remove the petal after animation completes
        setTimeout(() => {
            if (petal.parentNode) {
                petal.parentNode.removeChild(petal);
            }
        }, 500);
        
        // Show achievement notifications
        if (sakuraPetalsClicked === 10) {
            showNotification("🌸 Sakura Master! You've caught 10 petals!", "achievement");
        } else if (sakuraPetalsClicked === 25) {
            showNotification("🌸 Petal Collector! 25 petals collected!", "achievement");
        }
    }

    function showPetalFeedback(petal) {
        const feedback = document.createElement('div');
        feedback.className = 'petal-feedback';
        feedback.textContent = '+1';
        
        // Position the feedback near the clicked petal
        const rect = petal.getBoundingClientRect();
        feedback.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top}px;
            font-family: 'Press Start 2P', cursive;
            font-size: 16px;
            color: #ff69b4;
            text-shadow: 0 0 10px #ff69b4, 0 0 20px #ff69b4;
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transform: translate(-50%, 0);
            animation: petalFeedback 1s ease-out forwards;
        `;
        
        document.body.appendChild(feedback);
        
        // Remove feedback after animation completes
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1000);
    }
    
    // Dynamic sakura petal spawning for continuous effect
    function spawnRandomSakuraPetal() {
        const sakuraContainer = document.querySelector('.sakura-container');
        if (sakuraContainer) {
            // Spawn fewer petals (2 instead of 3) and make them fall slower
            for (let i = 0; i < 2; i++) {
                const petal = document.createElement('div');
                petal.className = 'sakura-petal dynamic-petal';
                
                const size = 12 + Math.random() * 18; // 12-30px (larger for better clickability)
                const leftPos = Math.random() * 100; // 0-100%
                const duration = 8 + Math.random() * 4; // 8-12s (slower falling)
                const delay = Math.random() * 2; // 0-2s delay
                
                petal.style.cssText = `
                    width: ${size}px;
                    height: ${size}px;
                    left: ${leftPos}%;
                    animation: sakuraFallSway${Math.floor(Math.random() * 3) + 1} ${duration}s linear infinite;
                    animation-delay: ${delay}s;
                `;
                
                sakuraContainer.appendChild(petal);
                
                // Remove petal after animation completes
                setTimeout(() => {
                    if (petal.parentNode) {
                        petal.parentNode.removeChild(petal);
                    }
                }, (duration + delay) * 1000);
            }
        }
    }
    
    // Run particle glitch effect every 3 seconds
    setInterval(addParticleGlitch, 3000);
    
    // Spawn random sakura petals every 2.5 seconds
    setInterval(spawnRandomSakuraPetal, 2500);
    
    // Enhanced screen flicker effect
    function screenFlicker() {
        if (Math.random() < 0.08) { // 8% chance
            const intensity = 1.1 + Math.random() * 0.2;
            document.body.style.filter = `brightness(${intensity}) contrast(${intensity}) saturate(1.2)`;
            setTimeout(() => {
                document.body.style.filter = 'brightness(1) contrast(1) saturate(1)';
            }, 120);
        }
    }
    
    // Run screen flicker every 4 seconds
    setInterval(screenFlicker, 4000);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Alt + S for Sign Up
        if (e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (!isTransitioning) {
                switchToSignUp();
            }
        }
        // Alt + I for Sign In
        if (e.altKey && e.key.toLowerCase() === 'i') {
            e.preventDefault();
            if (!isTransitioning) {
                switchToSignIn();
            }
        }
        // Alt + M for Matrix Rain
        if (e.altKey && e.key.toLowerCase() === 'm') {
            e.preventDefault();
            if (!matrixRainActive) {
                createMatrixRain();
            }
        }
    });
    
    // Add performance monitoring for smooth animations
    let lastFrameTime = performance.now();
    function monitorPerformance() {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        // If frame rate drops below 30fps, reduce effects
        if (deltaTime > 33.33) {
            document.body.style.willChange = 'auto';
        } else {
            document.body.style.willChange = 'filter';
        }
        
        requestAnimationFrame(monitorPerformance);
    }
    
    requestAnimationFrame(monitorPerformance);
    
    // Initialize
    console.log('🔮 Rootrix Crew Access Portal ');
    console.log('🌸 Sakura petals system activated');
    console.log('🎮 Keyboard shortcuts: Alt+S (Sign Up), Alt+I (Sign In), Alt+M (Matrix Rain)');
});