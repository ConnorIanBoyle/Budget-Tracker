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
    // 1. Calculate Grand Total Income
    const incomes = transactions.filter(t => t.type === 'income').map(t => t.amount);
    const transactionIncome = incomes.reduce((acc, item) => (acc += item), 0);
    const grandTotalIncome = transactionIncome + monthlyIncome;

    // 2. Map categories to 50/30/20 groups
    const ruleMapping = {
        'Rent': { group: 1, border: '#3498db' }, // Needs
        'Utilities': { group: 1, border: '#3498db' }, // Needs
        'Food': { group: 1, border: '#3498db' }, // Needs
        'Transport': { group: 1, border: '#3498db' }, // Needs
        'Entertainment': { group: 2, border: '#e74c3c' }, // Wants
        'Drinks': { group: 2, border: '#e74c3c' }, // Wants
        'Other': { group: 2, border: '#e74c3c' }, // Wants
        'Company Tax & Investments': { group: 3, border: '#f1c40f' } // Savings
    };

    const fillColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#e84393', '#8e44ad'];

    // 3. Filter and Group expenses by category
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    let ruleTotals = { 1: 0, 2: 0, 3: 0 }; 

    const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
        if (!acc[transaction.category]) acc[transaction.category] = 0;
        acc[transaction.category] += transaction.amount;
        
        // Add to the specific rule group
        const groupNum = ruleMapping[transaction.category] ? ruleMapping[transaction.category].group : 4;
        if (ruleTotals[groupNum] !== undefined) {
            ruleTotals[groupNum] += transaction.amount;
        }
        return acc;
    }, {});

    // 4. Create an array of slices with percentages
    let chartSlices = Object.keys(categoryTotals).map((category, index) => {
        const amount = categoryTotals[category];
        const percentage = grandTotalIncome > 0 ? ((amount / grandTotalIncome) * 100).toFixed(1) : 0;
        
        return {
            label: `${category} (${percentage}%)`,
            amount: amount,
            group: ruleMapping[category] ? ruleMapping[category].group : 4,
            borderColor: ruleMapping[category] ? ruleMapping[category].border : '#ffffff',
            backgroundColor: fillColors[index % fillColors.length]
        };
    });

    chartSlices.sort((a, b) => a.group - b.group);

    const totalExpense = chartSlices.reduce((acc, slice) => acc + slice.amount, 0);
    let remainingBudget = grandTotalIncome - totalExpense;
    if (remainingBudget < 0) remainingBudget = 0; 

    const labels = chartSlices.map(slice => slice.label);
    const data = chartSlices.map(slice => slice.amount);
    const borderColors = chartSlices.map(slice => slice.borderColor);
    const backgroundColors = chartSlices.map(slice => slice.backgroundColor);

    if (grandTotalIncome > 0) {
        labels.push('Remaining Budget');
        data.push(remainingBudget);
        backgroundColors.push('#2ecc71'); 
        borderColors.push('#27ae60');     
    }

    // 5. Update the Custom HTML Line-By-Line Legend
    const legendContainer = document.getElementById('custom-legend');
    if (legendContainer) {
        legendContainer.innerHTML = ''; // Clear old legend
        
        // Inject each category as a new list item
        chartSlices.forEach(slice => {
            legendContainer.innerHTML += `
                <li style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="display: inline-block; width: 16px; height: 16px; background-color: ${slice.backgroundColor}; border: 2px solid ${slice.borderColor}; border-radius: 4px; margin-right: 10px;"></span>
                    ${slice.label}
                </li>
            `;
        });

        // Add Remaining Budget to the legend
        if (grandTotalIncome > 0) {
            const remainingPercentage = ((remainingBudget / grandTotalIncome) * 100).toFixed(1);
            legendContainer.innerHTML += `
                <li style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="display: inline-block; width: 16px; height: 16px; background-color: #2ecc71; border: 2px solid #27ae60; border-radius: 4px; margin-right: 10px;"></span>
                    Remaining Budget (${remainingPercentage}%)
                </li>
            `;
        }
    }

    // 6. Update the 50/30/20 HTML Summary directly underneath
    const summaryContainer = document.getElementById('rule-summary');
    if (summaryContainer) {
        const needsPct = grandTotalIncome > 0 ? ((ruleTotals[1] / grandTotalIncome) * 100).toFixed(1) : 0;
        const wantsPct = grandTotalIncome > 0 ? ((ruleTotals[2] / grandTotalIncome) * 100).toFixed(1) : 0;
        const savingsPct = grandTotalIncome > 0 ? ((ruleTotals[3] / grandTotalIncome) * 100).toFixed(1) : 0;

        // Injected line by line
        summaryContainer.innerHTML = `
            <div style="color: #2980b9;">Needs: ${needsPct}% (Goal: 50%)</div>
            <div style="color: #c0392b;">Wants: ${wantsPct}% (Goal: 30%)</div>
            <div style="color: #f39c12;">Savings: ${savingsPct}% (Goal: 20%)</div>
        `;
    }

    if (chartInstance) chartInstance.destroy();

    // 7. Render clean chart (Native legend disabled!)
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['No Data Yet'],
            datasets: [{
                data: data.length > 0 ? data : [1],
                backgroundColor: backgroundColors.length > 0 ? backgroundColors : ['#ccc'],
                borderColor: borderColors.length > 0 ? borderColors : ['#fff'],
                borderWidth: 3, 
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { 
                    display: false 
                },
                tooltip: {
                    bodyFont: { size: 15 },
                    callbacks: {
                        label: function(context) { return ` $${context.raw.toFixed(2)}`; }
                    }
                }
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