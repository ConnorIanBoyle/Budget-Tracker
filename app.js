// --- DOM Elements ---
const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const type = document.getElementById('type');
const category = document.getElementById('category');
const categoryContainer = document.getElementById('category-container');
const ctx = document.getElementById('expenseChart').getContext('2d');

// --- Global Variables ---
let chartInstance = null;

// Fetch data from LocalStorage
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// --- Event Listeners ---

// Hide category dropdown if 'Income' is selected (simplifying incomes)
type.addEventListener('change', (e) => {
    if (e.target.value === 'income') {
        categoryContainer.style.display = 'none';
    } else {
        categoryContainer.style.display = 'block';
    }
});

// Add a new transaction
form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a description and amount');
        return;
    }

    const transaction = {
        id: generateID(),
        text: text.value,
        amount: +amount.value, // Convert string to number
        type: type.value,
        category: type.value === 'expense' ? category.value : 'Income'
    };

    transactions.push(transaction);

    addTransactionDOM(transaction);
    updateValues();
    updateChart();
    updateLocalStorage();

    // Reset form inputs
    text.value = '';
    amount.value = '';
});

// --- Core Functions ---

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
    const sign = transaction.type === 'income' ? '+' : '-';
    const item = document.createElement('li');

    // Add class based on type
    item.classList.add(transaction.type === 'income' ? 'plus' : 'minus');

    item.innerHTML = `
        ${transaction.text} <span>${sign}$${Math.abs(transaction.amount).toFixed(2)}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
    `;

    list.appendChild(item);
}

// Update the balance, income and expense (USING REDUCE & FILTER)
function updateValues() {
    // 1. FILTER: Separate incomes and expenses
    const incomes = transactions.filter(t => t.type === 'income').map(t => t.amount);
    const expenses = transactions.filter(t => t.type === 'expense').map(t => t.amount);

    // 2. REDUCE: Calculate totals
    const totalIncome = incomes.reduce((acc, item) => (acc += item), 0).toFixed(2);
    const totalExpense = expenses.reduce((acc, item) => (acc += item), 0).toFixed(2);
    
    // Calculate total balance
    const total = (parseFloat(totalIncome) - parseFloat(totalExpense)).toFixed(2);

    // Update UI
    balance.innerText = `$${total}`;
    money_plus.innerText = `+$${totalIncome}`;
    money_minus.innerText = `-$${totalExpense}`;
}

// Update Chart.js Visualization
function updateChart() {
    // 1. FILTER: We only want to chart expenses
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    // 2. REDUCE: Group expenses by category
    const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
            acc[transaction.category] = 0;
        }
        acc[transaction.category] += transaction.amount;
        return acc;
    }, {});

    // Prepare data for Chart.js
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Destroy existing chart to prevent rendering glitches
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Render new chart
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['No Expenses Yet'],
            datasets: [{
                data: data.length > 0 ? data : [1],
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Remove transaction by ID
window.removeTransaction = function(id) {
    // FILTER: Keep everything except the one we want to delete
    transactions = transactions.filter(transaction => transaction.id !== id);

    updateLocalStorage();
    init(); // Re-render everything
}

// Update local storage
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Initialize App
function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
    updateChart();
}

init();