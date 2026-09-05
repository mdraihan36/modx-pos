import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Professional Default Fallback Data
const DEMO_PRODUCTS = [
  { id: 1, name: 'Engine Oil 10W-30 (Mobil 1L)', sku: 'OIL-10W30-01', category: 'Lubricants', cost_price: 520, reseller_base_price: 580, selling_price: 650, stock: 24, min_stock: 5 },
  { id: 2, name: 'Disc Brake Pad (Front Dual Piston)', sku: 'BRK-PAD-02', category: 'Braking System', cost_price: 320, reseller_base_price: 380, selling_price: 450, stock: 18, min_stock: 4 },
  { id: 3, name: 'High Flow Air Filter (Racing Spec)', sku: 'FLT-AIR-03', category: 'Intake System', cost_price: 400, reseller_base_price: 460, selling_price: 550, stock: 3, min_stock: 5 },
  { id: 4, name: 'Laser Iridium Spark Plug', sku: 'IGN-SPK-04', category: 'Ignition', cost_price: 280, reseller_base_price: 320, selling_price: 380, stock: 35, min_stock: 8 },
  { id: 5, name: 'Heavy Duty Drive Chain Set (O-Ring)', sku: 'DRV-CHN-05', category: 'Drivetrain', cost_price: 2200, reseller_base_price: 2500, selling_price: 2850, stock: 4, min_stock: 3 },
  { id: 6, name: 'LED Projector Fog Lamp Assembly', sku: 'ELE-LGT-06', category: 'Electrical', cost_price: 1450, reseller_base_price: 1650, selling_price: 1950, stock: 10, min_stock: 2 }
];

const DEMO_SALES = [
  { id: 9101, created_at: '2026-09-03', invoice_number: 'INV-9101', bike_number: 'DHAKA-METRO-HA-1234', customer_name: 'Tanvir Rahman', paid_amount: 1100, profit: 260 },
  { id: 9102, created_at: '2026-09-04', invoice_number: 'INV-9102', bike_number: 'DHAKA-METRO-LA-5678', customer_name: 'Rafiqul Islam', paid_amount: 2850, profit: 650 }
];

const DEMO_PURCHASES = [
  { id: 1, created_at: '2026-09-04', product_name: 'Engine Oil 10W-30 (Mobil 1L)', supplier_name: 'Padma Oil Distributors', supplier_phone: '01711000000', quantity: 30, purchase_price: 520, total_cost: 15600 }
];

const DEMO_EXPENSES = [
  { id: 1, created_at: '2026-09-04', title: 'Workshop Daily Utility', category: 'General', amount: 850 },
  { id: 2, created_at: '2026-09-01', title: 'Workshop Rent', category: 'Rent', amount: 25000 }
];

const DEMO_JOBS = [
  { id: 1001, bike_number: 'DHAKA-METRO-HA-1234', customer_name: 'Tanvir Rahman', service_type: 'Full Engine Overhaul & Tuning', mechanic_name: 'Md. Karim', status: 'In Progress' },
  { id: 1002, bike_number: 'DHAKA-METRO-LA-5678', customer_name: 'Rafiqul Islam', service_type: 'Periodic Maintenance Service', mechanic_name: 'Md. Rahim', status: 'Queued' }
];

const DEMO_DEALERS = [
  { id: 101, name: 'Rafiqul Motors', company: 'Rafiqul Enterprise', phone: '01711223344', total_supplied: 85000, total_paid: 50000, current_due: 35000 }
];

const DEMO_RESELLERS = [
  { id: 201, name: 'Tanvir Hossain', company: 'MotoZone BD', phone: '01899112233', payout_method: 'bKash', payout_account: '01899112233', total_earned_profit: 3200, paid_profit: 2000, pending_payout: 1200 },
  { id: 202, name: 'Sabbir Ahmed', company: 'Biker Point Dhaka', phone: '01755667788', payout_method: 'Bank Transfer', payout_account: 'City Bank (1502938471)', total_earned_profit: 4500, paid_profit: 4500, pending_payout: 0 }
];

const DEMO_DELIVERIES = [
  { id: 1, courier_name: 'Steadfast', tracking_code: 'STF-849201', recipient_name: 'Rakibul Hasan', recipient_phone: '01711998877', recipient_address: 'Sector 7, Uttara, Dhaka', cod_amount: 1950, delivery_status: 'In Transit', reseller_page: 'MotoZone BD' },
  { id: 2, courier_name: 'Sundarban', tracking_code: 'SBD-592014', recipient_name: 'Mahmudul Karim', recipient_phone: '01822334455', recipient_address: 'Chawkbazar, Chittagong', cod_amount: 1300, delivery_status: 'Delivered', reseller_page: 'Direct Sale' }
];

const DEMO_FB_ORDERS = [
  { id: 1, customer_name: 'Kabir Ahmed', customer_phone: '01700112233', items_ordered: 'Laser Iridium Spark Plug (2 Pcs)', delivery_address: 'Mirpur 10, Dhaka', order_status: 'Pending Review' }
];

export default function App() {
  // Theme Toggle: dark or light
  const [theme, setTheme] = useState(localStorage.getItem('modx_theme') || 'dark');
  
  const isDark = theme === 'dark';
  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('modx_theme', nextTheme);
  };

  // Dynamic Theme Colors
  const themeStyles = {
    bg: isDark ? '#090d16' : '#f8fafc',
    cardBg: isDark ? '#0f172a' : '#ffffff',
    innerBg: isDark ? '#020617' : '#f1f5f9',
    border: isDark ? '#1e293b' : '#e2e8f0',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#64748b' : '#64748b',
    headerBg: isDark ? '#0f172a' : '#ffffff',
    tableBorder: isDark ? '#1e293b' : '#e2e8f0',
    primary: '#e11d48'
  };

  const [activeTab, setActiveTab] = useState('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Search History
  const [globalSearchInput, setGlobalSearchInput] = useState('');
  const [searchHistoryReport, setSearchHistoryReport] = useState(null);
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);

  // States
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [salesRecords, setSalesRecords] = useState(DEMO_SALES);
  const [purchaseLedger, setPurchaseLedger] = useState(DEMO_PURCHASES);
  const [expenses, setExpenses] = useState(DEMO_EXPENSES);
  const [jobCards, setJobCards] = useState(DEMO_JOBS);
  const [dealers, setDealers] = useState(DEMO_DEALERS);
  const [resellers, setResellers] = useState(DEMO_RESELLERS);
  const [deliveries, setDeliveries] = useState(DEMO_DELIVERIES);
  const [fbOrders, setFbOrders] = useState(DEMO_FB_ORDERS);

  // POS State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('direct');
  const [selectedResellerId, setSelectedResellerId] = useState(201);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bikeNumber, setBikeNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Payment
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

  const fetchAllData = async () => {
    try {
      const res = await fetch('/api/bootstrap-data');
      if (!res.ok) return;
      const data = await res.json();
      if (data.products?.length) setProducts(data.products);
      if (data.invoices?.length) setSalesRecords(data.invoices);
      if (data.purchases?.length) setPurchaseLedger(data.purchases);
      if (data.expenses?.length) setExpenses(data.expenses);
      if (data.jobCards?.length) setJobCards(data.jobCards);
      if (data.dealers?.length) setDealers(data.dealers);
      if (data.resellers?.length) {
        setResellers(data.resellers);
        setSelectedResellerId(data.resellers[0].id);
      }
      if (data.deliveries?.length) setDeliveries(data.deliveries);
      if (data.fbOrders?.length) setFbOrders(data.fbOrders);
    } catch (err) {
      console.warn('Connected to local storage view. Server booting.');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleUniversalSearch = async () => {
    if (!globalSearchInput.trim()) return alert('Please enter phone or bike registration number');
    setIsSearchingHistory(true);
    try {
      const res = await fetch(`/api/search-history?q=${encodeURIComponent(globalSearchInput.trim())}`);
      const data = await res.json();
      setSearchHistoryReport(data);
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve history');
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
  const finalPayable = totalCustomerPayable;

  const handleCheckout = async () => {
    if (!customerPhone.trim()) return alert('Customer phone number required');
    if (cart.length === 0) return alert('Cart is empty');

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
      if (res.ok) fetchAllData();
    } catch (err) {
      console.warn('Saved in offline session mode');
    }

    setSalesRecords([{ id: Date.now(), created_at: new Date().toISOString().split('T')[0], ...invoicePayload }, ...salesRecords]);
    setCompletedInvoice({ ...invoicePayload, invoice_id: invoiceNum, date: new Date().toLocaleString() });
    setCart([]);
    setBikeNumber('');
    setCustomerName('');
    setCustomerPhone('');
    setLoading(false);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProdName || !newProdCost || !newProdPrice || !newProdStock) return alert('Fill required product fields');

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
      if (res.ok) fetchAllData();
    } catch (err) {
      console.warn('Added to local catalog session');
    }

    setProducts([{ id: Date.now(), ...payload }, ...products]);
    setPurchaseLedger([{ id: Date.now(), created_at: new Date().toISOString().split('T')[0], product_name: payload.name, supplier_name: payload.supplier_name, quantity: payload.stock, total_cost: payload.cost_price * payload.stock }, ...purchaseLedger]);
    setNewProdName(''); setNewProdSKU(''); setNewProdCost(''); setNewProdResellerRate(''); setNewProdPrice(''); setNewProdStock(''); setNewSupplierName('');
    alert('Stock added successfully');
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return alert('Enter expense title and amount');
    const newExp = { id: Date.now(), created_at: new Date().toISOString().split('T')[0], title: expenseTitle, category: expenseCategory, amount: Number(expenseAmount) };
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExp)
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.warn('Expense tracked locally');
    }
    setExpenses([newExp, ...expenses]);
    setExpenseTitle(''); setExpenseAmount('');
    alert('Expense recorded');
  };

  const addJobCard = async (e) => {
    e.preventDefault();
    if (!newJobBike.trim() || !newJobService.trim()) return alert('Registration and service type required');
    const newJ = {
      id: Date.now(),
      bike_number: newJobBike.toUpperCase(),
      customer_name: newJobCustomer || 'Client',
      service_type: newJobService,
      mechanic_name: newJobMechanic || 'Master Technician',
      status: 'Queued'
    };
    try {
      const res = await fetch('/api/workshop/jobcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJ)
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.warn('Job queued locally');
    }
    setJobCards([newJ, ...jobCards]);
    setNewJobBike(''); setNewJobCustomer(''); setNewJobService(''); setNewJobMechanic('');
  };

  const updateJobStatus = async (id, newStatus) => {
    setJobCards(jobCards.map(j => j.id === id ? { ...j, status: newStatus } : j));
    try {
      await fetch(`/api/workshop/jobcard/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.warn('Status synchronized');
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
      pdf.save(`Invoice_${completedInvoice.invoice_id}.pdf`);
    });
  };

  const filteredCatalog = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ background: themeStyles.bg, color: themeStyles.textMain, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", transition: 'background 0.2s, color 0.2s' }}>
      
      {/* NAVBAR */}
      <header style={{ background: themeStyles.headerBg, borderBottom: `1px solid ${themeStyles.border}`, padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.8px', color: themeStyles.textMain }}>
            MODX <span style={{ color: themeStyles.primary, fontSize: '11px', fontWeight: '700', border: `1px solid ${themeStyles.primary}`, padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>CORE ERP</span>
          </div>
          <div style={{ fontSize: '11px', color: themeStyles.textMuted, fontWeight: '500', marginTop: '2px' }}>
            Automotive Enterprise Resource Planning Terminal
          </div>
        </div>

        {/* Global Search */}
        <div style={{ display: 'flex', gap: '6px', width: '360px' }}>
          <input 
            type="text"
            placeholder="Search phone or registration..."
            value={globalSearchInput}
            onChange={(e) => setGlobalSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUniversalSearch()}
            style={{ flex: 1, padding: '8px 14px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', color: themeStyles.textMain, fontSize: '12px', outline: 'none' }}
          />
          <button 
            onClick={handleUniversalSearch}
            style={{ padding: '8px 16px', background: themeStyles.primary, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            {isSearchingHistory ? '...' : 'Search'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Navigation Controls */}
          <nav style={{ display: 'flex', background: themeStyles.innerBg, padding: '4px', borderRadius: '8px', border: `1px solid ${themeStyles.border}`, gap: '3px' }}>
            {[
              { id: 'pos', label: 'Terminal' },
              { id: 'reports', label: 'Ledger Audit' },
              { id: 'dealers', label: 'B2B Dealers' },
              { id: 'resellers', label: 'Resellers' },
              { id: 'courier', label: 'Fulfillment' },
              { id: 'workshop', label: 'Job Cards' },
              { id: 'inventory', label: 'Procurement' },
              { id: 'fb_orders', label: `Messenger (${fbOrders.length})` }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeTab === t.id ? themeStyles.primary : 'transparent',
                  color: activeTab === t.id ? '#ffffff' : themeStyles.textMuted,
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Theme Switcher Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              background: themeStyles.innerBg,
              border: `1px solid ${themeStyles.border}`,
              color: themeStyles.textMain,
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: 'pointer'
            }}
          >
            {isDark ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      {/* SEARCH REPORT MODAL */}
      {searchHistoryReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200, padding: '24px' }}>
          <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '10px', padding: '24px', maxWidth: '850px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: themeStyles.textMain }}>
                Query Record: <span style={{ color: '#0ea5e9' }}>{searchHistoryReport.query}</span>
              </div>
              <button onClick={() => setSearchHistoryReport(null)} style={{ background: 'transparent', border: 'none', color: themeStyles.textMuted, fontSize: '16px', cursor: 'pointer' }}>Close</button>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: themeStyles.textMuted, marginBottom: '8px' }}>Matching Invoices ({searchHistoryReport.invoices?.length || 0})</div>
              {searchHistoryReport.invoices?.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: themeStyles.innerBg, color: themeStyles.textMuted, textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Date</th>
                      <th style={{ padding: '8px' }}>Invoice</th>
                      <th style={{ padding: '8px' }}>Client</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchHistoryReport.invoices.map(inv => (
                      <tr key={inv.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                        <td style={{ padding: '8px', color: themeStyles.textMuted }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '8px', color: '#0ea5e9' }}>#{inv.invoice_number}</td>
                        <td style={{ padding: '8px', color: themeStyles.textMain }}>{inv.customer_name} ({inv.bike_number})</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#10b981', fontWeight: '700' }}>Tk {inv.paid_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ fontSize: '12px', color: themeStyles.textMuted }}>No matching logs.</div>}
            </div>

            <button onClick={() => setSearchHistoryReport(null)} style={{ width: '100%', padding: '10px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* WORKSPACE CONTENT */}
      <main style={{ padding: '24px 28px', maxWidth: '1600px', margin: '0 auto', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        
        {/* TAB 1: TERMINAL / POS */}
        {activeTab === 'pos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: '24px', alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <input
                  type="text"
                  placeholder="Filter inventory by name, SKU or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 1, minWidth: '280px', padding: '10px 14px', background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', color: themeStyles.textMain, fontSize: '12px', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: '1px solid', borderColor: selectedCategory === cat ? themeStyles.primary : themeStyles.border, background: selectedCategory === cat ? themeStyles.primary : themeStyles.cardBg, color: selectedCategory === cat ? '#ffffff' : themeStyles.textMuted, cursor: 'pointer' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {filteredCatalog.map((p) => {
                  const isLow = p.stock <= p.min_stock;
                  return (
                    <div key={p.id} style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderTop: isLow ? '2px solid #ef4444' : `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '10px', color: themeStyles.textMuted, fontWeight: '700', letterSpacing: '0.5px' }}>{p.sku}</span>
                          <span style={{ fontSize: '11px', color: isLow ? '#ef4444' : themeStyles.textMuted, fontWeight: '600' }}>Units: {p.stock}</span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: themeStyles.textMain, lineHeight: '1.4' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: '#0ea5e9', marginTop: '4px' }}>Reseller Cost: Tk {p.reseller_base_price}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${themeStyles.border}` }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: themeStyles.textMain }}>Tk {Number(p.selling_price).toLocaleString()}</div>
                        <button onClick={() => addToCart(p)} style={{ padding: '6px 14px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', color: themeStyles.textMain, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Add</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BILLING TERMINAL */}
            <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '20px' }}>
              <div style={{ borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', color: themeStyles.textMain }}>Terminal Register</span>
                <div style={{ display: 'flex', background: themeStyles.innerBg, padding: '2px', borderRadius: '6px', border: `1px solid ${themeStyles.border}` }}>
                  <button onClick={() => setOrderType('direct')} style={{ padding: '5px 12px', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', background: orderType === 'direct' ? themeStyles.primary : 'transparent', color: orderType === 'direct' ? '#fff' : themeStyles.textMuted }}>Direct</button>
                  <button onClick={() => setOrderType('reseller')} style={{ padding: '5px 12px', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', background: orderType === 'reseller' ? '#2563eb' : 'transparent', color: orderType === 'reseller' ? '#fff' : themeStyles.textMuted }}>Affiliate</button>
                </div>
              </div>

              {orderType === 'reseller' && (
                <div style={{ background: themeStyles.innerBg, border: '1px solid #1e3a8a', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#93c5fd', fontWeight: '600', marginBottom: '6px' }}>Affiliate Partner</div>
                  <select
                    value={selectedResellerId}
                    onChange={(e) => setSelectedResellerId(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '4px', color: themeStyles.textMain, fontSize: '12px', marginBottom: '8px', outline: 'none' }}
                  >
                    {resellers.map(r => (
                      <option key={r.id} value={r.id}>{r.name} - {r.company} ({r.phone})</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: themeStyles.textMuted }}>Commission:</span>
                    <strong style={{ fontSize: '13px', color: '#10b981' }}>Tk {totalResellerProfit.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <input placeholder="Client Phone (Required)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ padding: '10px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', color: themeStyles.textMain, fontSize: '12px', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="Client Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ flex: 1, padding: '10px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', color: themeStyles.textMain, fontSize: '12px', outline: 'none' }} />
                  <input placeholder="Vehicle Reg" value={bikeNumber} onChange={(e) => setBikeNumber(e.target.value)} style={{ flex: 1, padding: '10px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', color: themeStyles.textMain, fontSize: '12px', outline: 'none' }} />
                </div>
              </div>

              {/* Items Table */}
              <div style={{ borderTop: `1px solid ${themeStyles.border}`, borderBottom: `1px solid ${themeStyles.border}`, padding: '10px 0', minHeight: '140px', maxHeight: '180px', overflowY: 'auto', marginBottom: '16px' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: themeStyles.textMuted, fontSize: '12px' }}>Cart Empty</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ color: themeStyles.textMuted, fontSize: '10px', textTransform: 'uppercase', textAlign: 'left' }}>
                        <th>Item</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Unit</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                          <td style={{ padding: '8px 0', color: themeStyles.textMain }}>
                            <div>{item.name}</div>
                            {orderType === 'reseller' && <span style={{ fontSize: '10px', color: '#0ea5e9' }}>Rate: {item.reseller_base_price}</span>}
                          </td>
                          <td style={{ padding: '8px 0', textAlign: 'center' }}>
                            <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '1px 6px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '3px' }}>-</button>
                            <span style={{ padding: '0 6px', color: themeStyles.textMain }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '1px 6px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '3px' }}>+</button>
                          </td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>
                            <input
                              type="number"
                              value={item.customer_price}
                              onChange={(e) => updateCustomerPrice(item.id, e.target.value)}
                              style={{ width: '60px', padding: '3px 4px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: '#10b981', fontSize: '11px', textAlign: 'right', borderRadius: '3px', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: themeStyles.textMain }}>Tk {item.subtotal}</td>
                          <td style={{ padding: '8px 0 8px 6px', textAlign: 'right' }}>
                            <button onClick={() => removeItem(item.id)} style={{ background: 'transparent', border: 'none', color: themeStyles.textMuted, cursor: 'pointer' }}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Settlement Method Select */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '14px' }}>
                {['cash', 'bkash', 'nagad', 'rocket', 'bank'].map((m) => (
                  <button key={m} type="button" onClick={() => setPaymentMethod(m)} style={{ padding: '7px 0', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid', borderColor: paymentMethod === m ? themeStyles.primary : themeStyles.border, background: paymentMethod === m ? (isDark ? '#1e1017' : '#ffe4e6') : themeStyles.innerBg, color: paymentMethod === m ? themeStyles.primary : themeStyles.textMuted, cursor: 'pointer' }}>
                    {m}
                  </button>
                ))}
              </div>

              {paymentMethod === 'bank' && (
                <div style={{ background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', padding: '10px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} style={{ width: '100%', padding: '8px', background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '4px', color: themeStyles.textMain, fontSize: '11px', outline: 'none' }}>
                    {['Islami Bank Bangladesh PLC', 'City Bank PLC', 'BRAC Bank PLC', 'Mutual Trust Bank PLC', 'Eastern Bank PLC'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <input placeholder="Terminal Reference / TrxID" value={bankTxnRef} onChange={(e) => setBankTxnRef(e.target.value)} style={{ width: '100%', padding: '8px', background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '4px', color: themeStyles.textMain, fontSize: '11px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: themeStyles.textMuted, marginBottom: '16px' }}>
                <span style={{ fontSize: '13px' }}>Gross Total:</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: themeStyles.textMain }}>Tk {finalPayable.toLocaleString()}</span>
              </div>

              <button onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: '13px', background: themeStyles.primary, color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {loading ? 'Processing...' : 'Complete & Generate Invoice'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT REPORTS */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, padding: '18px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: themeStyles.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Gross Revenue</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: themeStyles.textMain, marginTop: '6px' }}>
                  Tk {salesRecords.reduce((s, i) => s + Number(i.paid_amount || 0), 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, padding: '18px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: themeStyles.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Procurement Sourcing</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#f59e0b', marginTop: '6px' }}>
                  Tk {purchaseLedger.reduce((s, i) => s + Number(i.total_cost || 0), 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, padding: '18px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: themeStyles.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Operational Overheads</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#ef4444', marginTop: '6px' }}>
                  Tk {expenses.reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, padding: '18px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: themeStyles.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Estimated Gross Margin</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
                  Tk {salesRecords.reduce((s, i) => s + Number(i.profit || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: themeStyles.textMain, marginBottom: '14px' }}>Transaction Ledger</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: themeStyles.innerBg, color: themeStyles.textMuted, textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Date</th>
                      <th style={{ padding: '8px' }}>Ref</th>
                      <th style={{ padding: '8px' }}>Entity</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesRecords.map(s => (
                      <tr key={s.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                        <td style={{ padding: '8px', color: themeStyles.textMuted }}>{s.created_at}</td>
                        <td style={{ padding: '8px', color: '#0ea5e9' }}>#{s.invoice_number}</td>
                        <td style={{ padding: '8px', color: themeStyles.textMain }}>{s.customer_name}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: themeStyles.textMain }}>Tk {Number(s.paid_amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: themeStyles.textMain, marginBottom: '14px' }}>Record Operating Expense</div>
                <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input placeholder="Item title" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} style={{ flex: 1.5, padding: '8px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
                  <input placeholder="Cost" type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} style={{ width: '80px', padding: '8px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
                  <button type="submit" style={{ padding: '8px 14px', background: themeStyles.primary, border: 'none', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Submit</button>
                </form>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                        <td style={{ padding: '8px', color: themeStyles.textMuted }}>{e.created_at}</td>
                        <td style={{ padding: '8px', color: themeStyles.textMain }}>{e.title}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#ef4444', fontWeight: '700' }}>Tk {Number(e.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WORKSHOP KANBAN */}
        {activeTab === 'workshop' && (
          <div>
            <form onSubmit={addJobCard} style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 1.2fr auto', gap: '10px' }}>
              <input placeholder="Registration No." value={newJobBike} onChange={(e) => setNewJobBike(e.target.value)} style={{ padding: '9px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
              <input placeholder="Client Identity" value={newJobCustomer} onChange={(e) => setNewJobCustomer(e.target.value)} style={{ padding: '9px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
              <input placeholder="Job Specification" value={newJobService} onChange={(e) => setNewJobService(e.target.value)} style={{ padding: '9px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
              <input placeholder="Technician" value={newJobMechanic} onChange={(e) => setNewJobMechanic(e.target.value)} style={{ padding: '9px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
              <button type="submit" style={{ padding: '9px 18px', background: themeStyles.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>Open Card</button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {['Queued', 'In Progress', 'Washing & Final QC', 'Ready'].map((col) => (
                <div key={col} style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', minHeight: '440px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: themeStyles.textMain, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '10px', marginBottom: '12px' }}>{col}</div>
                  {jobCards.filter((j) => j.status === col).map((job) => (
                    <div key={job.id} style={{ background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', padding: '12px', marginBottom: '10px' }}>
                      <div style={{ color: themeStyles.primary, fontWeight: '700', fontSize: '12px' }}>{job.bike_number}</div>
                      <div style={{ fontSize: '13px', color: themeStyles.textMain, margin: '6px 0' }}>{job.service_type}</div>
                      <div style={{ fontSize: '11px', color: themeStyles.textMuted, marginBottom: '10px' }}>Tech: {job.mechanic_name}</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['Queued', 'In Progress', 'Washing & Final QC', 'Ready'].map((st) => st !== job.status && (
                          <button key={st} onClick={() => updateJobStatus(job.id, st)} style={{ flex: 1, padding: '3px 0', background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMuted, fontSize: '10px', cursor: 'pointer', borderRadius: '3px' }}>{st.slice(0, 4)}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PROCUREMENT & INVENTORY */}
        {activeTab === 'inventory' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
            <form onSubmit={handleAddProduct} style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: themeStyles.textMain, marginBottom: '14px' }}>Inward Consignment</div>
              <input placeholder="Item Description *" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', marginBottom: '10px', boxSizing: 'border-box', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input placeholder="Inward Cost" type="number" value={newProdCost} onChange={(e) => setNewProdCost(e.target.value)} style={{ flex: 1, padding: '9px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', outline: 'none' }} />
                <input placeholder="Affiliate" type="number" value={newProdResellerRate} onChange={(e) => setNewProdResellerRate(e.target.value)} style={{ flex: 1, padding: '9px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', outline: 'none' }} />
                <input placeholder="MSRP" type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} style={{ flex: 1, padding: '9px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', outline: 'none' }} />
              </div>
              <input placeholder="Total Units *" type="number" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', marginBottom: '10px', boxSizing: 'border-box', outline: 'none' }} />
              <input placeholder="Distributor Name" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none' }} />
              <button type="submit" style={{ width: '100%', padding: '11px', background: themeStyles.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}>Log to Stock</button>
            </form>

            <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: themeStyles.textMain, marginBottom: '14px' }}>Procurement Sourcing Ledger</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: themeStyles.innerBg, color: themeStyles.textMuted, textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Date</th>
                    <th style={{ padding: '8px' }}>Distributor</th>
                    <th style={{ padding: '8px' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Expenditure</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseLedger.map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                      <td style={{ padding: '8px', color: themeStyles.textMuted }}>{p.created_at}</td>
                      <td style={{ padding: '8px', color: themeStyles.textMain }}>{p.supplier_name}</td>
                      <td style={{ padding: '8px' }}>{p.quantity}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: '#f59e0b' }}>Tk {Number(p.total_cost).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: MESSENGER QUEUE */}
        {activeTab === 'fb_orders' && (
          <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: themeStyles.textMain }}>Messenger Dispatch Registry</div>
              <button onClick={fetchAllData} style={{ padding: '6px 14px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: '#0ea5e9', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Refresh Terminal</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: themeStyles.innerBg, color: themeStyles.textMuted, textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Client</th>
                  <th style={{ padding: '10px' }}>SKU Order</th>
                  <th style={{ padding: '10px' }}>Consignee Address</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {fbOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                    <td style={{ padding: '10px', color: themeStyles.textMuted }}>#{o.id}</td>
                    <td style={{ padding: '10px', color: themeStyles.textMain, fontWeight: '600' }}>{o.customer_name} ({o.customer_phone})</td>
                    <td style={{ padding: '10px', color: '#0ea5e9' }}>{o.items_ordered}</td>
                    <td style={{ padding: '10px', color: themeStyles.textMuted }}>{o.delivery_address}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', background: isDark ? '#1e1017' : '#fee2e2', color: themeStyles.primary }}>{o.order_status}</span>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1300, padding: '24px' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '24px', maxWidth: '480px', width: '100%', color: '#0f172a' }}>
            <div ref={invoicePdfRef} style={{ padding: '12px', background: '#fff' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '0.5px' }}>MODX ENTERPRISE</h2>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Invoice #{completedInvoice.invoice_id} | {completedInvoice.date}</div>
              </div>
              <div style={{ fontSize: '12px', marginBottom: '14px', lineHeight: '1.6' }}>
                <div><strong>Client:</strong> {completedInvoice.customer_name} ({completedInvoice.customer_phone})</div>
                <div><strong>Vehicle:</strong> {completedInvoice.bike_number}</div>
                <div><strong>Payment:</strong> {completedInvoice.payment_method}</div>
              </div>
              <div style={{ borderTop: '2px solid #0f172a', paddingTop: '10px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                <span>Payable:</span>
                <span>Tk {completedInvoice.paid_amount.toLocaleString()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={downloadInvoicePDF} style={{ flex: 1, padding: '11px', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Export PDF</button>
              <button onClick={() => setCompletedInvoice(null)} style={{ padding: '11px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ background: themeStyles.innerBg, borderTop: `1px solid ${themeStyles.border}`, padding: '14px 28px', textAlign: 'center', fontSize: '11px', color: themeStyles.textMuted }}>
        ModX Engineering Framework & Terminal Interface.
      </footer>
    </div>
  );
}