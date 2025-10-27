import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Plus, Edit2, Trash2, Landmark, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MutualFunds = () => {
  const [mutualFunds, setMutualFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMF, setEditingMF] = useState(null);
  const [liveNavs, setLiveNavs] = useState({});
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    units: 0,
    purchase_nav: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    currency: "INR",
    country: "India"
  });

  useEffect(() => {
    fetchMutualFunds();
  }, []);

  const fetchMutualFunds = async () => {
    try {
      const response = await axios.get(`${API}/mutual-funds`);
      setMutualFunds(response.data);
    } catch (error) {
      console.error("Error fetching mutual funds:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveNav = async (symbol) => {
    try {
      const response = await axios.get(`${API}/market/price/${symbol}`);
      setLiveNavs(prev => ({ ...prev, [symbol]: response.data.price }));
    } catch (error) {
      console.error(`Error fetching NAV for ${symbol}:`, error);
    }
  };

  const refreshNavs = () => {
    mutualFunds.forEach(mf => {
      fetchLiveNav(mf.symbol);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMF) {
        await axios.put(`${API}/mutual-funds/${editingMF.id}`, formData);
      } else {
        await axios.post(`${API}/mutual-funds`, formData);
      }
      fetchMutualFunds();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving mutual fund:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this mutual fund?")) {
      try {
        await axios.delete(`${API}/mutual-funds/${id}`);
        fetchMutualFunds();
      } catch (error) {
        console.error("Error deleting mutual fund:", error);
      }
    }
  };

  const handleEdit = (mf) => {
    setEditingMF(mf);
    setFormData({
      symbol: mf.symbol,
      name: mf.name,
      units: mf.units,
      purchase_nav: mf.purchase_nav,
      purchase_date: mf.purchase_date,
      currency: mf.currency,
      country: mf.country
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      symbol: "",
      name: "",
      units: 0,
      purchase_nav: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      currency: "INR",
      country: "India"
    });
    setEditingMF(null);
  };

  if (loading) {
    return <div className="loading" data-testid="loading-spinner">Loading mutual funds...</div>;
  }

  return (
    <div className="page-container" data-testid="mutual-funds-page">
      <div className="page-header">
        <h1 className="page-title" data-testid="page-title">Mutual Funds</h1>
        <p className="page-subtitle" data-testid="page-subtitle">Track your mutual fund investments</p>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Fund Holdings</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button 
              className="btn btn-secondary" 
              onClick={refreshNavs}
              data-testid="refresh-navs-btn"
            >
              <RefreshCw size={20} /> Refresh NAVs
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="btn btn-primary" data-testid="add-mutual-fund-btn">
                  <Plus size={20} /> Add Mutual Fund
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="mutual-fund-dialog">
                <DialogHeader>
                  <DialogTitle>{editingMF ? 'Edit Mutual Fund' : 'Add New Mutual Fund'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} data-testid="mutual-fund-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Symbol (e.g., MUTF_IN:AXIS_12)</label>
                      <input
                        type="text"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                        placeholder="MUTF_IN:AXIS_12"
                        required
                        data-testid="input-symbol"
                      />
                    </div>
                    <div className="form-group">
                      <label>Fund Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        data-testid="input-name"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Units</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.units}
                        onChange={(e) => setFormData({ ...formData, units: parseFloat(e.target.value) })}
                        required
                        data-testid="input-units"
                      />
                    </div>
                    <div className="form-group">
                      <label>Purchase NAV</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.purchase_nav}
                        onChange={(e) => setFormData({ ...formData, purchase_nav: parseFloat(e.target.value) })}
                        required
                        data-testid="input-purchase-nav"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      required
                      data-testid="input-purchase-date"
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
                      </select>
                    </div>
                  </div>
                  <Button type="submit" className="btn btn-primary" data-testid="submit-mutual-fund-btn">
                    {editingMF ? 'Update' : 'Add'} Mutual Fund
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {mutualFunds.length === 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <Landmark className="empty-state-icon" size={64} />
            <h3 className="empty-state-title">No mutual funds yet</h3>
            <p className="empty-state-text">Add your first mutual fund to track your investments</p>
          </div>
        ) : (
          <div className="table-container">
            <table data-testid="mutual-funds-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Units</th>
                  <th>Purchase NAV</th>
                  <th>Current NAV</th>
                  <th>Total Value</th>
                  <th>Country</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mutualFunds.map((mf) => {
                  const currentNav = liveNavs[mf.symbol] || mf.purchase_nav;
                  const totalValue = mf.units * currentNav;
                  const change = ((currentNav - mf.purchase_nav) / mf.purchase_nav * 100).toFixed(2);
                  return (
                    <tr key={mf.id} data-testid={`mutual-fund-row-${mf.id}`}>
                      <td data-testid="mf-symbol">{mf.symbol}</td>
                      <td data-testid="mf-name">{mf.name}</td>
                      <td data-testid="mf-units">{mf.units.toFixed(3)}</td>
                      <td data-testid="mf-purchase-nav">
                        <span className="currency-badge">{mf.currency}</span>
                        {mf.purchase_nav.toFixed(2)}
                      </td>
                      <td data-testid="mf-current-nav">
                        <div className="price-display">
                          <span className="price-value">{currentNav.toFixed(2)}</span>
                          {liveNavs[mf.symbol] && (
                            <span className={`price-change ${change >= 0 ? 'price-up' : 'price-down'}`}>
                              {change >= 0 ? '+' : ''}{change}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-testid="mf-total-value">
                        <span className="currency-badge">{mf.currency}</span>
                        {totalValue.toFixed(2)}
                      </td>
                      <td data-testid="mf-country">{mf.country}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEdit(mf)}
                          style={{ marginRight: '0.5rem' }}
                          data-testid={`edit-mutual-fund-${mf.id}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(mf.id)}
                          data-testid={`delete-mutual-fund-${mf.id}`}
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

export default MutualFunds;
