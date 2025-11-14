// Kelsa Letter Generator - Enhanced JavaScript

class LetterGenerator {
    constructor() {
        this.form = document.getElementById('letterForm');
        this.charCountElement = document.getElementById('charCount');
        this.letterBodyTextarea = document.getElementById('letterBody');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.setupCharacterCounter();
        this.setupFormValidation();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Real-time validation
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Auto-save to localStorage
        inputs.forEach(input => {
            input.addEventListener('input', () => this.autoSave());
        });

        // Load saved data on page load
        this.loadSavedData();
    }

    setDefaultDate() {
        const dateInput = document.getElementById('letterDate');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    setupCharacterCounter() {
        this.letterBodyTextarea.addEventListener('input', () => {
            const count = this.letterBodyTextarea.value.length;
            this.charCountElement.textContent = count.toLocaleString();
            
            // Color coding for character count
            if (count > 2000) {
                this.charCountElement.style.color = 'var(--error)';
            } else if (count > 1500) {
                this.charCountElement.style.color = 'var(--warning)';
            } else {
                this.charCountElement.style.color = 'var(--gray-600)';
            }
        });
    }

    setupFormValidation() {
        // Custom validation messages
        const requiredFields = this.form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('invalid', (e) => {
                e.preventDefault();
                this.showFieldError(field, this.getValidationMessage(field));
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let message = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = `${this.getFieldLabel(field)} is required`;
        }

        // Email validation
        if (fieldName === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            message = 'Please enter a valid email address';
        }

        // Date validation
        if (fieldName === 'letterDate' && value) {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                isValid = false;
                message = 'Date cannot be in the past';
            }
        }

        if (isValid) {
            this.showFieldSuccess(field);
        } else {
            this.showFieldError(field, message);
        }

        return isValid;
    }

    showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.remove('success');
        formGroup.classList.add('error');
        
        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        field.parentNode.appendChild(errorDiv);
    }

    showFieldSuccess(field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
        
        // Remove error message
        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.remove('error');
        
        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    getFieldLabel(field) {
        const label = field.closest('.form-group').querySelector('label');
        return label ? label.textContent.replace('*', '').trim() : field.name;
    }

    getValidationMessage(field) {
        const fieldName = this.getFieldLabel(field);
        return `${fieldName} is required`;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    handleFormSubmit() {
        // Validate all fields
        const inputs = this.form.querySelectorAll('input[required], textarea[required], select[required]');
        let isFormValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showNotification('Please fix the errors above', 'error');
            return;
        }

        // Collect form data
        const formData = this.collectFormData();
        
        // Save to localStorage
        localStorage.setItem('kelsa_letter_data', JSON.stringify(formData));
        
        // Navigate to preview page
        window.location.href = 'preview.html';
    }

    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    autoSave() {
        const formData = this.collectFormData();
        localStorage.setItem('kelsa_letter_draft', JSON.stringify(formData));
    }

    loadSavedData() {
        // Clear all localStorage on page load/refresh
        localStorage.removeItem('kelsa_letter_draft');
        localStorage.removeItem('kelsa_letter_data');
        localStorage.removeItem('kelsa_letter_temp');
    }

    populateForm(data) {
        Object.keys(data).forEach(key => {
            const field = this.form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
                
                // Trigger character counter update for textarea
                if (field.tagName === 'TEXTAREA') {
                    field.dispatchEvent(new Event('input'));
                }
            }
        });
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? 'var(--error)' : type === 'success' ? 'var(--success)' : 'var(--navy-800)'};
            color: white;
            padding: var(--space-md) var(--space-lg);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
}

// Utility Functions
function clearForm() {
    if (confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
        document.getElementById('letterForm').reset();
        
        // Clear localStorage
        localStorage.removeItem('kelsa_letter_draft');
        
        // Reset date to today
        const dateInput = document.getElementById('letterDate');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        
        // Reset character counter
        document.getElementById('charCount').textContent = '0';
        
        // Clear all validation states
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('success', 'error');
            const errorMessage = group.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
        
        // Show success message
        letterGenerator.showNotification('Form cleared successfully', 'success');
    }
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: var(--space-xs);
        margin-left: auto;
        border-radius: var(--radius-sm);
        transition: var(--transition);
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(notificationStyles);

// Initialize the application
let letterGenerator;
document.addEventListener('DOMContentLoaded', () => {
    // Clear localStorage on every page load
    localStorage.clear();
    
    letterGenerator = new LetterGenerator();
    
    // Add smooth animations
    const elements = document.querySelectorAll('.form-section, .hero-content, .hero-visual');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Clear localStorage on page refresh/reload
window.addEventListener('beforeunload', () => {
    localStorage.clear();
});

// Handle beforeunload for unsaved changes
window.addEventListener('beforeunload', (e) => {
    const draft = localStorage.getItem('kelsa_letter_draft');
    const saved = localStorage.getItem('kelsa_letter_data');
    
    if (draft && draft !== saved) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
});