// House Affordability Calculator
class AffordabilityCalculator {
    constructor() {
        this.form = document.getElementById('affordability-form');
        this.resetBtn = document.getElementById('reset-btn');
        this.resultsSection = document.getElementById('results');
        this.userHasInteracted = false;
        
        this.initializeEventListeners();
        this.setDefaultValues();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.resetBtn.addEventListener('click', () => this.resetForm());
        
        // Real-time calculation on input change
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.userHasInteracted = true;
                console.log(`Input event: ${input.id} = "${input.value}"`);
                // Temporarily disable real-time calculation to test
                // this.debounceCalculate();
            });
            
            // Add number formatting
            if (input.type === 'number') {
                input.addEventListener('blur', (e) => {
                    console.log(`Blur event: ${e.target.id} = "${e.target.value}"`);
                    // Only format if there's a valid value
                    if (e.target.value && e.target.value.trim() !== '') {
                        const value = parseFloat(e.target.value.replace(/,/g, ''));
                        if (!isNaN(value) && value > 0) {
                            // Format large numbers with commas
                            if (value >= 1000) {
                                e.target.value = value.toLocaleString();
                                console.log(`Formatted ${e.target.id} to: "${e.target.value}"`);
                            }
                        }
                    }
                });
                
                input.addEventListener('focus', (e) => {
                    // Remove commas when focusing for easier editing
                    if (e.target.value) {
                        e.target.value = e.target.value.replace(/,/g, '');
                    }
                });
            }
        });
    }

    setDefaultValues() {
        // Only set default values if user hasn't interacted with the form yet
        if (this.userHasInteracted) {
            console.log('setDefaultValues: User has interacted, skipping defaults');
            return;
        }
        console.log('setDefaultValues: Setting default values - this should NOT happen after user types!');
        
        const fields = {
            'gross-income': '75000',
            'monthly-debts': '500',
            'down-payment-percent': '20',
            'interest-rate': '7.5',
            'loan-term': '30',
            'property-tax-rate': '1.2',
            'insurance-annual': '1200'
        };
        
        Object.entries(fields).forEach(([id, defaultValue]) => {
            const element = document.getElementById(id);
            if (!element.value || element.value === '') {
                element.value = defaultValue;
            }
        });
    }

    debounceCalculate() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            if (this.isFormValid()) {
                this.calculateAffordability();
            }
        }, 500);
    }

    handleSubmit(e) {
        e.preventDefault();
        
        if (!this.isFormValid()) {
            this.showValidationErrors();
            return;
        }
        
        this.calculateAffordability();
    }

    isFormValid() {
        const inputs = this.form.querySelectorAll('input[required], input');
        let isValid = true;
        
        inputs.forEach(input => {
            const value = parseFloat(input.value);
            if (isNaN(value) || value < 0) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    showValidationErrors() {
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            const value = parseFloat(input.value);
            const wrapper = input.closest('.input-wrapper');
            
            if (isNaN(value) || value < 0) {
                wrapper.classList.add('error');
                this.showErrorMessage(input, 'Please enter a valid positive number');
            } else {
                wrapper.classList.remove('error');
                this.hideErrorMessage(input);
            }
        });
    }

    showErrorMessage(input, message) {
        this.hideErrorMessage(input);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.parentNode.appendChild(errorDiv);
    }

    hideErrorMessage(input) {
        const existingError = input.parentNode.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    getFormData() {
        return {
            grossIncome: parseFloat(document.getElementById('gross-income').value) || 0,
            monthlyDebts: parseFloat(document.getElementById('monthly-debts').value) || 0,
            downPaymentPercent: parseFloat(document.getElementById('down-payment-percent').value) || 0,
            interestRate: parseFloat(document.getElementById('interest-rate').value) || 0,
            loanTerm: parseFloat(document.getElementById('loan-term').value) || 0,
            propertyTaxRate: parseFloat(document.getElementById('property-tax-rate').value) || 0,
            insuranceAnnual: parseFloat(document.getElementById('insurance-annual').value) || 0
        };
    }

    calculateAffordability() {
        const data = this.getFormData();
        
        if (data.grossIncome === 0 || data.interestRate === 0 || data.loanTerm === 0) {
            return;
        }

        // Calculate monthly income
        const monthlyIncome = data.grossIncome / 12;
        
        // Calculate maximum monthly housing payment (28% rule)
        const maxHousingPayment = monthlyIncome * 0.28;
        
        // Calculate maximum total debt payment (36% rule)
        const maxTotalDebtPayment = monthlyIncome * 0.36;
        const maxMortgagePayment = maxTotalDebtPayment - data.monthlyDebts;
        
        // Use the more restrictive limit
        const maxMonthlyPayment = Math.min(maxHousingPayment, maxMortgagePayment);
        
        if (maxMonthlyPayment <= 0) {
            this.showError('Your monthly debt payments are too high for a mortgage.');
            return;
        }

        // Calculate property tax and insurance components
        const monthlyInsurance = data.insuranceAnnual / 12;
        
        // Calculate maximum principal and interest payment
        const maxPrincipalInterest = maxMonthlyPayment - monthlyInsurance;
        
        // Calculate maximum loan amount using mortgage formula
        const monthlyRate = data.interestRate / 100 / 12;
        const numPayments = data.loanTerm * 12;
        
        let maxLoanAmount = 0;
        if (monthlyRate > 0) {
            maxLoanAmount = maxPrincipalInterest * ((Math.pow(1 + monthlyRate, numPayments) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, numPayments)));
        } else {
            maxLoanAmount = maxPrincipalInterest * numPayments;
        }
        
        // Calculate maximum home price
        const downPaymentPercent = data.downPaymentPercent / 100;
        const maxHomePrice = maxLoanAmount / (1 - downPaymentPercent);
        
        // Calculate actual monthly payment for the max home price
        const actualLoanAmount = maxHomePrice * (1 - downPaymentPercent);
        const actualPrincipalInterest = this.calculateMonthlyPayment(actualLoanAmount, data.interestRate, data.loanTerm);
        const actualPropertyTax = (maxHomePrice * data.propertyTaxRate / 100) / 12;
        const actualInsurance = data.insuranceAnnual / 12;
        const actualTotalPayment = actualPrincipalInterest + actualPropertyTax + actualInsurance;
        
        // Calculate affordability metrics
        const dtiRatio = ((data.monthlyDebts + actualTotalPayment) / monthlyIncome) * 100;
        const housingRatio = (actualTotalPayment / monthlyIncome) * 100;
        
        // Display results
        this.displayResults({
            maxHomePrice,
            maxLoanAmount: actualLoanAmount,
            downPaymentAmount: maxHomePrice * downPaymentPercent,
            principalInterest: actualPrincipalInterest,
            propertyTaxes: actualPropertyTax,
            homeInsurance: actualInsurance,
            totalMonthlyPayment: actualTotalPayment,
            dtiRatio,
            housingRatio
        });
    }

    calculateMonthlyPayment(principal, annualRate, years) {
        const monthlyRate = annualRate / 100 / 12;
        const numPayments = years * 12;
        
        if (monthlyRate === 0) {
            return principal / numPayments;
        }
        
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
               (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    displayResults(results) {
        // Update result values
        document.getElementById('max-home-price').textContent = this.formatCurrency(results.maxHomePrice);
        document.getElementById('max-loan-amount').textContent = this.formatCurrency(results.maxLoanAmount);
        document.getElementById('down-payment-amount').textContent = this.formatCurrency(results.downPaymentAmount);
        document.getElementById('principal-interest').textContent = this.formatCurrency(results.principalInterest);
        document.getElementById('property-taxes').textContent = this.formatCurrency(results.propertyTaxes);
        document.getElementById('home-insurance').textContent = this.formatCurrency(results.homeInsurance);
        document.getElementById('total-monthly-payment').textContent = this.formatCurrency(results.totalMonthlyPayment);
        document.getElementById('dti-ratio').textContent = this.formatPercentage(results.dtiRatio);
        document.getElementById('housing-ratio').textContent = this.formatPercentage(results.housingRatio);
        
        // Update guideline status
        const housingGuideline = document.getElementById('housing-guideline');
        const dtiGuideline = document.getElementById('dti-guideline');
        
        housingGuideline.textContent = results.housingRatio <= 28 ? '✓' : '✗';
        housingGuideline.style.color = results.housingRatio <= 28 ? '#22c55e' : '#ef4444';
        
        dtiGuideline.textContent = results.dtiRatio <= 36 ? '✓' : '✗';
        dtiGuideline.style.color = results.dtiRatio <= 36 ? '#22c55e' : '#ef4444';
        
        // Show results section
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatPercentage(value) {
        return `${value.toFixed(1)}%`;
    }

    showError(message) {
        // Create error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #fee2e2;
            border: 2px solid #ef4444;
            color: #dc2626;
            padding: 16px;
            border-radius: 8px;
            margin: 16px 0;
            font-weight: 500;
            text-align: center;
        `;
        errorDiv.textContent = message;
        
        // Insert before results section
        this.resultsSection.parentNode.insertBefore(errorDiv, this.resultsSection);
        
        // Hide results
        this.resultsSection.style.display = 'none';
        
        // Remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    resetForm() {
        this.form.reset();
        this.userHasInteracted = false; // Reset the interaction flag
        this.setDefaultValues();
        this.resultsSection.style.display = 'none';
        
        // Clear any error states
        const errorWrappers = this.form.querySelectorAll('.input-wrapper.error');
        errorWrappers.forEach(wrapper => wrapper.classList.remove('error'));
        
        const errorMessages = this.form.querySelectorAll('.error-message');
        errorMessages.forEach(message => message.remove());
        
        // Clear any error displays
        const errorDisplays = document.querySelectorAll('.error-message');
        errorDisplays.forEach(display => {
            if (display.style.background === 'rgb(254, 226, 226)') {
                display.remove();
            }
        });
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AffordabilityCalculator();
});

// Add some utility functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'Enter':
                    e.preventDefault();
                    document.getElementById('affordability-form').dispatchEvent(new Event('submit'));
                    break;
                case 'r':
                    e.preventDefault();
                    document.getElementById('reset-btn').click();
                    break;
            }
        }
    });
    
    // Add touch-friendly interactions for mobile
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        // Increase touch targets
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.minHeight = '44px';
            button.style.minWidth = '44px';
        });
        
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.style.minHeight = '44px';
        });
    }
});
