import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Bangladeshi Commercial & Islamic Banks
const BD_BANK_LIST = [
  'Islami Bank Bangladesh PLC',
  'BRAC Bank PLC',
  'City Bank PLC',
  'Dutch-Bangla Bank PLC (DBBL)',
  'Eastern Bank PLC (EBL)',
  'Dhaka Bank PLC',
  'Mutual Trust Bank PLC (MTB)',
  'Prime Bank PLC',
  'Pubali Bank PLC',
  'Southeast Bank PLC',
  'Sonali Bank PLC',
  'Social Islami Bank PLC',
  'Standard Chartered Bangladesh'
];

// Fallback Demo Data
const DEMO_PRODUCTS = [
  { id: 1, name: 'Engine Oil 10W-30 (Mobil 1L)', sku: 'OIL-10W30-01', category: 'Lubricants', cost_price: 520, reseller_base_price: 580, selling_price: 650, stock: 24, min_stock: 5 },
  { id: 2, name: 'Disc Brake Pad (Front Dual Piston)', sku: 'BRK-PAD-02', category: 'Braking System', cost_price: 320, reseller_base_price: 380, selling_price: 450, stock: 18, min_stock: 4 },
  { id: 3, name: 'High Flow Air Filter (Racing Spec)', sku: 'FLT-AIR-03', category: 'Intake System', cost_price: 400, reseller_base_price: 460, selling_price: 550, stock: 3, min_stock: 5 },
  { id: 4, name: 'Laser Iridium Spark Plug', sku: 'IGN-SPK-04', category: 'Ignition', cost_price: 280, reseller_base_price: 320, selling_price: 380, stock: 35, min_stock: 8 },
  { id: 5, name: 'Heavy Duty Drive Chain Set (O-Ring)', sku: 'DRV-CHN-05', category: 'Drivetrain', cost_price: 2200, reseller_base_price: 2500, selling_price: 2850, stock: 4, min_stock: 3 },
  { id: 6, name: 'LED Projector Fog Lamp Assembly', sku: 'ELE-LGT-06', category: 'Electrical', cost_price: 1450, reseller_base_price: 1650, selling_price: 1950, stock: 10, min_stock: 2 }
];

const DEMO_SALES = [
  { id: 9101, created_at: '2026-09-03', invoice_number: 'INV-9101', bike_number: 'DHAKA-METRO-HA-1234', customer_name: 'Tanvir Rahman', total_amount: 1100, paid_amount: 1100, due_amount: 0, payment_method: 'CASH' }
];

const DEMO_PURCHASES = [
  { id: 1, created_at: '2026-09-04', product_name: 'Engine Oil 10W-30 (Mobil 1L)', supplier_name: 'Padma Oil Distributors', quantity: 30, purchase_price: 520, total_cost: 15600 }
];

const DEMO_JOBS = [
  { id: 1001, bike_number: 'DHAKA-METRO-HA-1234', customer_name: 'Tanvir Rahman', service_type: 'Full Engine Overhaul & Tuning', mechanic_name: 'Md. Karim', status: 'In Progress' },
  { id: 1002, bike_number: 'DHAKA-METRO-LA-5678', customer_name: 'Rafiqul Islam', service_type: 'Periodic Maintenance Service', mechanic_name: 'Md. Rahim', status: 'Queued' }
];

const DEMO_DEALERS = [
  { id: 101, name: 'Rafiqul Motors', company: 'Rafiqul Enterprise', phone: '01711223344', role: 'DEALER', current_due: 35000 }
];

const DEMO_RESELLERS = [
  { id: 201, name: 'Tanvir Hossain', company: 'MotoZone BD', phone: '01899112233', role: 'RESELLER', pending_payout: 1200 },
  { id: 202, name: 'Sabbir Ahmed', company: 'Biker Point Dhaka', phone: '01755667788', role: 'RESELLER', pending_payout: 3500 }
];

const DEMO_SUPPLIERS = [
  { id: 301, name: 'Padma Oil Distributors', company: 'Padma Oil BD', phone: '01711000000', payable_due: 5600 },
  { id: 302, name: 'Nabila (MotoPrak)', company: 'MotoPrak Enterprise', phone: '01811998877', payable_due: 12000 }
];

const DEMO_DELIVERIES = [
  { id: 1, courier_name: 'Steadfast', tracking_code: 'STF-849201', recipient_name: 'Rakibul Hasan', recipient_phone: '01711998877', cod_amount: 1950, delivery_status: 'In Transit' },
  { id: 2, courier_name: 'Sundarban', tracking_code: 'SBD-592014', recipient_name: 'Mahmudul Karim', recipient_phone: '01822334455', cod_amount: 1300, delivery_status: 'Delivered' }
];

const DEMO_FB_ORDERS = [
  { id: 1, customer_name: 'Kabir Ahmed', customer_phone: '01700112233', items_ordered: 'Laser Iridium Spark Plug', delivery_address: 'Mirpur 10, Dhaka', order_status: 'Pending Review' }
];

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('modx_theme') || 'dark');
  const isDark = theme === 'dark';
  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('modx_theme', nextTheme);
  };

  const themeStyles = {
    bg: isDark ? '#090d16' : '#f8fafc',
    cardBg: isDark ? '#0f172a' : '#ffffff',
    innerBg: isDark ? '#020617' : '#f1f5f9',
    border: isDark ? '#1e293b' : '#cbd5e1',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    headerBg: isDark ? '#0f172a' : '#ffffff',
    primary: '#e11d48'
  };

  // Screen Width Auto-Listener for Perfect Responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tabs: pos, ledger, fb_orders, courier, workshop, inventory, returns, partners
  const [activeTab, setActiveTab] = useState('pos');
  const [categories, setCategories] = useState(['All', 'Lubricants', 'Braking System', 'Intake System', 'Ignition', 'Drivetrain', 'Electrical', 'brake Hose']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Sourced Datasets
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [salesRecords, setSalesRecords] = useState(DEMO_SALES);
  const [purchaseLedger, setPurchaseLedger] = useState(DEMO_PURCHASES);
  const [jobCards, setJobCards] = useState(DEMO_JOBS);
  const [dealers, setDealers] = useState(DEMO_DEALERS);
  const [resellers, setResellers] = useState(DEMO_RESELLERS);
  const [suppliers, setSuppliers] = useState(DEMO_SUPPLIERS);
  const [deliveries, setDeliveries] = useState(DEMO_DELIVERIES);
  const [fbOrders, setFbOrders] = useState(DEMO_FB_ORDERS);
  const [returnsHistory, setReturnsHistory] = useState([]);

  // POS State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('direct');
  const [selectedResellerId, setSelectedResellerId] = useState(201);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bikeNumber, setBikeNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedBank, setSelectedBank] = useState('Islami Bank Bangladesh PLC');
  const [bankTxnRef, setBankTxnRef] = useState('');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const invoicePdfRef = useRef();

  // Stock Inward Inputs
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Lubricants');
  const [newProdCost, setNewProdCost] = useState('');
  const [newProdResellerRate, setNewProdResellerRate] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('Direct Wholesale');

  // Job Cards
  const [newJobBike, setNewJobBike] = useState('');
  const [newJobCustomer, setNewJobCustomer] = useState('');
  const [newJobService, setNewJobService] = useState('');
  const [newJobMechanic, setNewJobMechanic] = useState('');

  // Partner / Category Inputs
  const [partnerType, setPartnerType] = useState('RESELLER');
  const [partnerName, setPartnerName] = useState('');
  const [partnerCompany, setPartnerCompany] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [newCatInput, setNewCatInput] = useState('');

  // Returns
  const [returnType, setReturnType] = useState('SALE_RETURN');
  const [returnRefId, setReturnRefId] = useState('');
  const [returnProductId, setReturnProductId] = useState('');
  const [returnQty, setReturnQty] = useState('');
  const [returnRefundAmt, setReturnRefundAmt] = useState('');
  const [returnReason, setReturnReason] = useState('');

  // Search History
  const [globalSearchInput, setGlobalSearchInput] = useState('');
  const [searchHistoryReport, setSearchHistoryReport] = useState(null);

  const fetchAllData = async () => {
    try {
      const res = await fetch('/api/bootstrap-data');
      if (!res.ok) return;
      const data = await res.json();
      if (data.products?.length) setProducts(data.products);
      if (data.invoices?.length) setSalesRecords(data.invoices);
      if (data.purchases?.length) setPurchaseLedger(data.purchases);
      if (data.jobCards?.length) setJobCards(data.jobCards);
      if (data.dealers?.length) setDealers(data.dealers);
      if (data.resellers?.length) {
        setResellers(data.resellers);
        setSelectedResellerId(data.resellers[0].id);
      }
      if (data.suppliers?.length) setSuppliers(data.suppliers);
      if (data.deliveries?.length) setDeliveries(data.deliveries);
      if (data.fbOrders?.length) setFbOrders(data.fbOrders);
      if (data.returns?.length) setReturnsHistory(data.returns);

      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catList = await catRes.json();
        if (catList?.length) {
          const names = ['All', ...catList.map(c => c.name)];
          setCategories([...new Set(names)]);
        }
      }
    } catch (err) {
      console.warn('Offline session booted.');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleUniversalSearch = async () => {
    if (!globalSearchInput.trim()) return alert('মোবাইল নম্বর অথবা বাইক নম্বর দিন');
    try {
      const res = await fetch(`/api/search-history?q=${encodeURIComponent(globalSearchInput.trim())}`);
      const data = await res.json();
      setSearchHistoryReport(data);
    } catch (err) {
      alert('হিস্ট্রি লোড করতে সমস্যা হয়েছে');
    }
  };

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

  const totalBill = cart.reduce((s, i) => s + i.subtotal, 0);
  const totalResellerBase = cart.reduce((s, i) => s + i.reseller_subtotal, 0);
  const totalCogsForCart = cart.reduce((s, i) => s + i.total_cost, 0);
  const resellerCommission = orderType === 'reseller' ? Math.max(0, totalBill - totalResellerBase) : 0;
  
  const actualPaidAmount = paidAmountInput !== '' ? Number(paidAmountInput) : totalBill;
  const currentDueAmount = Math.max(0, totalBill - actualPaidAmount);

  const handleCheckout = async () => {
    if (!customerPhone.trim()) return alert('কাস্টমারের ফোন নম্বর দেওয়া আবশ্যক!');
    if (!cart.length) return alert('বিলিং কাউন্টার সম্পূর্ণ খালি!');

    setLoading(true);
    const paymentDetails = paymentMethod === 'bank' 
      ? `${selectedBank} (Ref: ${bankTxnRef || 'Card/Online'})` 
      : paymentMethod.toUpperCase();

    const invNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoicePayload = {
      invoice_number: invNum,
      order_type: orderType,
      reseller_info: orderType === 'reseller' ? activeReseller : null,
      reseller_commission: resellerCommission,
      customer_name: customerName || 'সাধারণ ক্রেতা (Walk-in)',
      customer_phone: customerPhone,
      bike_number: bikeNumber || 'N/A',
      items: cart,
      total_amount: totalBill,
      paid_amount: actualPaidAmount,
      due_amount: currentDueAmount,
      total_cogs: totalCogsForCart,
      profit: totalBill - totalCogsForCart,
      payment_method: paymentDetails,
      date: new Date().toLocaleString()
    };

    try {
      const res = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload)
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.warn('Offline session recorded');
    }

    setSalesRecords([invoicePayload, ...salesRecords]);
    setCompletedInvoice(invoicePayload);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setBikeNumber('');
    setPaidAmountInput('');
    setBankTxnRef('');
    setLoading(false);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdCost || !newProdPrice || !newProdStock) {
      return alert('পণ্যের নাম, কেনা দাম, বিক্রয় দর এবং পরিমাণ সবগুলো ঘর পূরণ করুন!');
    }

    const payload = {
      name: newProdName.trim(),
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      category: newProdCategory,
      cost_price: Number(newProdCost),
      reseller_base_price: Number(newProdResellerRate || newProdCost),
      selling_price: Number(newProdPrice),
      stock: Number(newProdStock),
      supplier_name: newSupplierName || 'Direct Wholesale'
    };

    try {
      await fetch('/api/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchAllData();
    } catch (err) {}

    setProducts([{ id: Date.now(), ...payload }, ...products]);
    setNewProdName('');
    setNewProdCost('');
    setNewProdResellerRate('');
    setNewProdPrice('');
    setNewProdStock('');
    alert('পণ্য সফলভাবে ইনভেন্টরিতে যুক্ত হয়েছে!');
  };

  const addJobCard = async (e) => {
    e.preventDefault();
    if (!newJobBike.trim() || !newJobService.trim()) return alert('বাইক নম্বর ও সার্ভিসের বিবরণ দিন');
    const newJ = {
      id: Date.now(),
      bike_number: newJobBike.toUpperCase(),
      customer_name: newJobCustomer || 'কাস্টমার',
      service_type: newJobService,
      mechanic_name: newJobMechanic || 'টেকনিশিয়ান',
      status: 'Queued'
    };
    try {
      await fetch('/api/workshop/jobcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJ)
      });
      fetchAllData();
    } catch (err) {}
    setJobCards([newJ, ...jobCards]);
    setNewJobBike(''); setNewJobCustomer(''); setNewJobService(''); setNewJobMechanic('');
    alert('সার্ভিস জব কার্ড খোলা হয়েছে!');
  };

  const updateJobStatus = async (id, newStatus) => {
    setJobCards(jobCards.map(j => j.id === id ? { ...j, status: newStatus } : j));
    try {
      await fetch(`/api/workshop/jobcard/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {}
  };

  const handleUpdateCourierStatus = async (id, status) => {
    try {
      await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_status: status })
      });
      fetchAllData();
    } catch (err) {}
  };

  const handleUpdateFBStatus = async (id, status) => {
    try {
      await fetch(`/api/facebook-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchAllData();
    } catch (err) {}
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!returnProductId || !returnQty || !returnRefundAmt) return alert('পণ্য, পরিমাণ এবং রিফান্ডের টাকা দিন');

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          return_type: returnType,
          reference_id: returnRefId || 'N/A',
          product_id: Number(returnProductId),
          quantity: Number(returnQty),
          refund_amount: Number(returnRefundAmt),
          reason: returnReason || 'Verified Return'
        })
      });
      if (res.ok) {
        alert('রিটার্ন সম্পন্ন এবং স্টক স্বয়ংক্রিয়ভাবে আপডেট হয়েছে');
        setReturnRefId(''); setReturnQty(''); setReturnRefundAmt(''); setReturnReason('');
        fetchAllData();
      }
    } catch (err) {}
  };

  const handleAddPartner = async (e) => {
    e.preventDefault();
    if (!partnerName.trim() || !partnerPhone.trim()) return alert('নাম এবং ফোন নম্বর দিন');

    try {
      if (partnerType === 'SUPPLIER') {
        await fetch('/api/suppliers/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: partnerName, phone: partnerPhone, company: partnerCompany })
        });
      } else {
        await fetch('/api/partners/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: partnerName,
            company: partnerCompany,
            phone: partnerPhone,
            role: partnerType,
            payout_method: 'bKash'
          })
        });
      }
      alert('সফলভাবে নিবন্ধিত হয়েছে!');
      setPartnerName(''); setPartnerCompany(''); setPartnerPhone('');
      fetchAllData();
    } catch (err) {}
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatInput.trim()) return alert('ক্যাটাগরির নাম দিন');
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatInput.trim() })
      });
      setCategories([...categories, newCatInput.trim()]);
      setNewCatInput('');
      alert('ক্যাটাগরি যুক্ত হয়েছে');
    } catch (err) {}
  };

  const downloadInvoicePDF = () => {
    const input = invoicePdfRef.current;
    html2canvas(input, { scale: 2, backgroundColor: '#ffffff' }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${completedInvoice.invoice_number}.pdf`);
    });
  };

  // Financial Ledger Computations
  const totalReceivableFromDealers = dealers.reduce((acc, d) => acc + Number(d.current_due || 0), 0);
  const totalCustomerDues = salesRecords.reduce((acc, s) => acc + Number(s.due_amount || 0), 0);
  const totalIWillReceive = totalReceivableFromDealers + totalCustomerDues;

  const totalPayableToSuppliers = suppliers.reduce((acc, s) => acc + Number(s.payable_due || 0), 0);
  const totalPayableToResellers = resellers.reduce((acc, r) => acc + Number(r.pending_payout || 0), 0);
  const totalIWillPay = totalPayableToSuppliers + totalPayableToResellers;

  return (
    <div style={{ background: themeStyles.bg, color: themeStyles.textMain, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER / NAVBAR */}
      <header style={{ background: themeStyles.headerBg, borderBottom: `1px solid ${themeStyles.border}`, padding: '12px 16px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800' }}>
              MODX <span style={{ color: themeStyles.primary, fontSize: '11px', fontWeight: '700', border: `1px solid ${themeStyles.primary}`, padding: '1px 5px', borderRadius: '4px' }}>CORE ERP</span>
            </div>
            <div style={{ fontSize: '10px', color: themeStyles.textMuted }}>বাইক মার্সিডিজ POS, ওয়ার্কশপ ও লজিস্টিক সিস্টেম</div>
          </div>
          <button onClick={toggleTheme} style={{ padding: '6px 12px', borderRadius: '6px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            {isDark ? 'লাইট' : 'ডার্ক'}
          </button>
        </div>

        {/* Global Search Bar */}
        <div style={{ display: 'flex', gap: '6px', width: isMobile ? '100%' : '320px' }}>
          <input 
            type="text"
            placeholder="🔍 ফোন বা বাইক নম্বর..."
            value={globalSearchInput}
            onChange={(e) => setGlobalSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUniversalSearch()}
            style={{ flex: 1, padding: '8px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', color: themeStyles.textMain, fontSize: '12px', outline: 'none' }}
          />
          <button onClick={handleUniversalSearch} style={{ padding: '8px 14px', background: themeStyles.primary, border: 'none', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>খুঁজুন</button>
        </div>

        {/* Navigation Tabs (Scrollable on Mobile) */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
          <nav style={{ display: 'flex', background: themeStyles.innerBg, padding: '3px', borderRadius: '8px', border: `1px solid ${themeStyles.border}`, gap: '3px', width: 'max-content' }}>
            {[
              { id: 'pos', label: 'কাউন্টার (POS)' },
              { id: 'ledger', label: 'বকেয়া ও পাওনা খতিয়ান' },
              { id: 'fb_orders', label: `মেসেঞ্জার অর্ডার (${fbOrders.length})` },
              { id: 'courier', label: 'কুরিয়ার ডেলিভারি' },
              { id: 'workshop', label: 'সার্ভিস সেন্টার / জব কার্ড' },
              { id: 'inventory', label: 'স্টক ইনওয়ার্ড (Stock In)' },
              { id: 'returns', label: 'রিটার্ন হাব (Returns)' },
              { id: 'partners', label: 'পার্টনার ও ক্যাটাগরি' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeTab === t.id ? themeStyles.primary : 'transparent',
                  color: activeTab === t.id ? '#ffffff' : themeStyles.textMuted,
                  whiteSpace: 'nowrap'
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* SEARCH REPORT MODAL */}
      {searchHistoryReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200, padding: '16px' }}>
          <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '16px', maxWidth: '800px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>হিস্ট্রি রেকর্ড: <span style={{ color: '#38bdf8' }}>{searchHistoryReport.query}</span></div>
              <button onClick={() => setSearchHistoryReport(null)} style={{ background: 'transparent', border: 'none', color: themeStyles.textMuted, cursor: 'pointer' }}>বন্ধ করুন</button>
            </div>
            <div style={{ fontSize: '12px' }}>
              {searchHistoryReport.invoices?.length > 0 ? (
                searchHistoryReport.invoices.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${themeStyles.border}` }}>
                    <span>#{inv.invoice_number} | {inv.customer_name} ({inv.bike_number})</span>
                    <strong style={{ color: '#10b981' }}>Tk {inv.paid_amount}</strong>
                  </div>
                ))
              ) : <div>কোনো পূর্ববর্তী সেলস রেকর্ড পাওয়া যায়নি।</div>}
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE CONTENT */}
      <main style={{ padding: isMobile ? '12px 8px' : '20px 24px', maxWidth: '1600px', margin: '0 auto', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        
        {/* 1. POS BILLING COUNTER */}
        {activeTab === 'pos' && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: '16px', alignItems: 'flex-start' }}>
            {/* Catalog */}
            <div style={{ flex: 1, width: '100%' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: '1px solid', borderColor: selectedCategory === cat ? themeStyles.primary : themeStyles.border, background: selectedCategory === cat ? themeStyles.primary : themeStyles.cardBg, color: selectedCategory === cat ? '#fff' : themeStyles.textMuted, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {products.filter(p => selectedCategory === 'All' || p.category === selectedCategory).map((p) => (
                  <div key={p.id} style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: themeStyles.textMuted }}>{p.sku} | স্টক: {p.stock}</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: themeStyles.textMain, margin: '4px 0', lineHeight: '1.3' }}>{p.name}</div>
                      <div style={{ fontSize: '10px', color: '#0ea5e9' }}>রিসেলার রেট: Tk {p.reseller_base_price}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '6px', marginTop: '8px' }}>
                      <strong style={{ fontSize: '13px', color: themeStyles.textMain }}>Tk {p.selling_price}</strong>
                      <button onClick={() => addToCart(p)} style={{ padding: '6px 10px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '4px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}>+ যোগ করুন</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BILLING DESK */}
            <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '16px', width: isMobile ? '100%' : '440px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>ক্যাশ মেমো ও বিলিং</span>
                <div style={{ display: 'flex', background: themeStyles.innerBg, padding: '2px', borderRadius: '6px', border: `1px solid ${themeStyles.border}` }}>
                  <button onClick={() => setOrderType('direct')} style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', background: orderType === 'direct' ? themeStyles.primary : 'transparent', color: orderType === 'direct' ? '#fff' : themeStyles.textMuted }}>ডাইরেক্ট</button>
                  <button onClick={() => setOrderType('reseller')} style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', background: orderType === 'reseller' ? '#2563eb' : 'transparent', color: orderType === 'reseller' ? '#fff' : themeStyles.textMuted }}>রিসেলার</button>
                </div>
              </div>

              {orderType === 'reseller' && (
                <div style={{ background: themeStyles.innerBg, border: '1px solid #1e3a8a', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}>
                  <select
                    value={selectedResellerId}
                    onChange={(e) => setSelectedResellerId(e.target.value)}
                    style={{ width: '100%', padding: '7px', background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '4px', fontSize: '11px', outline: 'none', marginBottom: '4px' }}
                  >
                    {resellers.map(r => <option key={r.id} value={r.id}>{r.name} ({r.company})</option>)}
                  </select>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: themeStyles.textMuted }}>রিসেলারের প্রফিট কমিশন:</span>
                    <strong style={{ color: '#10b981' }}>+ Tk {resellerCommission.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                <input placeholder="কাস্টমারের মোবাইল নম্বর *" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px' }} />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input placeholder="কাস্টমারের নাম" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ flex: 1, padding: '8px 10px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '12px' }} />
                  <input placeholder="বাইক নম্বর" value={bikeNumber} onChange={(e) => setBikeNumber(e.target.value)} style={{ flex: 1, padding: '8px 10px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '12px' }} />
                </div>
              </div>

              {/* Cart List */}
              <div style={{ minHeight: '90px', maxHeight: '140px', overflowY: 'auto', borderTop: `1px solid ${themeStyles.border}`, borderBottom: `1px solid ${themeStyles.border}`, padding: '6px 0', marginBottom: '10px' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: themeStyles.textMuted, fontSize: '11px' }}>কোনো পণ্য যোগ করা হয়নি</div>
                ) : (
                  cart.map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '6px' }}>
                      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div>{i.name}</div>
                        {orderType === 'reseller' && <div style={{ fontSize: '9px', color: '#0ea5e9' }}>বেস: {i.reseller_base_price}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', margin: '0 6px' }}>
                        <button onClick={() => updateQuantity(i.id, -1)} style={{ padding: '1px 5px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain }}>-</button>
                        <span>{i.quantity}</span>
                        <button onClick={() => updateQuantity(i.id, 1)} style={{ padding: '1px 5px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain }}>+</button>
                      </div>
                      <input
                        type="number"
                        value={i.customer_price}
                        onChange={(e) => updateCustomerPrice(i.id, e.target.value)}
                        style={{ width: '50px', padding: '2px 4px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: '#10b981', textAlign: 'right', borderRadius: '3px', marginRight: '6px' }}
                      />
                      <strong style={{ minWidth: '55px', textAlign: 'right' }}>Tk {i.subtotal}</strong>
                      <button onClick={() => removeItem(i.id)} style={{ background: 'transparent', border: 'none', color: themeStyles.textMuted, marginLeft: '4px', cursor: 'pointer' }}>×</button>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Methods */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '3px', marginBottom: '6px' }}>
                  {['cash', 'bkash', 'nagad', 'rocket', 'bank'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      style={{
                        padding: '6px 0',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        border: '1px solid',
                        borderColor: paymentMethod === m ? themeStyles.primary : themeStyles.border,
                        background: paymentMethod === m ? (isDark ? '#1e1017' : '#ffe4e6') : themeStyles.innerBg,
                        color: paymentMethod === m ? themeStyles.primary : themeStyles.textMuted
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'bank' && (
                  <div style={{ background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', padding: '6px', marginBottom: '6px' }}>
                    <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} style={{ width: '100%', padding: '6px', background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '4px', color: themeStyles.textMain, fontSize: '10px', marginBottom: '4px' }}>
                      {BD_BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <input placeholder="ট্রানজ্যাকশন আইডি / রেফারেন্স" value={bankTxnRef} onChange={(e) => setBankTxnRef(e.target.value)} style={{ width: '100%', padding: '6px', background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '4px', color: themeStyles.textMain, fontSize: '10px', boxSizing: 'border-box' }} />
                  </div>
                )}
              </div>

              {/* Total & Due */}
              <div style={{ background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                  <span>মোট বিল:</span>
                  <strong style={{ fontSize: '14px' }}>Tk {totalBill.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#10b981' }}>পরিশোধ:</span>
                  <input type="number" placeholder={`Tk ${totalBill}`} value={paidAmountInput} onChange={(e) => setPaidAmountInput(e.target.value)} style={{ width: '80px', padding: '4px 6px', background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, color: '#10b981', fontWeight: '700', textAlign: 'right', borderRadius: '4px', fontSize: '11px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '4px', borderTop: `1px solid ${themeStyles.border}` }}>
                  <span style={{ color: currentDueAmount > 0 ? '#ef4444' : themeStyles.textMuted }}>বকেয়া:</span>
                  <strong style={{ color: currentDueAmount > 0 ? '#ef4444' : themeStyles.textMuted }}>Tk {currentDueAmount.toLocaleString()}</strong>
                </div>
              </div>

              <button onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: '12px', background: themeStyles.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                {loading ? 'প্রসেসিং হচ্ছে...' : (orderType === 'reseller' ? `${activeReseller?.company || 'রিসেলার'} এর নামে চালান তৈরি` : 'বিল সম্পন্ন ও প্রিন্ট')}
              </button>
            </div>
          </div>
        )}

        {/* 2. FINANCIAL AUDIT & DUE LEDGER */}
        {activeTab === 'ledger' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, padding: '12px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '10px', color: themeStyles.textMuted }}>আমি মোট পাবো</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>Tk {totalIWillReceive.toLocaleString()}</div>
                <div style={{ fontSize: '9px', color: themeStyles.textMuted }}>ডিলার বকেয়া + কাস্টমার বাকি</div>
              </div>
              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, padding: '12px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: '10px', color: themeStyles.textMuted }}>আমার থেকে মোট পাবে</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444', marginTop: '2px' }}>Tk {totalIWillPay.toLocaleString()}</div>
                <div style={{ fontSize: '9px', color: themeStyles.textMuted }}>মহাজন পাওনা + রিসেলার কমিশন</div>
              </div>
              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: themeStyles.textMuted }}>ডিলারদের কাছে পাওনা</div>
                <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '2px' }}>Tk {totalReceivableFromDealers.toLocaleString()}</div>
              </div>
              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: themeStyles.textMuted }}>মহাজনদের পাওনা বকেয়া</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b', marginTop: '2px' }}>Tk {totalPayableToSuppliers.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '14px', overflowX: 'auto' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '10px' }}>সাপ্লায়ার ও মহাজনদের পাওনা তালিকা</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    {suppliers.map(s => (
                      <tr key={s.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                        <td style={{ padding: '6px 0' }}><strong>{s.name}</strong> ({s.company})</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', color: '#ef4444', fontWeight: '700' }}>Tk {s.payable_due?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '14px', overflowX: 'auto' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '10px' }}>রিসেলার প্রফিট কমিশন বকেয়া</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    {resellers.map(r => (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                        <td style={{ padding: '6px 0' }}><strong>{r.name}</strong> ({r.company})</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700', color: '#f59e0b' }}>Tk {r.pending_payout?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '14px', overflowX: 'auto' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '10px' }}>B2B ডিলারদের কাছে বাকি</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    {dealers.map(d => (
                      <tr key={d.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                        <td style={{ padding: '6px 0' }}><strong>{d.name}</strong> ({d.company})</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>Tk {d.current_due?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '14px', overflowX: 'auto' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '10px' }}>কাস্টমার বাকি মেমো তালিকা</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    {salesRecords.filter(s => s.due_amount > 0).map(s => (
                      <tr key={s.id || s.invoice_number} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                        <td style={{ padding: '6px 0' }}>#{s.invoice_number} ({s.customer_name})</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', color: '#ef4444', fontWeight: '700' }}>Tk {s.due_amount?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. MESSENGER ORDERS */}
        {activeTab === 'fb_orders' && (
          <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase' }}>ফেসবুক চ্যাটবট থেকে আসা কাস্টমার অর্ডার</div>
              <button onClick={fetchAllData} style={{ padding: '6px 12px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: '#0ea5e9', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>সিঙ্ক করুন</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '400px' }}>
              <thead>
                <tr style={{ background: themeStyles.innerBg, textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>কাস্টমার</th>
                  <th style={{ padding: '6px' }}>পণ্য</th>
                  <th style={{ padding: '6px' }}>ঠিকানা</th>
                  <th style={{ padding: '6px' }}>স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {fbOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                    <td style={{ padding: '6px' }}><strong>{o.customer_name}</strong><br/>{o.customer_phone}</td>
                    <td style={{ padding: '6px' }}>{o.items_ordered}</td>
                    <td style={{ padding: '6px', color: themeStyles.textMuted }}>{o.delivery_address}</td>
                    <td style={{ padding: '6px' }}>
                      <select value={o.order_status} onChange={(e) => handleUpdateFBStatus(o.id, e.target.value)} style={{ padding: '4px', background: themeStyles.innerBg, color: themeStyles.textMain, border: `1px solid ${themeStyles.border}`, borderRadius: '4px', fontSize: '10px' }}>
                        <option value="Pending Review">Pending Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. COURIER */}
        {activeTab === 'courier' && (
          <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '14px', overflowX: 'auto' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>কুরিয়ার ডেলিভারি ও স্ট্যাটাস ট্র্যাকিং</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '420px' }}>
              <thead>
                <tr style={{ background: themeStyles.innerBg, textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>কোড</th>
                  <th style={{ padding: '6px' }}>প্রাপক</th>
                  <th style={{ padding: '6px' }}>COD</th>
                  <th style={{ padding: '6px' }}>স্ট্যাটাস পরিবর্তন</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                    <td style={{ padding: '6px' }}><strong>{d.courier_name}</strong><br/>{d.tracking_code}</td>
                    <td style={{ padding: '6px' }}>{d.recipient_name} ({d.recipient_phone})</td>
                    <td style={{ padding: '6px', fontWeight: '700', color: '#10b981' }}>Tk {d.cod_amount}</td>
                    <td style={{ padding: '6px' }}>
                      <select value={d.delivery_status} onChange={(e) => handleUpdateCourierStatus(d.id, e.target.value)} style={{ padding: '4px', background: themeStyles.innerBg, color: themeStyles.textMain, border: `1px solid ${themeStyles.border}`, borderRadius: '4px', fontSize: '10px' }}>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Returned">Returned</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. WORKSHOP */}
        {activeTab === 'workshop' && (
          <div>
            <form onSubmit={addJobCard} style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800' }}>নতুন সার্ভিস সেন্টার জব কার্ড</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '8px' }}>
                <input placeholder="রেজিস্ট্রেশন নম্বর *" value={newJobBike} onChange={(e) => setNewJobBike(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }} />
                <input placeholder="কাস্টমারের নাম" value={newJobCustomer} onChange={(e) => setNewJobCustomer(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }} />
                <input placeholder="সার্ভিসের বিবরণ *" value={newJobService} onChange={(e) => setNewJobService(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }} />
                <input placeholder="টেকনিশিয়ান" value={newJobMechanic} onChange={(e) => setNewJobMechanic(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }} />
              </div>
              <button type="submit" style={{ padding: '9px', background: themeStyles.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}>জব কার্ড খুলুন</button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
              {['Queued', 'In Progress', 'Washing & Final QC', 'Ready'].map(col => (
                <div key={col} style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '6px', marginBottom: '8px' }}>{col}</div>
                  {jobCards.filter(j => j.status === col).map(job => (
                    <div key={job.id} style={{ background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                      <div style={{ color: themeStyles.primary, fontWeight: '700', fontSize: '11px' }}>{job.bike_number}</div>
                      <div style={{ fontSize: '11px', margin: '3px 0' }}>{job.service_type}</div>
                      <div style={{ fontSize: '10px', color: themeStyles.textMuted }}>টেকনিশিয়ান: {job.mechanic_name}</div>
                      <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
                        {['Queued', 'In Progress', 'Washing & Final QC', 'Ready'].map(st => st !== job.status && (
                          <button key={st} onClick={() => updateJobStatus(job.id, st)} style={{ flex: 1, padding: '3px 0', background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMuted, fontSize: '9px', borderRadius: '3px' }}>{st.slice(0, 4)}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. STOCK INWARD */}
        {activeTab === 'inventory' && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
            <form onSubmit={handleAddProduct} style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '16px', width: isMobile ? '100%' : '400px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase' }}>নতুন স্টক ইনওয়ার্ড</div>
              <input placeholder="পণ্যের নাম *" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} style={{ width: '100%', padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', marginBottom: '8px', boxSizing: 'border-box', fontSize: '12px' }} />
              
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '10px', color: themeStyles.textMuted, display: 'block', marginBottom: '3px' }}>ক্যাটাগরি:</label>
                <select value={newProdCategory} onChange={(e) => setNewProdCategory(e.target.value)} style={{ width: '100%', padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px', outline: 'none' }}>
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                <input type="number" placeholder="কেনা দাম *" value={newProdCost} onChange={(e) => setNewProdCost(e.target.value)} style={{ width: '100%', padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px' }} />
                <input type="number" placeholder="বিক্রয় দর *" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} style={{ width: '100%', padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                <input type="number" placeholder="রিসেলার দর" value={newProdResellerRate} onChange={(e) => setNewProdResellerRate(e.target.value)} style={{ width: '100%', padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px' }} />
                <input type="number" placeholder="পরিমাণ *" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} style={{ width: '100%', padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px' }} />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '10px', color: themeStyles.textMuted, display: 'block', marginBottom: '3px' }}>মহাজন / সাপ্লায়ার:</label>
                <select value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} style={{ width: '100%', padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px', outline: 'none' }}>
                  <option value="Direct Wholesale">Direct Wholesale</option>
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name} ({s.company || s.phone})</option>)}
                </select>
              </div>

              <button type="submit" style={{ width: '100%', padding: '10px', background: themeStyles.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}>স্টকে যোগ ও সংরক্ষণ করুন</button>
            </form>

            <div style={{ flex: 1, background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '16px', overflowX: 'auto' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '10px' }}>ক্রয় খতিয়ান</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '350px' }}>
                <thead>
                  <tr style={{ background: themeStyles.innerBg, textAlign: 'left' }}>
                    <th style={{ padding: '6px' }}>তারিখ</th>
                    <th style={{ padding: '6px' }}>পণ্য ও সাপ্লায়ার</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>খরচ</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseLedger.map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                      <td style={{ padding: '6px' }}>{p.created_at}</td>
                      <td style={{ padding: '6px' }}><strong>{p.product_name}</strong> ({p.quantity} Pcs)<br/><span style={{ color: themeStyles.textMuted }}>{p.supplier_name}</span></td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: '700', color: '#f59e0b' }}>Tk {p.total_cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. RETURNS HUB */}
        {activeTab === 'returns' && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
            <form onSubmit={handleProcessReturn} style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '16px', width: isMobile ? '100%' : '400px', display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '12px', fontWeight: '800' }}>পণ্য রিটার্ন ও স্টক সমন্বয়</div>
              <select value={returnType} onChange={(e) => setReturnType(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }}>
                <option value="SALE_RETURN">কাস্টমার রিটার্ন (দোকানে স্টক বাড়বে +)</option>
                <option value="PURCHASE_RETURN">মহাজনকে মাল ফেরত (দোকানের স্টক কমবে -)</option>
              </select>
              <select value={returnProductId} onChange={(e) => setReturnProductId(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }}>
                <option value="">পণ্য নির্বাচন করুন</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (বর্তমান স্টক: {p.stock})</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <input type="number" placeholder="পরিমাণ *" value={returnQty} onChange={(e) => setReturnQty(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }} />
                <input type="number" placeholder="রিফান্ড টাকা *" value={returnRefundAmt} onChange={(e) => setReturnRefundAmt(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }} />
              </div>
              <button type="submit" style={{ padding: '10px', background: themeStyles.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '11px' }}>রিটার্ন কনফার্ম করুন</button>
            </form>

            <div style={{ flex: 1, background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px' }}>রিটার্ন হিস্ট্রি লগ</div>
              <p style={{ fontSize: '11px', color: themeStyles.textMuted }}>প্রতিটি রিটার্ন নিশ্চিত করার সাথে সাথে মালের স্টক স্বয়ংক্রিয়ভাবে ডাটাবেজে সমন্বয় হয়ে যায়।</p>
            </div>
          </div>
        )}

        {/* 8. PARTNERS & CATEGORIES */}
        {activeTab === 'partners' && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '14px' }}>
            <form onSubmit={handleAddPartner} style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '16px', width: isMobile ? '100%' : '380px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800' }}>নতুন পার্টনার নিবন্ধন</div>
              <select value={partnerType} onChange={(e) => setPartnerType(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }}>
                <option value="RESELLER">অ্যাফিলিয়েট রিসেলার (Reseller)</option>
                <option value="DEALER">B2B ডিলার</option>
                <option value="SUPPLIER">মহাজন / সাপ্লায়ার</option>
              </select>
              <input placeholder="নাম *" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }} />
              <input placeholder="প্রতিষ্ঠান / পেজ" value={partnerCompany} onChange={(e) => setPartnerCompany(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }} />
              <input placeholder="মোবাইল *" value={partnerPhone} onChange={(e) => setPartnerPhone(e.target.value)} style={{ padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }} />
              <button type="submit" style={{ padding: '9px', background: themeStyles.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '11px' }}>নিবন্ধন করুন</button>
            </form>

            <form onSubmit={handleAddCategory} style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, borderRadius: '8px', padding: '16px', width: isMobile ? '100%' : '320px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px' }}>নতুন ক্যাটাগরি তৈরি</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input placeholder="ক্যাটাগরি নাম..." value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)} style={{ flex: 1, padding: '8px', background: themeStyles.innerBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.textMain, borderRadius: '6px', fontSize: '11px' }} />
                <button type="submit" style={{ padding: '8px 12px', background: themeStyles.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '11px' }}>যুক্ত</button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* PRINTABLE INVOICE MODAL */}
      {completedInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1300, padding: '14px' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '16px', maxWidth: '440px', width: '100%', color: '#0f172a' }}>
            <div ref={invoicePdfRef} style={{ padding: '8px', background: '#fff' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>
                  {completedInvoice.order_type === 'reseller' && completedInvoice.reseller_info ? completedInvoice.reseller_info.company : 'MODX BIKE MART'}
                </h3>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  {completedInvoice.order_type === 'reseller' ? `Fulfilled by ModX | Partner: ${completedInvoice.reseller_info?.name}` : 'Official POS Sales Receipt'}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>ইনভয়েস #{completedInvoice.invoice_number} | {completedInvoice.date}</div>
              </div>

              <div style={{ fontSize: '11px', marginBottom: '8px', lineHeight: '1.4' }}>
                <div><strong>কাস্টমার:</strong> {completedInvoice.customer_name} ({completedInvoice.customer_phone})</div>
                <div><strong>বাইক নম্বর:</strong> {completedInvoice.bike_number}</div>
                <div><strong>পেমেন্ট মেথড:</strong> {completedInvoice.payment_method}</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '8px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '4px 0' }}>আইটেম</th>
                    <th style={{ padding: '4px 0', textAlign: 'center' }}>পরিমাণ</th>
                    <th style={{ padding: '4px 0', textAlign: 'right' }}>মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {completedInvoice.items.map((i, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                      <td style={{ padding: '4px 0' }}>{i.name}</td>
                      <td style={{ padding: '4px 0', textAlign: 'center' }}>{i.quantity}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>Tk {i.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>মোট বিল:</span>
                  <strong>Tk {completedInvoice.total_amount.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>পরিশোধিত:</span>
                  <strong>Tk {completedInvoice.paid_amount.toLocaleString()}</strong>
                </div>
                {completedInvoice.due_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: '800' }}>
                    <span>বকেয়া (Due):</span>
                    <span>Tk {completedInvoice.due_amount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={downloadInvoicePDF} style={{ flex: 1, padding: '9px', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '11px' }}>PDF ডাউনলোড</button>
              <button onClick={() => setCompletedInvoice(null)} style={{ padding: '9px 14px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '11px' }}>বন্ধ</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ background: themeStyles.innerBg, borderTop: `1px solid ${themeStyles.border}`, padding: '10px 16px', textAlign: 'center', fontSize: '10px', color: themeStyles.textMuted }}>
        ModX Core ERP — সম্পূর্ণ অটোমেটেড ক্যাশ কাউন্টার, লজিস্টিক ও সার্ভিস সেন্টার
      </footer>
    </div>
  );
}