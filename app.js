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

// Update Chart.js Visualization
function updateChart() {
    // 1. Calculate Grand Total Income
    const incomes = transactions.filter(t => t.type === 'income').map(t => t.amount);
    const transactionIncome = incomes.reduce((acc, item) => (acc += item), 0);
    const grandTotalIncome = transactionIncome + monthlyIncome;

    // 2. Define "Cool" Dark Mode Palettes
    // Needs (Cyan/Teal), Wants (Electric Purple), Savings (Neon Gold)
    const palettes = {
        1: ['#06b6d4', '#0891b2', '#00909e', '#164e63'], // Cyans
        2: ['#8b5cf6', '#7c3aed', '#6d28d9', '#4c1d95'], // Purples
        3: ['#f59e0b', '#d97706', '#b45309', '#78350f']  // Ambers
    };

    const ruleMapping = {
        'Rent': { group: 1, name: 'Needs' },
        'Utilities': { group: 1, name: 'Needs' },
        'Food': { group: 1, name: 'Needs' },
        'Transport': { group: 1, name: 'Needs' },
        'Entertainment': { group: 2, name: 'Wants' },
        'Drinks': { group: 2, name: 'Wants' },
        'Other': { group: 2, name: 'Wants' },
        'Company Tax & Investments': { group: 3, name: 'Savings' }
    };

    // 3. Filter and Group expenses by category
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    let ruleTotals = { 1: 0, 2: 0, 3: 0 }; 
    let colorCounters = { 1: 0, 2: 0, 3: 0 }; 

    const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
        if (!acc[transaction.category]) acc[transaction.category] = 0;
        acc[transaction.category] += transaction.amount;
        
        const groupNum = ruleMapping[transaction.category] ? ruleMapping[transaction.category].group : 4;
        if (ruleTotals[groupNum] !== undefined) {
            ruleTotals[groupNum] += transaction.amount;
        }
        return acc;
    }, {});

    // 4. Create sorted slices with assigned modern shades
    let chartSlices = Object.keys(categoryTotals).map(category => {
        const amount = categoryTotals[category];
        const percentage = grandTotalIncome > 0 ? ((amount / grandTotalIncome) * 100).toFixed(1) : 0;
        const groupNum = ruleMapping[category] ? ruleMapping[category].group : 4;
        
        const bgColor = palettes[groupNum] ? palettes[groupNum][colorCounters[groupNum] % palettes[groupNum].length] : '#475569';
        if (palettes[groupNum]) colorCounters[groupNum]++;

        return {
            category: category,
            label: `${category} (${percentage}%)`,
            amount: amount,
            group: groupNum,
            backgroundColor: bgColor
        };
    });

    chartSlices.sort((a, b) => a.group - b.group);

    const totalExpense = chartSlices.reduce((acc, slice) => acc + slice.amount, 0);
    let remainingBudget = grandTotalIncome - totalExpense;
    if (remainingBudget < 0) remainingBudget = 0; 

    const labels = chartSlices.map(slice => slice.label);
    const data = chartSlices.map(slice => slice.amount);
    const backgroundColors = chartSlices.map(slice => slice.backgroundColor);

    if (grandTotalIncome > 0) {
        const remainingPercentage = ((remainingBudget / grandTotalIncome) * 100).toFixed(1);
        labels.push(`Remaining Budget (${remainingPercentage}%)`);
        data.push(remainingBudget);
        backgroundColors.push('#10b981');
    }

    // 5. Build the Structured HTML Legend for Dark Mode
    const legendContainer = document.getElementById('custom-legend');
    if (legendContainer) {
        legendContainer.innerHTML = ''; 

        const buildGroupHTML = (groupId, groupName, targetPct, themeColor) => {
            const groupSlices = chartSlices.filter(s => s.group === groupId);
            const actualPct = grandTotalIncome > 0 ? ((ruleTotals[groupId] / grandTotalIncome) * 100).toFixed(1) : 0;
            
            if (groupSlices.length === 0 && actualPct == 0) return ''; 

            // Updated HTML to blend into the new dark background (#0f172a)
            let html = `
                <div style="background: #0f172a; border-left: 4px solid ${themeColor}; border-radius: 6px; padding: 14px; border-top: 1px solid #334155; border-right: 1px solid #334155; border-bottom: 1px solid #334155;">
                    <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #f8fafc; display: flex; justify-content: space-between;">
                        <span>${groupName} (Goal: ${targetPct}%)</span>
                        <span style="color: ${actualPct > targetPct && groupId !== 3 ? '#f43f5e' : themeColor};">Actual: ${actualPct}%</span>
                    </div>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #cbd5e1;">
            `;

            groupSlices.forEach(slice => {
                html += `
                    <li style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="display: inline-block; width: 12px; height: 12px; background-color: ${slice.backgroundColor}; border-radius: 3px; margin-right: 10px;"></span>
                        ${slice.label} - $${slice.amount.toFixed(2)}
                    </li>
                `;
            });

            html += `</ul></div>`;
            return html;
        };

        legendContainer.innerHTML += buildGroupHTML(1, 'Needs', 50, '#06b6d4');
        legendContainer.innerHTML += buildGroupHTML(2, 'Wants', 30, '#8b5cf6');
        legendContainer.innerHTML += buildGroupHTML(3, 'Savings & Investments', 20, '#f59e0b');

        if (grandTotalIncome > 0) {
            const remPct = ((remainingBudget / grandTotalIncome) * 100).toFixed(1);
            legendContainer.innerHTML += `
                <div style="background: #0f172a; border-left: 4px solid #10b981; border-radius: 6px; padding: 14px; border-top: 1px solid #334155; border-right: 1px solid #334155; border-bottom: 1px solid #334155;">
                    <div style="font-weight: bold; font-size: 16px; color: #10b981; display: flex; align-items: center;">
                        <span style="display: inline-block; width: 14px; height: 14px; background-color: #10b981; border-radius: 3px; margin-right: 10px;"></span>
                        Unallocated Budget: ${remPct}% ($${remainingBudget.toFixed(2)})
                    </div>
                </div>
            `;
        }
    }

    if (chartInstance) chartInstance.destroy();

    // 6. Render sleek, rounded chart configured for a dark background
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['No Data Yet'],
            datasets: [{
                data: data.length > 0 ? data : [1],
                backgroundColor: backgroundColors.length > 0 ? backgroundColors : ['#334155'],
                borderWidth: 3,
                borderColor: '#1e293b',
                borderRadius: 4, 
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            cutout: '50%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    bodyFont: { size: 14 },
                    borderColor: '#334155',
                    borderWidth: 1,
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