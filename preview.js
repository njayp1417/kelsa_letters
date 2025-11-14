// Kelsa Letter Preview - Enhanced JavaScript

class LetterPreview {
    constructor() {
        this.currentZoom = 1.0;
        this.letterData = null;
        
        this.init();
    }

    init() {
        this.loadLetterData();
        this.populatePreview();
        this.setupEventListeners();
    }

    loadLetterData() {
        const savedData = localStorage.getItem('kelsa_letter_data');
        if (savedData) {
            try {
                this.letterData = JSON.parse(savedData);
            } catch (error) {
                console.error('Error loading letter data:', error);
                this.showError('Failed to load letter data. Please go back and try again.');
                return;
            }
        } else {
            this.showError('No letter data found. Please fill out the form first.');
            return;
        }
    }

    populatePreview() {
        if (!this.letterData) return;

        // Format and display date
        const dateElement = document.getElementById('letterDate');
        if (this.letterData.letterDate) {
            const date = new Date(this.letterData.letterDate);
            dateElement.textContent = this.formatDate(date);
        }

        // Display reference if provided
        const referenceElement = document.getElementById('letterReference');
        if (this.letterData.reference) {
            referenceElement.textContent = `Ref: ${this.letterData.reference}`;
        } else {
            referenceElement.style.display = 'none';
        }

        // Recipient information
        document.getElementById('recipientName').textContent = this.letterData.recipientName || '';
        
        const recipientTitle = document.getElementById('recipientTitle');
        if (this.letterData.recipientTitle) {
            recipientTitle.textContent = this.letterData.recipientTitle;
        } else {
            recipientTitle.style.display = 'none';
        }
        
        document.getElementById('recipientAddress').textContent = this.letterData.recipientAddress || '';

        // Subject
        document.getElementById('letterSubject').textContent = this.letterData.subject || '';

        // Salutation
        document.getElementById('letterSalutation').textContent = this.letterData.salutation || 'Dear Sir/Madam,';

        // Letter body
        document.getElementById('letterBody').textContent = this.letterData.letterBody || '';

        // Closing
        document.getElementById('letterClosing').textContent = this.letterData.closing || 'Yours faithfully,';

        // Signatory and signature
        const signatoryElement = document.getElementById('signatoryName');
        const signatureImage = document.querySelector('.signature-img');
        
        if (this.letterData.signatory) {
            signatoryElement.textContent = this.letterData.signatory;
            // Show signature image if signatory name is provided
            if (signatureImage) {
                signatureImage.style.display = 'block';
            }
        } else {
            signatoryElement.textContent = 'Management';
            // Still show signature image for management
            if (signatureImage) {
                signatureImage.style.display = 'block';
            }
        }
    }

    formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }

    setupEventListeners() {
        // Handle browser back button
        window.addEventListener('popstate', () => {
            window.location.href = 'index.html';
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.generatePDF();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.editLetter();
                        break;
                    case '=':
                    case '+':
                        e.preventDefault();
                        this.adjustZoom(0.1);
                        break;
                    case '-':
                        e.preventDefault();
                        this.adjustZoom(-0.1);
                        break;
                }
            }
        });
    }

    adjustZoom(delta) {
        this.currentZoom = Math.max(0.5, Math.min(2.0, this.currentZoom + delta));
        
        const container = document.getElementById('letterContainer');
        const zoomLevel = document.querySelector('.zoom-level');
        
        // Remove existing zoom classes
        container.className = container.className.replace(/zoom-\d+/g, '');
        
        // Apply new zoom
        if (this.currentZoom !== 1.0) {
            const zoomPercent = Math.round(this.currentZoom * 100);
            container.style.transform = `scale(${this.currentZoom})`;
        } else {
            container.style.transform = '';
        }
        
        // Update zoom display
        zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
    }

    editLetter() {
        if (confirm('Do you want to edit this letter? Any unsaved changes will be preserved.')) {
            window.location.href = 'index.html';
        }
    }

    async generatePDF() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.classList.add('show');

        try {
            // Get the letter page element
            const letterPage = document.getElementById('letterPage');
            
            // Temporarily adjust styles for better PDF rendering
            const originalStyles = this.preparePDFStyles(letterPage);
            
            // Generate canvas from HTML
            const canvas = await html2canvas(letterPage, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: letterPage.offsetWidth,
                height: letterPage.offsetHeight,
                scrollX: 0,
                scrollY: 0
            });

            // Restore original styles
            this.restoreStyles(letterPage, originalStyles);

            // Create PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Calculate dimensions
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Add image to PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            // Generate filename
            const filename = this.generateFilename();
            
            // Download PDF
            pdf.save(filename);
            
            this.showSuccess('PDF generated successfully!');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showError('Failed to generate PDF. Please try again.');
        } finally {
            loadingOverlay.classList.remove('show');
        }
    }

    preparePDFStyles(element) {
        const originalStyles = {
            boxShadow: element.style.boxShadow,
            borderRadius: element.style.borderRadius,
            transform: element.style.transform
        };

        // Remove shadows and transforms for cleaner PDF
        element.style.boxShadow = 'none';
        element.style.borderRadius = '0';
        element.style.transform = 'none';

        return originalStyles;
    }

    restoreStyles(element, originalStyles) {
        Object.keys(originalStyles).forEach(property => {
            element.style[property] = originalStyles[property];
        });
    }

    generateFilename() {
        const date = new Date().toISOString().split('T')[0];
        const subject = this.letterData.subject || 'Letter';
        const cleanSubject = subject.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        return `Kelsa_Letter_${cleanSubject}_${date}.pdf`;
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification
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

        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: ${type === 'error' ? 'var(--error)' : type === 'success' ? 'var(--success)' : 'var(--navy-800)'};
            color: white;
            padding: var(--space-md) var(--space-lg);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // Auto-remove
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

// Global functions for button handlers
function adjustZoom(delta) {
    if (window.letterPreview) {
        window.letterPreview.adjustZoom(delta);
    }
}

function editLetter() {
    if (window.letterPreview) {
        window.letterPreview.editLetter();
    }
}

function generatePDF() {
    if (window.letterPreview) {
        window.letterPreview.generatePDF();
    }
}

// Initialize preview
document.addEventListener('DOMContentLoaded', () => {
    window.letterPreview = new LetterPreview();
    
    // Add smooth entrance animation
    const letterPage = document.getElementById('letterPage');
    letterPage.style.opacity = '0';
    letterPage.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        letterPage.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        letterPage.style.opacity = '1';
        letterPage.style.transform = 'translateY(0)';
    }, 100);
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    // Clear any temporary data if needed
    localStorage.removeItem('kelsa_letter_temp');
});