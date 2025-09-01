/**
 * Multi-step Registration Form Handler
 * Barangay Commonwealth Portal
 */

class RegistrationForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.form = document.getElementById('registrationForm');
        this.steps = document.querySelectorAll('.form-step');
        this.progressFill = document.getElementById('progressFill');
        this.progressSteps = document.querySelectorAll('.step');
        this.nextBtn = document.getElementById('nextBtn');
        this.prevBtn = document.getElementById('prevBtn');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFloatingLabels();
        this.updateUI();
    }

    setupEventListeners() {
        // Navigation buttons
        this.nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleNext();
        });

        this.prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handlePrevious();
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Input validation on blur
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Special handling for extension dropdown
        const extensionSelect = document.getElementById('extension');
        const extensionOther = document.getElementById('extensionOther');
        
        if (extensionSelect && extensionOther) {
            extensionSelect.addEventListener('change', () => {
                if (extensionSelect.value === 'Other') {
                    extensionOther.style.display = 'block';
                    extensionOther.required = true;
                } else {
                    extensionOther.style.display = 'none';
                    extensionOther.required = false;
                    extensionOther.value = '';
                }
            });
        }
    }

    setupFloatingLabels() {
        // Initialize floating labels for inputs that might have values
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            // Trigger label float for inputs with values
            if (input.value || input.type === 'date') {
                input.classList.add('has-value');
            }

            // Add placeholder for proper :placeholder-shown behavior
            if (input.type !== 'checkbox' && input.type !== 'radio' && !input.placeholder) {
                input.placeholder = ' ';
            }
        });
    }

    handleNext() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateUI();
            }
        }
    }

    handlePrevious() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateUI();
        }
    }

    validateCurrentStep() {
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;
        let firstInvalidField = null;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
                if (!firstInvalidField) {
                    firstInvalidField = field;
                }
            }
        });

        // Focus first invalid field
        if (firstInvalidField) {
            firstInvalidField.focus();
            this.showFieldError(firstInvalidField, 'This field is required');
        }

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        // Clear previous errors
        this.clearFieldError(field);

        // Required field validation
        if (field.required && !value) {
            isValid = false;
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid email address');
                isValid = false;
            }
        }

        // Phone validation (basic)
        if (field.type === 'tel' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(value) || value.length < 10) {
                this.showFieldError(field, 'Please enter a valid phone number');
                isValid = false;
            }
        }

        // Date validation (must be 18 or older)
        if (field.type === 'date' && field.id === 'birthDate' && value) {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            if (age < 18) {
                this.showFieldError(field, 'You must be at least 18 years old to register');
                isValid = false;
            }
        }

        // ZIP code validation (Philippine format)
        if (field.id === 'zipCode' && value) {
            const zipRegex = /^\d{4}$/;
            if (!zipRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid 4-digit ZIP code');
                isValid = false;
            }
        }

        return isValid;
    }

    showFieldError(field, message) {
        const inputGroup = field.closest('.input-group') || field.closest('.checkbox-group');
        if (!inputGroup) return;

        // Remove existing error
        const existingError = inputGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error styling
        field.classList.add('error');

        // Create and add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #e74c3c;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: block;
        `;
        inputGroup.appendChild(errorElement);
    }

    clearFieldError(field) {
        const inputGroup = field.closest('.input-group') || field.closest('.checkbox-group');
        if (!inputGroup) return;

        field.classList.remove('error');
        const errorElement = inputGroup.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    updateUI() {
        // Update step visibility
        this.steps.forEach((step, index) => {
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Update progress bar
        const progress = (this.currentStep / this.totalSteps) * 100;
        this.progressFill.style.width = `${progress}%`;

        // Update progress steps
        this.progressSteps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            }
        });

        // Update navigation buttons
        this.prevBtn.style.display = this.currentStep === 1 ? 'none' : 'flex';
        
        if (this.currentStep === this.totalSteps) {
            this.nextBtn.innerHTML = '<span>Submit Registration</span>';
            this.nextBtn.onclick = (e) => {
                e.preventDefault();
                this.handleSubmit();
            };
        } else {
            this.nextBtn.innerHTML = '<span>Next →</span>';
            this.nextBtn.onclick = (e) => {
                e.preventDefault();
                this.handleNext();
            };
        }

        // Scroll to top of form
        document.querySelector('.registration-container').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    async handleSubmit() {
        // Validate all steps
        let allValid = true;
        for (let step = 1; step <= this.totalSteps; step++) {
            const stepElement = document.getElementById(`step${step}`);
            const requiredFields = stepElement.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!this.validateField(field)) {
                    allValid = false;
                }
            });
        }

        if (!allValid) {
            this.showAlert('Please correct the errors in the form before submitting.', 'error');
            // Go back to first step with errors
            for (let step = 1; step <= this.totalSteps; step++) {
                const stepElement = document.getElementById(`step${step}`);
                if (stepElement.querySelector('.error')) {
                    this.currentStep = step;
                    this.updateUI();
                    break;
                }
            }
            return;
        }

        // Disable submit button and show loading
        this.nextBtn.disabled = true;
        this.nextBtn.innerHTML = '<span>Submitting...</span>';

        try {
            // Simulate API call with timeout
            await this.simulateSubmission();
            
            // Show success message
            this.showAlert('Registration successful! Welcome to Barangay Commonwealth Portal.', 'success');
            
            // Optional: Reset form or redirect
            setTimeout(() => {
                // In a real app, you might redirect to login page or dashboard
                // window.location.href = '/login.html';
                this.resetForm();
            }, 3000);
            
        } catch (error) {
            this.showAlert('Registration failed. Please try again.', 'error');
        } finally {
            this.nextBtn.disabled = false;
            this.nextBtn.innerHTML = '<span>Submit Registration</span>';
        }
    }

    simulateSubmission() {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                // Simulate 95% success rate
                if (Math.random() > 0.05) {
                    resolve({ success: true, message: 'Registration successful' });
                } else {
                    reject(new Error('Network error'));
                }
            }, 2000);
        });
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
                <span class="alert-message">${message}</span>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add alert styles
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        // Add CSS for alert animation
        if (!document.querySelector('#alert-styles')) {
            const style = document.createElement('style');
            style.id = 'alert-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .alert-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .alert-icon {
                    font-weight: bold;
                    font-size: 1.2rem;
                }
                .alert-message {
                    flex: 1;
                }
                .alert-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(alert);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    resetForm() {
        this.form.reset();
        this.currentStep = 1;
        this.updateUI();
        
        // Clear all errors
        const errorElements = this.form.querySelectorAll('.field-error');
        errorElements.forEach(error => error.remove());
        
        const errorFields = this.form.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }

    // Public method to get form data
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
}

// Initialize the registration form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RegistrationForm();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegistrationForm;
}