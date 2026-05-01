# Dynamic Budget Tracker

A lightweight, front-end web application that helps users track their income and expenses. This project was built to practice state management, data visualization, and advanced JavaScript array methods.

## Features

* **Set Monthly Income:** Define a base monthly income that persists across sessions, saving you from re-entering your baseline paycheck.
* **Add Transactions:** Input descriptions, amounts, and categorize them as either supplementary income or specific expenses (Food, Rent, Utilities, etc.).
* **Dynamic Calculations:** Automatically calculates your grand total income, total expenses, and total balance in real-time.
* **Data Visualization:** Displays a dynamic doughnut chart of your spending by category, including a dedicated slice that tracks your **Remaining Budget**.
* **Data Persistence:** Uses the browser's `localStorage` to save your transaction history and monthly base income so data isn't lost when the page refreshes.
* **Delete Functionality:** Easily remove past transactions and watch the UI and charts update instantly.

## Built With

* **HTML5 & CSS3:** Semantic markup and a clean, responsive card-based UI.
* **Vanilla JavaScript:** Core logic, DOM manipulation, and state management.
* **Chart.js:** Third-party library used for rendering the interactive expense breakdown chart.

## Key Learnings & Technical Highlights

* **Higher-Order Array Methods:** Heavy use of `.map()`, `.filter()`, and `.reduce()` to cleanly separate incomes from expenses and calculate dynamic totals without relying on messy `for` loops.
* **State Management:** Keeping the UI synchronized with the underlying data array whenever a transaction or income value is added or deleted.
* **Browser APIs:** Implementing `JSON.stringify()` and `JSON.parse()` to read and write complex object arrays and variables to `localStorage`.

## How to Run

1. Clone this repository to your local machine.
2. Navigate to the project folder.
3. Open `index.html` in any modern web browser. (No build tools, npm, or servers required!)

## Project Structure

\`\`\`text
budget-tracker/
├── index.html    # Main layout and Chart.js CDN import
├── style.css     # UI styling and responsive design
├── app.js        # Core logic, array methods, and chart rendering
├── .gitignore    # Excludes system and editor files from version control
├── LICENSE       # MIT License
└── README.md     # Project documentation
\`\`\`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.