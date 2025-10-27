import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Wallet, TrendingUp, Landmark, CreditCard, DollarSign, TrendingDown } from "lucide-react";

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/portfolio/summary`);
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading" data-testid="loading-spinner">Loading portfolio...</div>;
  }

  const totals = summary?.totals || {};
  const counts = summary?.counts || {};
  const byCountry = summary?.by_country || {};

  return (
    <div className="page-container" data-testid="dashboard-page">
      <div className="page-header">
        <h1 className="page-title" data-testid="page-title">Portfolio Overview</h1>
        <p className="page-subtitle" data-testid="page-subtitle">Track your wealth across India, Canada, and beyond</p>
      </div>

      <div className="stats-grid" data-testid="currency-totals">
        <div className="stat-card" data-testid="stat-card-inr">
          <div className="stat-header">
            <span className="stat-label">Indian Rupee</span>
            <DollarSign className="stat-icon" size={24} />
          </div>
          <div className="stat-value" data-testid="total-inr">₹{totals.INR?.toLocaleString() || 0}</div>
          <div className="stat-detail">Total INR Holdings</div>
        </div>

        <div className="stat-card" data-testid="stat-card-cad">
          <div className="stat-header">
            <span className="stat-label">Canadian Dollar</span>
            <DollarSign className="stat-icon" size={24} />
          </div>
          <div className="stat-value" data-testid="total-cad">CA${totals.CAD?.toLocaleString() || 0}</div>
          <div className="stat-detail">Total CAD Holdings</div>
        </div>

        <div className="stat-card" data-testid="stat-card-usd">
          <div className="stat-header">
            <span className="stat-label">US Dollar</span>
            <DollarSign className="stat-icon" size={24} />
          </div>
          <div className="stat-value" data-testid="total-usd">${totals.USD?.toLocaleString() || 0}</div>
          <div className="stat-detail">Total USD Holdings</div>
        </div>
      </div>

      <div className="stats-grid" data-testid="asset-counts">
        <div className="stat-card" data-testid="stat-card-accounts">
          <div className="stat-header">
            <span className="stat-label">Bank Accounts</span>
            <Wallet className="stat-icon" size={24} />
          </div>
          <div className="stat-value" data-testid="count-accounts">{counts.accounts || 0}</div>
          <div className="stat-detail">Active Accounts</div>
        </div>

        <div className="stat-card" data-testid="stat-card-stocks">
          <div className="stat-header">
            <span className="stat-label">Stocks</span>
            <TrendingUp className="stat-icon" size={24} />
          </div>
          <div className="stat-value" data-testid="count-stocks">{counts.stocks || 0}</div>
          <div className="stat-detail">Holdings</div>
        </div>

        <div className="stat-card" data-testid="stat-card-mutual-funds">
          <div className="stat-header">
            <span className="stat-label">Mutual Funds</span>
            <Landmark className="stat-icon" size={24} />
          </div>
          <div className="stat-value" data-testid="count-mutual-funds">{counts.mutual_funds || 0}</div>
          <div className="stat-detail">Fund Holdings</div>
        </div>

        <div className="stat-card" data-testid="stat-card-fixed-deposits">
          <div className="stat-header">
            <span className="stat-label">Fixed Deposits</span>
            <CreditCard className="stat-icon" size={24} />
          </div>
          <div className="stat-value" data-testid="count-fixed-deposits">{counts.fixed_deposits || 0}</div>
          <div className="stat-detail">Active FDs</div>
        </div>
      </div>

      <div className="content-card" data-testid="country-breakdown">
        <div className="card-header">
          <h2 className="card-title">Country Breakdown</h2>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">🇮🇳 India</span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Accounts: </span>
                <span data-testid="india-accounts">{byCountry.india?.accounts || 0}</span>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Stocks: </span>
                <span data-testid="india-stocks">{byCountry.india?.stocks || 0}</span>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Mutual Funds: </span>
                <span data-testid="india-mutual-funds">{byCountry.india?.mutual_funds || 0}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Fixed Deposits: </span>
                <span data-testid="india-fixed-deposits">{byCountry.india?.fixed_deposits || 0}</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">🇨🇦 Canada</span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Accounts: </span>
                <span data-testid="canada-accounts">{byCountry.canada?.accounts || 0}</span>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Stocks: </span>
                <span data-testid="canada-stocks">{byCountry.canada?.stocks || 0}</span>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Mutual Funds: </span>
                <span data-testid="canada-mutual-funds">{byCountry.canada?.mutual_funds || 0}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Fixed Deposits: </span>
                <span data-testid="canada-fixed-deposits">{byCountry.canada?.fixed_deposits || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
