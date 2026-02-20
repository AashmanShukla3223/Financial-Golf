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
        w.Header().Set("Access-Control-Allow-Origin", "http://tauri.localhost")

        q := QuizQuestion{
            Question: "What is an emergency fund?",
            Options: []string{
                "Money for buying a new video game",
                "Savings specifically for unexpected expenses",
                "A loan from the bank",
                "Money you invest in the stock market",
            },
            Answer: 1,
        }
        json.NewEncoder(w).Encode([]QuizQuestion{q})
    })

    fmt.Println("Go Content Engine Started on :8081")
    log.Fatal(http.ListenAndServe("127.0.0.1:8081", nil))
}
