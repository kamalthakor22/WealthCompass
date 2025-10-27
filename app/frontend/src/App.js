import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import BankAccounts from "./pages/BankAccounts";
import Stocks from "./pages/Stocks";
import MutualFunds from "./pages/MutualFunds";
import FixedDeposits from "./pages/FixedDeposits";
import Transactions from "./pages/Transactions";
import Login from "./pages/Login";
import { Wallet, TrendingUp, PieChart, Landmark, CreditCard, Receipt, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading" data-testid="loading-spinner">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
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
      
      {user && (
        <div className="user-info" data-testid="user-info">
          <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
      )}

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

      {user && (
        <div className="nav-footer">
          <Button
            className="btn btn-secondary logout-btn"
            onClick={logout}
            data-testid="logout-btn"
          >
            <LogOut size={20} /> Logout
          </Button>
        </div>
      )}
    </nav>
  );
};

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading" data-testid="app-loading">Loading...</div>;
  }

  const isLoginPage = location.pathname === "/login";

  return (
    <div className="App">
      {!isLoginPage && user ? (
        <div className="app-container">
          <Navigation />
          <main className="main-content" data-testid="main-content">
            <Routes>
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/accounts" element={<PrivateRoute><BankAccounts /></PrivateRoute>} />
              <Route path="/stocks" element={<PrivateRoute><Stocks /></PrivateRoute>} />
              <Route path="/mutual-funds" element={<PrivateRoute><MutualFunds /></PrivateRoute>} />
              <Route path="/fixed-deposits" element={<PrivateRoute><FixedDeposits /></PrivateRoute>} />
              <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
              <Route path="/login" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
export { API };
