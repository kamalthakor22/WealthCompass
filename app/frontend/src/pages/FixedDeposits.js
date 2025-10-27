import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Plus, Edit2, Trash2, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const FixedDeposits = () => {
  const [fixedDeposits, setFixedDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFD, setEditingFD] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: "",
    amount: 0,
    currency: "INR",
    interest_rate: 0,
    start_date: new Date().toISOString().split('T')[0],
    maturity_date: "",
    country: "India"
  });

  useEffect(() => {
    fetchFixedDeposits();
  }, []);

  const fetchFixedDeposits = async () => {
    try {
      const response = await axios.get(`${API}/fixed-deposits`);
      setFixedDeposits(response.data);
    } catch (error) {
      console.error("Error fetching fixed deposits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFD) {
        await axios.put(`${API}/fixed-deposits/${editingFD.id}`, formData);
      } else {
        await axios.post(`${API}/fixed-deposits`, formData);
      }
      fetchFixedDeposits();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving fixed deposit:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this fixed deposit?")) {
      try {
        await axios.delete(`${API}/fixed-deposits/${id}`);
        fetchFixedDeposits();
      } catch (error) {
        console.error("Error deleting fixed deposit:", error);
      }
    }
  };

  const handleEdit = (fd) => {
    setEditingFD(fd);
    setFormData({
      bank_name: fd.bank_name,
      amount: fd.amount,
      currency: fd.currency,
      interest_rate: fd.interest_rate,
      start_date: fd.start_date,
      maturity_date: fd.maturity_date,
      country: fd.country
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      bank_name: "",
      amount: 0,
      currency: "INR",
      interest_rate: 0,
      start_date: new Date().toISOString().split('T')[0],
      maturity_date: "",
      country: "India"
    });
    setEditingFD(null);
  };

  const calculateMaturityAmount = (amount, rate, startDate, maturityDate) => {
    const start = new Date(startDate);
    const end = new Date(maturityDate);
    const days = Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
    const years = days / 365;
    return amount * Math.pow(1 + rate / 100, years);
  };

  if (loading) {
    return <div className="loading" data-testid="loading-spinner">Loading fixed deposits...</div>;
  }

  return (
    <div className="page-container" data-testid="fixed-deposits-page">
      <div className="page-header">
        <h1 className="page-title" data-testid="page-title">Fixed Deposits</h1>
        <p className="page-subtitle" data-testid="page-subtitle">Manage your fixed deposit investments</p>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">All Fixed Deposits</h2>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn btn-primary" data-testid="add-fd-btn">
                <Plus size={20} /> Add Fixed Deposit
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="fd-dialog">
              <DialogHeader>
                <DialogTitle>{editingFD ? 'Edit Fixed Deposit' : 'Add New Fixed Deposit'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} data-testid="fd-form">
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    required
                    data-testid="input-bank-name"
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
                    <label>Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) })}
                      required
                      data-testid="input-interest-rate"
                    />
                  </div>
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
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      data-testid="input-start-date"
                    />
                  </div>
                  <div className="form-group">
                    <label>Maturity Date</label>
                    <input
                      type="date"
                      value={formData.maturity_date}
                      onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                      required
                      data-testid="input-maturity-date"
                    />
                  </div>
                </div>
                <Button type="submit" className="btn btn-primary" data-testid="submit-fd-btn">
                  {editingFD ? 'Update' : 'Add'} Fixed Deposit
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {fixedDeposits.length === 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <CreditCard className="empty-state-icon" size={64} />
            <h3 className="empty-state-title">No fixed deposits yet</h3>
            <p className="empty-state-text">Add your first fixed deposit to track your investments</p>
          </div>
        ) : (
          <div className="table-container">
            <table data-testid="fds-table">
              <thead>
                <tr>
                  <th>Bank</th>
                  <th>Amount</th>
                  <th>Interest Rate</th>
                  <th>Start Date</th>
                  <th>Maturity Date</th>
                  <th>Maturity Amount</th>
                  <th>Country</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fixedDeposits.map((fd) => {
                  const maturityAmount = calculateMaturityAmount(
                    fd.amount,
                    fd.interest_rate,
                    fd.start_date,
                    fd.maturity_date
                  );
                  return (
                    <tr key={fd.id} data-testid={`fd-row-${fd.id}`}>
                      <td data-testid="fd-bank-name">{fd.bank_name}</td>
                      <td data-testid="fd-amount">
                        <span className="currency-badge">{fd.currency}</span>
                        {fd.amount.toLocaleString()}
                      </td>
                      <td data-testid="fd-interest-rate">{fd.interest_rate}%</td>
                      <td data-testid="fd-start-date">{fd.start_date}</td>
                      <td data-testid="fd-maturity-date">{fd.maturity_date}</td>
                      <td data-testid="fd-maturity-amount">
                        <span className="currency-badge">{fd.currency}</span>
                        {maturityAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td data-testid="fd-country">{fd.country}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEdit(fd)}
                          style={{ marginRight: '0.5rem' }}
                          data-testid={`edit-fd-${fd.id}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(fd.id)}
                          data-testid={`delete-fd-${fd.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedDeposits;
