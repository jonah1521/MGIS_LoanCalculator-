/**
 * FinCalc Pro - Business Loan Calculator
 * MGIS 130 Three-Layer Architecture Implementation
 */

// ==========================================
// 1. DATA LAYER (Storage & State Management)
// ==========================================
const DataLayer = {
  STORAGE_KEY: 'mgis130_loan_calc_data',

  // Default state values
  defaults: {
    loanAmount: 250000,
    interestRate: 6.5,
    loanTermYears: 5
  },

  // Save current values to localStorage
  saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  },

  // Load saved values from localStorage or return defaults
  loadData() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : { ...this.defaults };
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
      return { ...this.defaults };
    }
  }
};

// ==========================================
// 2. PROCESSING LAYER (Business Logic)
// ==========================================
const ProcessingLayer = {
  /**
   * Calculate monthly payment for a loan
   * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
   */
  calculateMonthlyPayment(principal, annualRatePct, years) {
    if (principal <= 0 || years <= 0) return 0;
    
    // Handle 0% interest rate special case
    if (annualRatePct <= 0) {
      return principal / (years * 12);
    }

    const monthlyRate = (annualRatePct / 100) / 12;
    const totalPayments = years * 12;

    const payment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
      (Math.pow(1 + monthlyRate, totalPayments) - 1);

    return isNaN(payment) || !isFinite(payment) ? 0 : payment;
  },

  /**
   * Generate complete financial summary
   */
  calculateLoanSummary(principal, annualRatePct, years) {
    const monthlyPayment = this.calculateMonthlyPayment(principal, annualRatePct, years);
    const totalPaymentsCount = years * 12;
    const totalRepayment = monthlyPayment * totalPaymentsCount;
    const totalInterest = Math.max(0, totalRepayment - principal);

    return {
      monthlyPayment,
      totalInterest,
      totalRepayment,
      principalPct: totalRepayment > 0 ? (principal / totalRepayment) * 100 : 100,
      interestPct: totalRepayment > 0 ? (totalInterest / totalRepayment) * 100 : 0
    };
  },

  /**
   * Generate 12-month amortization schedule breakdown
   */
  generateAmortizationSchedule(principal, annualRatePct, years) {
    const schedule = [];
    const monthlyPayment = this.calculateMonthlyPayment(principal, annualRatePct, years);
    const monthlyRate = (annualRatePct / 100) / 12;
    let balance = principal;

    const displayMonths = Math.min(12, years * 12);

    for (let month = 1; month <= displayMonths; month++) {
      const interestForMonth = balance * monthlyRate;
      const principalForMonth = monthlyPayment - interestForMonth;
      balance = Math.max(0, balance - principalForMonth);

      schedule.push({
        month,
        payment: monthlyPayment,
        principalPaid: principalForMonth,
        interestPaid: interestForMonth,
        remainingBalance: balance
      });
    }

    return schedule;
  },

  // Currency Formatter
  formatCurrency(val) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(val || 0);
  }
};

// ==========================================
// 3. USER INTERFACE LAYER (Presentation)
// ==========================================
const UILayer = {
  init() {
    // Inject dynamic HTML layout into root container
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    appContainer.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <!-- LEFT COLUMN: INPUT CONTROLS -->
          <div class="lg:col-span-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-slate-800">Loan Parameters</h2>
              <button id="resetBtn" class="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                Reset Defaults
              </button>
            </div>

            <!-- Loan Amount -->
            <div class="mb-6">
              <div class="flex justify-between items-center mb-2">
                <label for="amountInput" class="text-sm font-medium text-slate-700">Loan Amount ($)</label>
                <input type="number" id="amountInput" class="w-32 px-3 py-1.5 border border-slate-300 rounded-md text-right font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" min="1000" max="2000000" step="5000">
              </div>
              <input type="range" id="amountRange" class="w-full" min="1000" max="2000000" step="5000">
              <div class="flex justify-between text-xs text-slate-400 mt-1">
                <span>$1,000</span>
                <span>$2,000,000</span>
              </div>
            </div>

            <!-- Interest Rate -->
            <div class="mb-6">
              <div class="flex justify-between items-center mb-2">
                <label for="rateInput" class="text-sm font-medium text-slate-700">Annual Interest Rate (%)</label>
                <input type="number" id="rateInput" class="w-24 px-3 py-1.5 border border-slate-300 rounded-md text-right font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" min="0" max="25" step="0.1">
              </div>
              <input type="range" id="rateRange" class="w-full" min="0" max="25" step="0.1">
              <div class="flex justify-between text-xs text-slate-400 mt-1">
                <span>0%</span>
                <span>25%</span>
              </div>
            </div>

            <!-- Loan Term -->
            <div class="mb-6">
              <div class="flex justify-between items-center mb-2">
                <label for="termInput" class="text-sm font-medium text-slate-700">Loan Term (Years)</label>
                <input type="number" id="termInput" class="w-20 px-3 py-1.5 border border-slate-300 rounded-md text-right font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" min="1" max="30" step="1">
              </div>
              <input type="range" id="termRange" class="w-full" min="1" max="30" step="1">
              <div class="flex justify-between text-xs text-slate-400 mt-1">
                <span>1 Year</span>
                <span>30 Years</span>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: RESULTS & BREAKDOWN -->
          <div class="lg:col-span-6 space-y-6">
            
            <!-- Payment Card -->
            <div class="bg-blue-900 text-white rounded-xl shadow-md p-6 sm:p-8">
              <span class="text-xs uppercase tracking-wider text-blue-300 font-semibold">Estimated Monthly Payment</span>
              <div id="monthlyPaymentDisplay" class="text-4xl sm:text-5xl font-extrabold mt-2 text-white">$0.00</div>
            </div>

            <!-- Summary Breakdown -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <h3 class="text-lg font-bold text-slate-800 mb-4">Payment Summary</h3>
              
              <!-- Progress Bar -->
              <div class="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex mb-4">
                <div id="principalBar" class="bg-blue-600 h-full transition-all duration-300" style="width: 50%"></div>
                <div id="interestBar" class="bg-amber-500 h-full transition-all duration-300" style="width: 50%"></div>
              </div>

              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="border-l-4 border-blue-600 pl-3">
                  <span class="text-slate-500 text-xs block">Principal Amount</span>
                  <span id="principalDisplay" class="font-bold text-slate-800 text-base">$0.00</span>
                </div>
                <div class="border-l-4 border-amber-500 pl-3">
                  <span class="text-slate-500 text-xs block">Total Interest</span>
                  <span id="interestDisplay" class="font-bold text-slate-800 text-base">$0.00</span>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                <span class="font-medium text-slate-600">Total Repayment Amount:</span>
                <span id="totalRepaymentDisplay" class="font-extrabold text-slate-900 text-lg">$0.00</span>
              </div>
            </div>

          </div>
        </div>

        <!-- AMORTIZATION TABLE SECTION -->
        <div class="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h3 class="text-lg font-bold text-slate-800 mb-4">First Year Amortization Schedule</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-200 text-xs uppercase text-slate-400 font-semibold">
                  <th class="py-3 px-2">Month</th>
                  <th class="py-3 px-2">Payment</th>
                  <th class="py-3 px-2">Principal</th>
                  <th class="py-3 px-2">Interest</th>
                  <th class="py-3 px-2 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody id="scheduleTableBody" class="text-sm divide-y divide-slate-100">
                <!-- Dynamic rows -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.loadInitialState();
  },

  loadInitialState() {
    const data = DataLayer.loadData();
    this.updateInputs(data);
    this.calculateAndUpdate(data);
  },

  updateInputs(data) {
    document.getElementById('amountInput').value = data.loanAmount;
    document.getElementById('amountRange').value = data.loanAmount;
    document.getElementById('rateInput').value = data.interestRate;
    document.getElementById('rateRange').value = data.interestRate;
    document.getElementById('termInput').value = data.loanTermYears;
    document.getElementById('termRange').value = data.loanTermYears;
  },

  getInputs() {
    return {
      loanAmount: parseFloat(document.getElementById('amountInput').value) || 0,
      interestRate: parseFloat(document.getElementById('rateInput').value) || 0,
      loanTermYears: parseFloat(document.getElementById('termInput').value) || 0
    };
  },

  calculateAndUpdate(data) {
    const inputs = data || this.getInputs();
    
    // Process calculation
    const summary = ProcessingLayer.calculateLoanSummary(
      inputs.loanAmount,
      inputs.interestRate,
      inputs.loanTermYears
    );

    const schedule = ProcessingLayer.generateAmortizationSchedule(
      inputs.loanAmount,
      inputs.interestRate,
      inputs.loanTermYears
    );

    // Save state to Data Layer
    DataLayer.saveData(inputs);

    // Render UI updates
    document.getElementById('monthlyPaymentDisplay').textContent = ProcessingLayer.formatCurrency(summary.monthlyPayment);
    document.getElementById('principalDisplay').textContent = ProcessingLayer.formatCurrency(inputs.loanAmount);
    document.getElementById('interestDisplay').textContent = ProcessingLayer.formatCurrency(summary.totalInterest);
    document.getElementById('totalRepaymentDisplay').textContent = ProcessingLayer.formatCurrency(summary.totalRepayment);

    document.getElementById('principalBar').style.width = `${summary.principalPct}%`;
    document.getElementById('interestBar').style.width = `${summary.interestPct}%`;

    // Render Amortization Table
    const tableBody = document.getElementById('scheduleTableBody');
    tableBody.innerHTML = schedule.map(row => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-2.5 px-2 font-medium text-slate-700">Month ${row.month}</td>
        <td class="py-2.5 px-2 text-slate-600">${ProcessingLayer.formatCurrency(row.payment)}</td>
        <td class="py-2.5 px-2 text-blue-600 font-medium">${ProcessingLayer.formatCurrency(row.principalPaid)}</td>
        <td class="py-2.5 px-2 text-amber-600 font-medium">${ProcessingLayer.formatCurrency(row.interestPaid)}</td>
        <td class="py-2.5 px-2 text-right font-semibold text-slate-800">${ProcessingLayer.formatCurrency(row.remainingBalance)}</td>
      </tr>
    `).join('');
  },

  bindEvents() {
    const syncPair = (inputId, rangeId, key) => {
      const input = document.getElementById(inputId);
      const range = document.getElementById(rangeId);

      const handleUpdate = (val) => {
        input.value = val;
        range.value = val;
        this.calculateAndUpdate();
      };

      input.addEventListener('input', (e) => handleUpdate(e.target.value));
      range.addEventListener('input', (e) => handleUpdate(e.target.value));
    };

    syncPair('amountInput', 'amountRange', 'loanAmount');
    syncPair('rateInput', 'rateRange', 'interestRate');
    syncPair('termInput', 'termRange', 'loanTermYears');

    document.getElementById('resetBtn').addEventListener('click', () => {
      DataLayer.saveData(DataLayer.defaults);
      this.updateInputs(DataLayer.defaults);
      this.calculateAndUpdate(DataLayer.defaults);
    });
  }
};

// Initialize Application once DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => UILayer.init());
