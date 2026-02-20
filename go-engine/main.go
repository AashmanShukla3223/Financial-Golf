package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type QuizQuestion struct {
	Question string   `json:"question"`
	Options  []string `json:"options"`
	Answer   int      `json:"answer"`
}

func main() {
	http.HandleFunc("/api/quiz", func(w http.ResponseWriter, r *http.Request) {
		// Secure headers against XSS
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		questions := []QuizQuestion{
			{
				Question: "What is an emergency fund?",
				Options:  []string{"Money for buying a new video game", "Savings specifically for unexpected expenses", "A loan from the bank", "Money you invest in the stock market"},
				Answer:   1,
			},
			{
				Question: "What does ROI stand for?",
				Options:  []string{"Rate of Inflation", "Return on Investment", "Risk over Income", "Ratio of Interest"},
				Answer:   1,
			},
			{
				Question: "Which of the following is considered a 'fixed expense'?",
				Options:  []string{"Monthly rent", "Groceries", "Entertainment", "Gas for your car"},
				Answer:   0,
			},
			{
				Question: "What is compound interest?",
				Options:  []string{"Interest you pay on credit cards", "Interest calculated only on the initial principal", "Interest earned on both the principal and the accumulated interest", "A type of tax"},
				Answer:   2,
			},
			{
				Question: "What is the purpose of a credit score?",
				Options:  []string{"To determine your tax bracket", "To show how much money you have in the bank", "To track your daily spending", "To measure your creditworthiness and likelihood to repay debt"},
				Answer:   3,
			},
			{
				Question: "What is a 'bull market'?",
				Options:  []string{"A market where prices are falling", "A market where prices are rising", "A market only for agricultural goods", "A market with no trading activity"},
				Answer:   1,
			},
			{
				Question: "What does it mean to 'diversify' your investments?",
				Options:  []string{"Putting all your money into one successful company", "Spreading your money across different types of investments to reduce risk", "Only investing in international stocks", "Keeping all your money in a savings account"},
				Answer:   1,
			},
			{
				Question: "Which asset is generally considered the most 'liquid'?",
				Options:  []string{"Real Estate", "A 10-year Treasury Bond", "Cash in a checking account", "Collectibles (like art or trading cards)"},
				Answer:   2,
			},
			{
				Question: "What is inflation?",
				Options:  []string{"The general increase in prices and fall in the purchasing power of money", "When a balloon pops", "A sudden increase in your paycheck", "The interest paid on savings accounts"},
				Answer:   0,
			},
			{
				Question: "What does 'pay yourself first' mean in budgeting?",
				Options:  []string{"Buying things you want before paying bills", "Setting aside a portion of your income for savings or investing before paying any other expenses", "Paying your own salary if you own a business", "Taking out a cash advance"},
				Answer:   1,
			},
		}

		json.NewEncoder(w).Encode(questions)
	})

	fmt.Println("Go Content Engine Started on :8081")
	log.Fatal(http.ListenAndServe("127.0.0.1:8081", nil))
}
