import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import Dashboard from "./pages/Dashboard";
import BankAccounts from "./pages/BankAccounts";
import Stocks from "./pages/Stocks";
import MutualFunds from "./pages/MutualFunds";
import FixedDeposits from "./pages/FixedDeposits";
import Transactions from "./pages/Transactions";
import { Wallet, TrendingUp, PieChart, Landmark, CreditCard, Receipt } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: PieChart },
    { path: "/accounts", label: "Bank Accounts", icon: Wallet },
    { path: "/stocks", label: "Stocks", icon: TrendingUp },
    { path: "/mutual-funds", label: "Mutual Funds", icon: Landmark },
    { path: "/fixed-deposits", label: "Fixed Deposits", icon: CreditCard },
    { path: "/transactions", label: "Transactions", icon: Receipt }
  ];
  
  return (
    <nav className="navigation" data-testid="main-navigation">
      <div className="nav-header" data-testid="nav-header">
        <Wallet className="nav-logo" size={32} />
        <h1 className="nav-title">WealthCompass</h1>
      </div>
      <div className="nav-links" data-testid="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
              data-testid={`nav-link-${item.label.toLowerCase().replace(/ /g, '-')}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="app-container">
          <Navigation />
          <main className="main-content" data-testid="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/accounts" element={<BankAccounts />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/mutual-funds" element={<MutualFunds />} />
              <Route path="/fixed-deposits" element={<FixedDeposits />} />
              <Route path="/transactions" element={<Transactions />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
export { API };
