import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Plus, Edit2, Trash2, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const BankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    account_number: "",
    currency: "INR",
    balance: 0,
    country: "India"
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${API}/accounts`);
      setAccounts(response.data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await axios.put(`${API}/accounts/${editingAccount.id}`, formData);
      } else {
        await axios.post(`${API}/accounts`, formData);
      }
      fetchAccounts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving account:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        await axios.delete(`${API}/accounts/${id}`);
        fetchAccounts();
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      account_number: account.account_number,
      currency: account.currency,
      balance: account.balance,
      country: account.country
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      account_number: "",
      currency: "INR",
      balance: 0,
      country: "India"
    });
    setEditingAccount(null);
  };

  if (loading) {
    return <div className="loading" data-testid="loading-spinner">Loading accounts...</div>;
  }

  return (
    <div className="page-container" data-testid="bank-accounts-page">
      <div className="page-header">
        <h1 className="page-title" data-testid="page-title">Bank Accounts</h1>
        <p className="page-subtitle" data-testid="page-subtitle">Manage your bank accounts across India and Canada</p>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">All Accounts</h2>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn btn-primary" data-testid="add-account-btn">
                <Plus size={20} /> Add Account
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="account-dialog">
              <DialogHeader>
                <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} data-testid="account-form">
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="input-name"
                  />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    required
                    data-testid="input-account-number"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      data-testid="select-currency"
                    >
                      <option value="INR">INR</option>
                      <option value="CAD">CAD</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      data-testid="select-country"
                    >
                      <option value="India">India</option>
                      <option value="Canada">Canada</option>
                      <option value="USA">USA</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) })}
                    required
                    data-testid="input-balance"
                  />
                </div>
                <Button type="submit" className="btn btn-primary" data-testid="submit-account-btn">
                  {editingAccount ? 'Update' : 'Add'} Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {accounts.length === 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <Wallet className="empty-state-icon" size={64} />
            <h3 className="empty-state-title">No accounts yet</h3>
            <p className="empty-state-text">Add your first bank account to get started</p>
          </div>
        ) : (
          <div className="table-container">
            <table data-testid="accounts-table">
              <thead>
                <tr>
                  <th>Bank Name</th>
                  <th>Account Number</th>
                  <th>Country</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} data-testid={`account-row-${account.id}`}>
                    <td data-testid="account-name">{account.name}</td>
                    <td data-testid="account-number">{account.account_number}</td>
                    <td data-testid="account-country">{account.country}</td>
                    <td data-testid="account-balance">
                      <span className="currency-badge">{account.currency}</span>
                      {account.currency === 'INR' ? '₹' : account.currency === 'CAD' ? 'CA$' : '$'}
                      {account.balance.toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEdit(account)}
                        style={{ marginRight: '0.5rem' }}
                        data-testid={`edit-account-${account.id}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(account.id)}
                        data-testid={`delete-account-${account.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankAccounts;
