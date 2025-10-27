import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Plus, Trash2, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "credit",
    description: "",
    amount: 0,
    currency: "INR",
    date: new Date().toISOString().split('T')[0],
    category: "Investment"
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/transactions`, formData);
      fetchTransactions();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await axios.delete(`${API}/transactions/${id}`);
        fetchTransactions();
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: "credit",
      description: "",
      amount: 0,
      currency: "INR",
      date: new Date().toISOString().split('T')[0],
      category: "Investment"
    });
  };

  if (loading) {
    return <div className="loading" data-testid="loading-spinner">Loading transactions...</div>;
  }

  return (
    <div className="page-container" data-testid="transactions-page">
      <div className="page-header">
        <h1 className="page-title" data-testid="page-title">Transactions</h1>
        <p className="page-subtitle" data-testid="page-subtitle">Track all your financial transactions</p>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Transaction History</h2>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn btn-primary" data-testid="add-transaction-btn">
                <Plus size={20} /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="transaction-dialog">
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} data-testid="transaction-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      data-testid="select-type"
                    >
                      <option value="credit">Credit</option>
                      <option value="debit">Debit</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      data-testid="select-category"
                    >
                      <option value="Investment">Investment</option>
                      <option value="Dividend">Dividend</option>
                      <option value="Interest">Interest</option>
                      <option value="Purchase">Purchase</option>
                      <option value="Sale">Sale</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    data-testid="input-description"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      required
                      data-testid="input-amount"
                    />
                  </div>
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
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    data-testid="input-date"
                  />
                </div>
                <Button type="submit" className="btn btn-primary" data-testid="submit-transaction-btn">
                  Add Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <Receipt className="empty-state-icon" size={64} />
            <h3 className="empty-state-title">No transactions yet</h3>
            <p className="empty-state-text">Add your first transaction to start tracking</p>
          </div>
        ) : (
          <div className="table-container">
            <table data-testid="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} data-testid={`transaction-row-${transaction.id}`}>
                    <td data-testid="transaction-date">{transaction.date}</td>
                    <td data-testid="transaction-type">
                      <span className={`price-change ${transaction.type === 'credit' ? 'price-up' : 'price-down'}`}>
                        {transaction.type.toUpperCase()}
                      </span>
                    </td>
                    <td data-testid="transaction-category">{transaction.category}</td>
                    <td data-testid="transaction-description">{transaction.description}</td>
                    <td data-testid="transaction-amount">
                      <span className="currency-badge">{transaction.currency}</span>
                      {transaction.type === 'credit' ? '+' : '-'}
                      {transaction.amount.toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(transaction.id)}
                        data-testid={`delete-transaction-${transaction.id}`}
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

export default Transactions;
