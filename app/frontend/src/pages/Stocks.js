import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Plus, Edit2, Trash2, TrendingUp, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [liveprices, setLivePrices] = useState({});
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    quantity: 0,
    purchase_price: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    currency: "INR",
    country: "India",
    exchange: "NSE"
  });

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await axios.get(`${API}/stocks`);
      setStocks(response.data);
    } catch (error) {
      console.error("Error fetching stocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePrice = async (symbol) => {
    try {
      const response = await axios.get(`${API}/market/price/${symbol}`);
      setLivePrices(prev => ({ ...prev, [symbol]: response.data.price }));
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
    }
  };

  const refreshPrices = () => {
    stocks.forEach(stock => {
      fetchLivePrice(stock.symbol);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStock) {
        await axios.put(`${API}/stocks/${editingStock.id}`, formData);
      } else {
        await axios.post(`${API}/stocks`, formData);
      }
      fetchStocks();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving stock:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this stock?")) {
      try {
        await axios.delete(`${API}/stocks/${id}`);
        fetchStocks();
      } catch (error) {
        console.error("Error deleting stock:", error);
      }
    }
  };

  const handleEdit = (stock) => {
    setEditingStock(stock);
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      quantity: stock.quantity,
      purchase_price: stock.purchase_price,
      purchase_date: stock.purchase_date,
      currency: stock.currency,
      country: stock.country,
      exchange: stock.exchange
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      symbol: "",
      name: "",
      quantity: 0,
      purchase_price: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      currency: "INR",
      country: "India",
      exchange: "NSE"
    });
    setEditingStock(null);
  };

  if (loading) {
    return <div className="loading" data-testid="loading-spinner">Loading stocks...</div>;
  }

  return (
    <div className="page-container" data-testid="stocks-page">
      <div className="page-header">
        <h1 className="page-title" data-testid="page-title">Stocks</h1>
        <p className="page-subtitle" data-testid="page-subtitle">Track your stock investments with real-time prices</p>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Stock Holdings</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button 
              className="btn btn-secondary" 
              onClick={refreshPrices}
              data-testid="refresh-prices-btn"
            >
              <RefreshCw size={20} /> Refresh Prices
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="btn btn-primary" data-testid="add-stock-btn">
                  <Plus size={20} /> Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="stock-dialog">
                <DialogHeader>
                  <DialogTitle>{editingStock ? 'Edit Stock' : 'Add New Stock'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} data-testid="stock-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Symbol (e.g., AAPL:NASDAQ)</label>
                      <input
                        type="text"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                        placeholder="AAPL:NASDAQ"
                        required
                        data-testid="input-symbol"
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock Name</label>
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
                      <label>Quantity</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                        required
                        data-testid="input-quantity"
                      />
                    </div>
                    <div className="form-group">
                      <label>Purchase Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })}
                        required
                        data-testid="input-purchase-price"
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
                        <option value="USA">USA</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Exchange</label>
                    <input
                      type="text"
                      value={formData.exchange}
                      onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                      placeholder="NSE, TSX, NASDAQ"
                      required
                      data-testid="input-exchange"
                    />
                  </div>
                  <Button type="submit" className="btn btn-primary" data-testid="submit-stock-btn">
                    {editingStock ? 'Update' : 'Add'} Stock
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {stocks.length === 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <TrendingUp className="empty-state-icon" size={64} />
            <h3 className="empty-state-title">No stocks yet</h3>
            <p className="empty-state-text">Add your first stock holding to track performance</p>
          </div>
        ) : (
          <div className="table-container">
            <table data-testid="stocks-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Purchase Price</th>
                  <th>Current Price</th>
                  <th>Total Value</th>
                  <th>Country</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const currentPrice = liveprices[stock.symbol] || stock.purchase_price;
                  const totalValue = stock.quantity * currentPrice;
                  const change = ((currentPrice - stock.purchase_price) / stock.purchase_price * 100).toFixed(2);
                  return (
                    <tr key={stock.id} data-testid={`stock-row-${stock.id}`}>
                      <td data-testid="stock-symbol">{stock.symbol}</td>
                      <td data-testid="stock-name">{stock.name}</td>
                      <td data-testid="stock-quantity">{stock.quantity}</td>
                      <td data-testid="stock-purchase-price">
                        <span className="currency-badge">{stock.currency}</span>
                        {stock.purchase_price.toFixed(2)}
                      </td>
                      <td data-testid="stock-current-price">
                        <div className="price-display">
                          <span className="price-value">{currentPrice.toFixed(2)}</span>
                          {liveprices[stock.symbol] && (
                            <span className={`price-change ${change >= 0 ? 'price-up' : 'price-down'}`}>
                              {change >= 0 ? '+' : ''}{change}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-testid="stock-total-value">
                        <span className="currency-badge">{stock.currency}</span>
                        {totalValue.toFixed(2)}
                      </td>
                      <td data-testid="stock-country">{stock.country}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEdit(stock)}
                          style={{ marginRight: '0.5rem' }}
                          data-testid={`edit-stock-${stock.id}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(stock.id)}
                          data-testid={`delete-stock-${stock.id}`}
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

export default Stocks;
