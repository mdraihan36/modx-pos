import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Universal Search State
  const [globalSearchInput, setGlobalSearchInput] = useState('');
  const [searchHistoryReport, setSearchHistoryReport] = useState(null);
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);

  // Date Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Data Store (Database Synced)
  const [products, setProducts] = useState([]);
  const [salesRecords, setSalesRecords] = useState([]);
  const [purchaseLedger, setPurchaseLedger] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [dealerTransactions, setDealerTransactions] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [payoutLogs, setPayoutLogs] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [fbOrders, setFbOrders] = useState([]);

  // POS State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('direct');
  const [selectedResellerId, setSelectedResellerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bikeNumber, setBikeNumber] = useState('');
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedBank, setSelectedBank] = useState('Islami Bank Bangladesh PLC');
  const [bankTxnRef, setBankTxnRef] = useState('');
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const invoicePdfRef = useRef();

  // Inputs
  const [newProdName, setNewProdName] = useState('');
  const [newProdSKU, setNewProdSKU] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Lubricants');
  const [newProdCost, setNewProdCost] = useState('');
  const [newProdResellerRate, setNewProdResellerRate] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('General');
  const [expenseAmount, setExpenseAmount] = useState('');

  const [newJobBike, setNewJobBike] = useState('');
  const [newJobCustomer, setNewJobCustomer] = useState('');
  const [newJobService, setNewJobService] = useState('');
  const [newJobMechanic, setNewJobMechanic] = useState('');

  // Initial Data Fetch From Database
  const fetchAllData = async () => {
    try {
      const res = await fetch('/api/bootstrap-data');
      if (!res.ok) return;
      const data = await res.json();
      if (data.products) setProducts(data.products);
      if (data.invoices) setSalesRecords(data.invoices);
      if (data.purchases) setPurchaseLedger(data.purchases);
      if (data.expenses) setExpenses(data.expenses);
      if (data.jobCards) setJobCards(data.jobCards);
      if (data.dealers) setDealers(data.dealers);
      if (data.resellers) {
        setResellers(data.resellers);
        if (data.resellers.length > 0) setSelectedResellerId(data.resellers[0].id);
      }
      if (data.dealerTransactions) setDealerTransactions(data.dealerTransactions);
      if (data.payoutLogs) setPayoutLogs(data.payoutLogs);
      if (data.deliveries) setDeliveries(data.deliveries);
      if (data.fbOrders) setFbOrders(data.fbOrders);
    } catch (err) {
      console.error('Data sync failed:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Universal Search Handler
  const handleUniversalSearch = async () => {
    if (!globalSearchInput.trim()) return alert('মোবাইল নম্বর অথবা বাইক নম্বর লিখুন!');
    setIsSearchingHistory(true);
    try {
      const res = await fetch(`/api/search-history?q=${encodeURIComponent(globalSearchInput.trim())}`);
      const data = await res.json();
      setSearchHistoryReport(data);
    } catch (err) {
      console.error(err);
      alert('হিস্ট্রি ডাটা আনতে সমস্যা হয়েছে');
    } finally {
      setIsSearchingHistory(false);
    }
  };

  const categories = ['All', 'Lubricants', 'Braking System', 'Intake System', 'Ignition', 'Drivetrain', 'Electrical'];
  const activeReseller = resellers.find(r => r.id === Number(selectedResellerId));

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? {
        ...item,
        quantity: item.quantity + 1,
        subtotal: (item.quantity + 1) * item.customer_price,
        reseller_subtotal: (item.quantity + 1) * item.reseller_base_price,
        total_cost: (item.quantity + 1) * item.cost_price
      } : item));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        cost_price: Number(product.cost_price || 0),
        reseller_base_price: Number(product.reseller_base_price || product.selling_price),
        customer_price: Number(product.selling_price),
        quantity: 1,
        subtotal: Number(product.selling_price),
        reseller_subtotal: Number(product.reseller_base_price || product.selling_price),
        total_cost: Number(product.cost_price || 0)
      }]);
    }
  };

  const updateCustomerPrice = (id, newPrice) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const p = Number(newPrice) || 0;
        return { ...item, customer_price: p, subtotal: item.quantity * p };
      }
      return item;
    }));
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          subtotal: newQty * item.customer_price,
          reseller_subtotal: newQty * item.reseller_base_price,
          total_cost: newQty * item.cost_price
        };
      }
      return item;
    }));
  };

  const removeItem = (id) => setCart(cart.filter(item => item.id !== id));

  const totalCustomerPayable = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalResellerBasePrice = cart.reduce((sum, item) => sum + item.reseller_subtotal, 0);
  const totalCogsForCart = cart.reduce((sum, item) => sum + item.total_cost, 0);
  const totalResellerProfit = orderType === 'reseller' ? Math.max(0, totalCustomerPayable - totalResellerBasePrice) : 0;
  const finalPayable = Math.max(0, totalCustomerPayable - redeemedPoints);

  // Database Synced POS Checkout
  const handleCheckout = async () => {
    if (!customerPhone.trim()) return alert('কাস্টমারের ফোন নম্বর প্রদান করুন!');
    if (cart.length === 0) return alert('বিলিং কাউন্টার খালি!');

    setLoading(true);
    const paymentGatewayDetails = paymentMethod === 'bank' ? `${selectedBank} (Ref: ${bankTxnRef || 'CARD'})` : paymentMethod.toUpperCase();
    const invoiceNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    const invoicePayload = {
      invoice_number: invoiceNum,
      order_type: orderType,
      customer_name: customerName || 'Walk-in Client',
      customer_phone: customerPhone,
      bike_number: bikeNumber || 'N/A',
      items: [...cart],
      total_amount: totalCustomerPayable,
      paid_amount: finalPayable,
      total_cogs: totalCogsForCart,
      profit: finalPayable - totalCogsForCart,
      payment_method: paymentGatewayDetails
    };

    try {
      const res = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload)
      });

      if (res.ok) {
        setCompletedInvoice({ ...invoicePayload, invoice_id: invoiceNum, date: new Date().toLocaleString() });
        setCart([]);
        setBikeNumber('');
        setCustomerName('');
        setCustomerPhone('');
        fetchAllData();
      } else {
        alert('ইনভয়েস সেভ করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Stock Inward Saved to Database
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProdName || !newProdCost || !newProdPrice || !newProdStock) return alert('পণ্যের বিবরণ দিন!');

    const payload = {
      name: newProdName,
      sku: newProdSKU || `SKU-${Date.now().toString().slice(-4)}`,
      category: newProdCategory,
      cost_price: Number(newProdCost),
      reseller_base_price: Number(newProdResellerRate || newProdCost),
      selling_price: Number(newProdPrice),
      stock: Number(newProdStock),
      supplier_name: newSupplierName || 'Direct Wholesale'
    };

    try {
      const res = await fetch('/api/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('স্টক ডাটাবেজে সংরক্ষণ সম্পন্ন!');
        setNewProdName(''); setNewProdSKU(''); setNewProdCost(''); setNewProdResellerRate(''); setNewProdPrice(''); setNewProdStock(''); setNewSupplierName('');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Expense Saved to Database
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return alert('খরচের বিবরণ দিন!');
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: expenseTitle, category: expenseCategory, amount: Number(expenseAmount) })
      });
      if (res.ok) {
        alert('খরচ ডাটাবেজে সংরক্ষণ হয়েছে!');
        setExpenseTitle(''); setExpenseAmount('');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Workshop Job Saved to Database
  const addJobCard = async (e) => {
    e.preventDefault();
    if (!newJobBike.trim() || !newJobService.trim()) return alert('গাড়ির নম্বর ও সার্ভিস আবশ্যক!');
    try {
      const res = await fetch('/api/workshop/jobcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bike_number: newJobBike.toUpperCase(),
          customer_name: newJobCustomer || 'Client',
          customer_phone: 'N/A',
          service_type: newJobService,
          mechanic_name: newJobMechanic || 'Workshop Tech'
        })
      });
      if (res.ok) {
        setNewJobBike(''); setNewJobCustomer(''); setNewJobService(''); setNewJobMechanic('');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateJobStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/workshop/jobcard/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const downloadInvoicePDF = () => {
    const input = invoicePdfRef.current;
    html2canvas(input, { scale: 2, backgroundColor: '#ffffff' }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ModX_Invoice_${completedInvoice.invoice_id}.pdf`);
    });
  };

  const filteredCatalog = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ background: '#0f1117', color: '#cbd5e1', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* HEADER */}
      <header style={{ background: '#181b24', borderBottom: '1px solid #282d3c', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', color: '#f8fafc' }}>
            MODX <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '700' }}>ENTERPRISE</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Complete POS, Workshop, Partners & Deliveries System
          </div>
        </div>

        {/* Global Search Bar (Phone / Bike Number) */}
        <div style={{ display: 'flex', gap: '6px', minWidth: '340px' }}>
          <input 
            type="text"
            placeholder="🔍 ফোন নম্বর বা বাইক নম্বর দিয়ে হিস্ট্রি খুঁজুন..."
            value={globalSearchInput}
            onChange={(e) => setGlobalSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUniversalSearch()}
            style={{ flex: 1, padding: '7px 12px', background: '#0f1117', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
          />
          <button 
            onClick={handleUniversalSearch}
            style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
          >
            {isSearchingHistory ? 'খোঁজা হচ্ছে...' : 'হিস্ট্রি'}
          </button>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', background: '#0f1117', padding: '4px', borderRadius: '6px', border: '1px solid #282d3c', gap: '2px', overflowX: 'auto' }}>
          {[
            { id: 'pos', label: 'Billing Counter' },
            { id: 'reports', label: 'Financial Reports' },
            { id: 'dealers', label: 'Dealer Ledger' },
            { id: 'resellers', label: 'Reseller & Payouts' },
            { id: 'courier', label: '📦 Courier Tracking' },
            { id: 'workshop', label: 'Workshop Kanban' },
            { id: 'inventory', label: 'Stock & Sourcing' },
            { id: 'fb_orders', label: `🔵 FB Orders (${fbOrders.length})` }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                background: activeTab === t.id ? '#dc2626' : 'transparent',
                color: activeTab === t.id ? '#ffffff' : '#94a3b8'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* UNIVERSAL SEARCH MODAL REPORT */}
      {searchHistoryReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#181b24', border: '1px solid #334155', borderRadius: '8px', padding: '20px', maxWidth: '850px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #282d3c', paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
                সার্চ রিপোর্ট: <span style={{ color: '#38bdf8' }}>"{searchHistoryReport.query}"</span>
              </div>
              <button onClick={() => setSearchHistoryReport(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Invoices */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#f59e0b', marginBottom: '6px' }}>🧾 পূর্ববর্তী সেলস ও ইনভয়েস ({searchHistoryReport.invoices?.length || 0})</div>
              {searchHistoryReport.invoices?.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#0f1117', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>তারিখ</th>
                      <th style={{ padding: '6px' }}>ইনভয়েস</th>
                      <th style={{ padding: '6px' }}>কাস্টমার</th>
                      <th style={{ padding: '6px' }}>বাইক</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>টাকা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchHistoryReport.invoices.map(inv => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #202430' }}>
                        <td style={{ padding: '6px' }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '6px', color: '#38bdf8' }}>#{inv.invoice_number}</td>
                        <td style={{ padding: '6px' }}>{inv.customer_name} ({inv.customer_phone})</td>
                        <td style={{ padding: '6px', color: '#dc2626', fontWeight: '600' }}>{inv.bike_number}</td>
                        <td style={{ padding: '6px', textAlign: 'right', color: '#4ade80' }}>Tk {inv.paid_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ fontSize: '11px', color: '#64748b' }}>কোনো ইনভয়েস পাওয়া যায়নি।</div>}
            </div>

            {/* Workshop Jobs */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', marginBottom: '6px' }}>🔧 ওয়ার্কশপ সার্ভিস হিস্ট্রি ({searchHistoryReport.workshopJobs?.length || 0})</div>
              {searchHistoryReport.workshopJobs?.length > 0 ? (
                <div style={{ display: 'grid', gap: '6px' }}>
                  {searchHistoryReport.workshopJobs.map(j => (
                    <div key={j.id} style={{ background: '#0f1117', padding: '8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <div>
                        <strong style={{ color: '#dc2626' }}>{j.bike_number}</strong> — {j.service_type} (Tech: {j.mechanic_name})
                      </div>
                      <span style={{ color: '#f59e0b' }}>{j.status}</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: '11px', color: '#64748b' }}>কোনো সার্ভিস হিস্ট্রি পাওয়া যায়নি।</div>}
            </div>

            {/* Supplier / Purchases */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#a855f7', marginBottom: '6px' }}>📦 সাপ্লায়ার ও পারচেস রেকর্ড ({searchHistoryReport.supplierPurchases?.length || 0})</div>
              {searchHistoryReport.supplierPurchases?.length > 0 ? (
                <div style={{ display: 'grid', gap: '6px' }}>
                  {searchHistoryReport.supplierPurchases.map(p => (
                    <div key={p.id} style={{ background: '#0f1117', padding: '8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <div>সাপ্লায়ার: {p.supplier_name} ({p.supplier_phone}) — পরিমাণ: {p.quantity}</div>
                      <strong style={{ color: '#4ade80' }}>Tk {p.total_cost}</strong>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: '11px', color: '#64748b' }}>কোনো সাপ্লায়ার লেনদেন রেকর্ড পাওয়া যায়নি।</div>}
            </div>

            <button onClick={() => setSearchHistoryReport(null)} style={{ width: '100%', padding: '9px', background: '#222734', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>বন্ধ করুন</button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main style={{ padding: '20px 24px', maxWidth: '1600px', margin: '0 auto', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        
        {/* 1. POS BILLING TAB */}
        {activeTab === 'pos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '20px', alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <input
                  type="text"
                  placeholder="পণ্য বা পার্টসের নাম / SKU দিয়ে খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 1, minWidth: '260px', padding: '9px 12px', background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', color: '#f8fafc', fontSize: '12px' }}
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', border: '1px solid', borderColor: selectedCategory === cat ? '#dc2626' : '#282d3c', background: selectedCategory === cat ? '#dc2626' : '#181b24', color: selectedCategory === cat ? '#ffffff' : '#94a3b8', cursor: 'pointer' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px' }}>
                {filteredCatalog.map((p) => {
                  const isLow = p.stock <= p.min_stock;
                  return (
                    <div key={p.id} style={{ background: '#181b24', border: '1px solid #282d3c', borderLeft: isLow ? '3px solid #dc2626' : '1px solid #282d3c', borderRadius: '6px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>{p.sku}</span>
                          <span style={{ fontSize: '11px', color: isLow ? '#ef4444' : '#64748b' }}>Stock: {p.stock}</span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.4' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '3px' }}>Reseller Rate: Tk {p.reseller_base_price}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #202430' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>Tk {Number(p.selling_price).toLocaleString()}</div>
                        <button onClick={() => addToCart(p)} style={{ padding: '6px 12px', background: '#222734', border: '1px solid #333b4f', borderRadius: '4px', color: '#f8fafc', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ Add</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Billing Register Counter */}
            <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
              <div style={{ borderBottom: '1px solid #282d3c', paddingBottom: '10px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>INVOICE REGISTER</span>
                <div style={{ display: 'flex', background: '#0f1117', padding: '2px', borderRadius: '4px', border: '1px solid #282d3c' }}>
                  <button onClick={() => setOrderType('direct')} style={{ padding: '4px 10px', border: 'none', borderRadius: '3px', fontSize: '11px', cursor: 'pointer', background: orderType === 'direct' ? '#dc2626' : 'transparent', color: orderType === 'direct' ? '#fff' : '#94a3b8' }}>Direct Sale</button>
                  <button onClick={() => setOrderType('reseller')} style={{ padding: '4px 10px', border: 'none', borderRadius: '3px', fontSize: '11px', cursor: 'pointer', background: orderType === 'reseller' ? '#2563eb' : 'transparent', color: orderType === 'reseller' ? '#fff' : '#94a3b8' }}>Reseller Order</button>
                </div>
              </div>

              {orderType === 'reseller' && (
                <div style={{ background: '#1e293b', border: '1px solid #3b82f6', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#93c5fd', fontWeight: '600', marginBottom: '4px' }}>অর্ডারকারী রিসেলার নির্বাচন করুন:</div>
                  <select
                    value={selectedResellerId}
                    onChange={(e) => setSelectedResellerId(e.target.value)}
                    style={{ width: '100%', padding: '6px', background: '#0f1117', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '12px', marginBottom: '6px' }}
                  >
                    {resellers.map(r => (
                      <option key={r.id} value={r.id}>{r.name} — Page: {r.company || r.name} ({r.phone})</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '6px 8px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>রিসেলারের প্রফিট কমিশন:</span>
                    <strong style={{ fontSize: '13px', color: '#4ade80' }}>+ Tk {totalResellerProfit.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <input placeholder="কাস্টমারের ফোন নম্বর *" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ padding: '8px 10px', background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input placeholder="কাস্টমারের নাম" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ flex: 1, padding: '8px 10px', background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }} />
                  <input placeholder="বাইক নম্বর" value={bikeNumber} onChange={(e) => setBikeNumber(e.target.value)} style={{ flex: 1, padding: '8px 10px', background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }} />
                </div>
              </div>

              {/* Cart Table */}
              <div style={{ borderTop: '1px solid #282d3c', borderBottom: '1px solid #282d3c', padding: '8px 0', minHeight: '130px', maxHeight: '170px', overflowY: 'auto', marginBottom: '10px' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#475569', fontSize: '12px' }}>কার্ট সম্পূর্ণ খালি</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ color: '#64748b', fontSize: '10px', textAlign: 'left' }}>
                        <th>আইটেম</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>বিক্রি দর</th>
                        <th style={{ textAlign: 'right' }}>মোট</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #1f2330' }}>
                          <td style={{ padding: '6px 0', color: '#f1f5f9' }}>
                            <div>{item.name}</div>
                            {orderType === 'reseller' && <span style={{ fontSize: '10px', color: '#38bdf8' }}>Base: {item.reseller_base_price}</span>}
                          </td>
                          <td style={{ padding: '6px 0', textAlign: 'center' }}>
                            <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '1px 5px', background: '#0f1117', border: '1px solid #282d3c', color: '#94a3b8' }}>-</button>
                            <span style={{ padding: '0 5px', color: '#f8fafc' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '1px 5px', background: '#0f1117', border: '1px solid #282d3c', color: '#94a3b8' }}>+</button>
                          </td>
                          <td style={{ padding: '6px 0', textAlign: 'right' }}>
                            <input
                              type="number"
                              value={item.customer_price}
                              onChange={(e) => updateCustomerPrice(item.id, e.target.value)}
                              style={{ width: '55px', padding: '2px 4px', background: '#0f1117', border: '1px solid #334155', color: '#4ade80', fontSize: '11px', textAlign: 'right', borderRadius: '3px' }}
                            />
                          </td>
                          <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600', color: '#f8fafc' }}>Tk {item.subtotal}</td>
                          <td style={{ padding: '6px 0 6px 4px', textAlign: 'right' }}>
                            <button onClick={() => removeItem(item.id)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {['cash', 'bkash', 'nagad', 'rocket', 'bank'].map((m) => (
                  <button key={m} type="button" onClick={() => setPaymentMethod(m)} style={{ padding: '6px 0', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize', border: '1px solid', borderColor: paymentMethod === m ? '#dc2626' : '#282d3c', background: paymentMethod === m ? '#2d1417' : '#0f1117', color: paymentMethod === m ? '#f87171' : '#94a3b8', cursor: 'pointer' }}>
                    {m}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Customer Total:</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>Tk {finalPayable.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: '11px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}>
                {loading ? 'Processing...' : 'সম্পূর্ণ করুন ও ডাটাবেজে সংরক্ষণ'}
              </button>
            </div>
          </div>
        )}

        {/* 2. FINANCIAL REPORTS */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#181b24', border: '1px solid #282d3c', padding: '14px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>মোট বিক্রি (Invoices)</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>
                  Tk {salesRecords.reduce((s, i) => s + Number(i.paid_amount || 0), 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: '#181b24', border: '1px solid #282d3c', padding: '14px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>স্টক ক্রয় খরচ (Purchases)</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
                  Tk {purchaseLedger.reduce((s, i) => s + Number(i.total_cost || 0), 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: '#181b24', border: '1px solid #282d3c', padding: '14px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>দোকানের খরচ (Expenses)</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
                  Tk {expenses.reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: '#181b24', border: '1px solid #282d3c', padding: '14px', borderRadius: '6px', borderLeft: '3px solid #22c55e' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>সর্বমোট প্রফিট</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#4ade80', marginTop: '4px' }}>
                  Tk {salesRecords.reduce((s, i) => s + Number(i.profit || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>লাইভ সেলস হিস্ট্রি (ডাটাবেজ থেকে)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#11131a', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>তারিখ</th>
                      <th style={{ padding: '6px' }}>ইনভয়েস</th>
                      <th style={{ padding: '6px' }}>কাস্টমার ও বাইক</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>টাকা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesRecords.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #1f2330' }}>
                        <td style={{ padding: '6px', color: '#64748b' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '6px', color: '#38bdf8' }}>#{s.invoice_number}</td>
                        <td style={{ padding: '6px', color: '#fff' }}>{s.customer_name} ({s.bike_number})</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: '700', color: '#fff' }}>Tk {Number(s.paid_amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>+ Record Shop Expense</div>
                <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  <input placeholder="Expense Title *" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} style={{ flex: 1.5, padding: '7px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '11px' }} />
                  <input placeholder="Tk *" type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} style={{ width: '70px', padding: '7px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '11px' }} />
                  <button type="submit" style={{ padding: '7px 12px', background: '#dc2626', border: 'none', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Add</button>
                </form>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} style={{ borderBottom: '1px solid #1f2330' }}>
                        <td style={{ padding: '6px', color: '#64748b' }}>{new Date(e.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '6px', color: '#fff' }}>{e.title}</td>
                        <td style={{ padding: '6px', textAlign: 'right', color: '#ef4444', fontWeight: '700' }}>Tk {Number(e.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. WORKSHOP KANBAN */}
        {activeTab === 'workshop' && (
          <div>
            <form onSubmit={addJobCard} style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '14px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 1.2fr auto', gap: '8px' }}>
              <input placeholder="গাড়ির নম্বর *" value={newJobBike} onChange={(e) => setNewJobBike(e.target.value)} style={{ padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '12px' }} />
              <input placeholder="গ্রাহকের নাম" value={newJobCustomer} onChange={(e) => setNewJobCustomer(e.target.value)} style={{ padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '12px' }} />
              <input placeholder="সার্ভিস কাজ *" value={newJobService} onChange={(e) => setNewJobService(e.target.value)} style={{ padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '12px' }} />
              <input placeholder="মেকানিক" value={newJobMechanic} onChange={(e) => setNewJobMechanic(e.target.value)} style={{ padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '12px' }} />
              <button type="submit" style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>জব কার্ড সেভ</button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {['Queued', 'In Progress', 'Washing & Final QC', 'Ready'].map((col) => (
                <div key={col} style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', minHeight: '440px', padding: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', borderBottom: '1px solid #282d3c', paddingBottom: '8px', marginBottom: '10px' }}>{col}</div>
                  {jobCards.filter((j) => j.status === col).map((job) => (
                    <div key={job.id} style={{ background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', padding: '10px', marginBottom: '8px' }}>
                      <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '12px' }}>{job.bike_number}</div>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', margin: '4px 0' }}>{job.service_type}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>Tech: {job.mechanic_name}</div>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {['Queued', 'In Progress', 'Washing & Final QC', 'Ready'].map((st) => st !== job.status && (
                          <button key={st} onClick={() => updateJobStatus(job.id, st)} style={{ flex: 1, padding: '2px 0', background: '#181b24', border: '1px solid #282d3c', color: '#94a3b8', fontSize: '9px', cursor: 'pointer' }}>➔ {st.slice(0, 5)}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. STOCK & SOURCING */}
        {activeTab === 'inventory' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
            <form onSubmit={handleAddProduct} style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>স্টক ইনওয়ার্ড (মাল ক্রয়)</div>
              <input placeholder="পণ্যের নাম *" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <input placeholder="কেনা দাম *" type="number" value={newProdCost} onChange={(e) => setNewProdCost(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }} />
                <input placeholder="রিসেলার রেট" type="number" value={newProdResellerRate} onChange={(e) => setNewProdResellerRate(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }} />
                <input placeholder="বিক্রি দাম *" type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }} />
              </div>
              <input placeholder="স্টক পরিমাণ *" type="number" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box' }} />
              <input placeholder="মহাজন / সাপ্লায়ারের নাম" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '12px', boxSizing: 'border-box' }} />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>ডাটাবেজে যুক্ত করুন</button>
            </form>

            <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginBottom: '12px' }}>পার্টস ক্রয় ও মহাজন লেজার</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#11131a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>তারিখ</th>
                    <th style={{ padding: '8px' }}>সাপ্লায়ার</th>
                    <th style={{ padding: '8px' }}>পরিমাণ</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>মোট কেনা খরচ</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseLedger.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #1f2330' }}>
                      <td style={{ padding: '8px', color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '8px', color: '#94a3b8' }}>{p.supplier_name}</td>
                      <td style={{ padding: '8px' }}>{p.quantity}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: '#f59e0b' }}>Tk {Number(p.total_cost).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. FB CHATBOT ORDERS */}
        {activeTab === 'fb_orders' && (
          <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>ফেসবুক মেসেঞ্জার চ্যাটবট অর্ডার ডেস্কে আসা অর্ডার</div>
              <button onClick={fetchAllData} style={{ padding: '6px 12px', background: '#222734', border: '1px solid #333b4f', color: '#38bdf8', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>🔄 Refresh Orders</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#11131a', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>আইডি</th>
                  <th style={{ padding: '8px' }}>কাস্টমার ও ফোন</th>
                  <th style={{ padding: '8px' }}>অর্ডারকৃত পণ্য</th>
                  <th style={{ padding: '8px' }}>ডেলিভারি ঠিকানা</th>
                  <th style={{ padding: '8px' }}>স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {fbOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #1f2330' }}>
                    <td style={{ padding: '8px', color: '#64748b' }}>#{o.id}</td>
                    <td style={{ padding: '8px', color: '#fff', fontWeight: '600' }}>{o.customer_name} ({o.customer_phone})</td>
                    <td style={{ padding: '8px', color: '#38bdf8' }}>{o.items_ordered}</td>
                    <td style={{ padding: '8px', color: '#94a3b8' }}>{o.delivery_address}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: '700', background: '#2d1417', color: '#f87171' }}>{o.order_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* PRINTABLE INVOICE MODAL */}
      {completedInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '100%', color: '#0f172a' }}>
            <div ref={invoicePdfRef} style={{ padding: '16px', background: '#fff' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>MODX BIKE MART</h2>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Invoice #{completedInvoice.invoice_id} | {completedInvoice.date}</div>
              </div>
              <div style={{ fontSize: '12px', marginBottom: '12px', lineHeight: '1.6' }}>
                <div><strong>Customer:</strong> {completedInvoice.customer_name} ({completedInvoice.customer_phone})</div>
                <div><strong>Vehicle:</strong> {completedInvoice.bike_number}</div>
                <div><strong>Payment:</strong> {completedInvoice.payment_method}</div>
              </div>
              <div style={{ borderTop: '2px solid #0f172a', paddingTop: '8px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                <span>Net Payable:</span>
                <span>Tk {completedInvoice.paid_amount.toLocaleString()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={downloadInvoicePDF} style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>💾 Save PDF</button>
              <button onClick={() => setCompletedInvoice(null)} style={{ padding: '10px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ background: '#11131a', borderTop: '1px solid #282d3c', padding: '14px 24px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
        © {new Date().getFullYear()} <strong style={{ color: '#f8fafc' }}>ModX - Bike Modification Mart</strong>. All Rights Reserved. System Developed by <strong style={{ color: '#dc2626' }}>Md Raihan - AlaapAi</strong>
      </footer>
    </div>
  );
}