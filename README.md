# Tf-Trades: TF2 Arbitrage & Trading Analytics Dashboard

A full-stack web application that provides real-time and historical market insights for Team Fortress 2 (TF2) item trading.  
This project aims to empower traders with tools to analyze item values, detect arbitrage opportunities, and visualize long-term price trends.

> 🚧 **Project Status:** In Progress

## 🎯 Goals

- 🔍 Display real-time prices for key TF2 currencies (Keys and Refined Metal)
- 📉 Show historical price charts for key items using Backpack.tf price history
- 🧠 Enable search and visualization for any item’s value across trading platforms
- 🧾 Highlight arbitrage opportunities based on price gaps between markets

## 🧱 Tech Stack

- **Frontend:** Next.js, Tailwind CSS, Recharts
- **Backend:** Go (Gin/Fiber), PostgreSQL
- **External APIs:** Backpack.tf/Marketplace.tf/STNTrading.eu (market data), Steam (OAuth)
- **Scraping:** Selenium + BeautifulSoup

---

This website also uses a bot developed by GitHub user offish (offish/tf2-arbitrage) that I re-engineered and altered to create notifications on the website for when arbitrage opportunities show up. Big thank you to offish for open-sourcing their project, it was a big inspiration and this would not have been possible without them!
