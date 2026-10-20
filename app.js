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
const monthlyIncomeInput = document.getElementById('monthly-income-input');
const saveIncomeBtn = document.getElementById('save-income-btn');

let chartInstance = null;
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : [];
let monthlyIncome = localStorage.getItem('monthlyIncome') !== null ? parseFloat(localStorage.getItem('monthlyIncome')) : 0;

if (monthlyIncome > 0 && monthlyIncomeInput) {
    monthlyIncomeInput.value = monthlyIncome;
}


if (saveIncomeBtn) {
    saveIncomeBtn.addEventListener('click', () => {
        const incomeValue = parseFloat(monthlyIncomeInput.value);
        
        if (isNaN(incomeValue) || incomeValue < 0) {
            alert('Please enter a valid income amount');
            return;
        }

        monthlyIncome = incomeValue;
        localStorage.setItem('monthlyIncome', monthlyIncome);
        updateValues();
        
        alert('Monthly income saved!');
    });
}

type.addEventListener('change', (e) => {
    if (e.target.value === 'income') {
        categoryContainer.style.display = 'none';
    } else {
        categoryContainer.style.display = 'block';
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a description and amount');
        return;
    }

    const transaction = {
        id: generateID(),
        text: text.value,
        amount: +amount.value,
        type: type.value,
        category: type.value === 'expense' ? category.value : 'Income'
    };

    transactions.push(transaction);

    addTransactionDOM(transaction);
    updateValues();
    updateChart();
    updateLocalStorage();

    text.value = '';
    amount.value = '';
});


function generateID() {
    return Math.floor(Math.random() * 100000000);
}

function addTransactionDOM(transaction) {
    const sign = transaction.type === 'income' ? '+' : '-';
    const item = document.createElement('li');

    item.classList.add(transaction.type === 'income' ? 'plus' : 'minus');

    item.innerHTML = `
        ${transaction.text} <span>${sign}$${Math.abs(transaction.amount).toFixed(2)}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
    `;

    list.appendChild(item);
}

function updateValues() {
    const incomes = transactions.filter(t => t.type === 'income').map(t => t.amount);
    const expenses = transactions.filter(t => t.type === 'expense').map(t => t.amount);

    const transactionIncome = incomes.reduce((acc, item) => (acc += item), 0);
    const totalExpense = expenses.reduce((acc, item) => (acc += item), 0).toFixed(2);
    
    const grandTotalIncome = (transactionIncome + monthlyIncome).toFixed(2);

    const total = (parseFloat(grandTotalIncome) - parseFloat(totalExpense)).toFixed(2);

    balance.innerText = `$${total}`;
    money_plus.innerText = `+$${grandTotalIncome}`;
    money_minus.innerText = `-$${totalExpense}`;
}

function updateChart() {
    const incomes = transactions.filter(t => t.type === 'income').map(t => t.amount);
    const transactionIncome = incomes.reduce((acc, item) => (acc += item), 0);
    const grandTotalIncome = transactionIncome + monthlyIncome;

    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
            acc[transaction.category] = 0;
        }
        acc[transaction.category] += transaction.amount;
        return acc;
    }, {});

    const totalExpense = Object.values(categoryTotals).reduce((acc, item) => acc + item, 0);

    let remainingBudget = grandTotalIncome - totalExpense;
    if (remainingBudget < 0) remainingBudget = 0; 

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    const backgroundColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#e84393'
    ];

    if (grandTotalIncome > 0) {
        labels.push('Remaining Budget');
        data.push(remainingBudget);
        backgroundColors.push('#2ecc71');
    }

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['No Data Yet'],
            datasets: [{
                data: data.length > 0 ? data : [1],
                backgroundColor: backgroundColors,
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

window.removeTransaction = function(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);

    updateLocalStorage();
    init();
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
    updateChart();
}

init();