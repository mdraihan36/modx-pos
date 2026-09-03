import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'workshop', 'inventory', 'reports', 'dealers', 'resellers', 'courier', 'fb_orders'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Date Range Filters for Financial Reports
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Catalog Products (With Reseller Base Price)
  const [products, setProducts] = useState([
    { id: 1, name: 'Engine Oil 10W-30 (Mobil 1L)', sku: 'OIL-10W30-01', category: 'Lubricants', cost_price: 520, reseller_base_price: 580, selling_price: 650, stock: 24, min_stock: 5 },
    { id: 2, name: 'Disc Brake Pad (Front Dual Piston)', sku: 'BRK-PAD-02', category: 'Braking System', cost_price: 320, reseller_base_price: 380, selling_price: 450, stock: 18, min_stock: 4 },
    { id: 3, name: 'High Flow Air Filter (Racing Spec)', sku: 'FLT-AIR-03', category: 'Intake System', cost_price: 400, reseller_base_price: 460, selling_price: 550, stock: 3, min_stock: 5 },
    { id: 4, name: 'Laser Iridium Spark Plug', sku: 'IGN-SPK-04', category: 'Ignition', cost_price: 280, reseller_base_price: 320, selling_price: 380, stock: 35, min_stock: 8 },
    { id: 5, name: 'Heavy Duty Drive Chain Set (O-Ring)', sku: 'DRV-CHN-05', category: 'Drivetrain', cost_price: 2200, reseller_base_price: 2500, selling_price: 2850, stock: 4, min_stock: 3 },
    { id: 6, name: 'LED Projector Fog Lamp Assembly', sku: 'ELE-LGT-06', category: 'Electrical', cost_price: 1450, reseller_base_price: 1650, selling_price: 1950, stock: 10, min_stock: 2 }
  ]);

  // POS / Billing Register State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('direct'); // 'direct' or 'reseller'
  const [selectedResellerId, setSelectedResellerId] = useState(201);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bikeNumber, setBikeNumber] = useState('');
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [loading, setLoading] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedBank, setSelectedBank] = useState('Islami Bank Bangladesh PLC');
  const [bankTxnRef, setBankTxnRef] = useState('');

  // Printable Invoice Ref
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const invoicePdfRef = useRef();

  // Financial Registers (For Reports)
  const [salesRecords, setSalesRecords] = useState([
    { id: 9101, date: '2026-09-03', bike_number: 'DHAKA-METRO-HA-1234', customer_name: 'Tanvir Rahman', items_count: 2, total_cost_cogs: 840, total_sales: 1100, profit: 260, payment_method: 'CASH' },
    { id: 9102, date: '2026-09-04', bike_number: 'DHAKA-METRO-LA-5678', customer_name: 'Rafiqul Islam', items_count: 1, total_cost_cogs: 2200, total_sales: 2850, profit: 650, payment_method: 'BKASH' }
  ]);

  const [purchaseLedger, setPurchaseLedger] = useState([
    { id: 1, date: '2026-09-04', product_name: 'Engine Oil 10W-30 (Mobil 1L)', supplier_name: 'Padma Oil Distributors', supplier_phone: '01711000000', quantity: 30, purchase_price: 520, total_cost: 15600 }
  ]);

  const [expenses, setExpenses] = useState([
    { id: 1, date: '2026-09-04', title: 'Workshop Daily Utility & Lunch', category: 'General', amount: 850 },
    { id: 2, date: '2026-09-01', title: 'Workshop Rent', category: 'Shop Rent', amount: 25000 }
  ]);

  // Workshop Kanban State
  const [jobCards, setJobCards] = useState([
    { id: 1001, bike_number: 'DHAKA-METRO-HA-1234', customer_name: 'Tanvir Rahman', service_type: 'Full Engine Overhaul & Tuning', mechanic: 'Md. Karim', status: 'In Progress' },
    { id: 1002, bike_number: 'DHAKA-METRO-LA-5678', customer_name: 'Rafiqul Islam', service_type: 'Periodic Maintenance Service', mechanic: 'Md. Rahim', status: 'Queued' }
  ]);
  const [newJobBike, setNewJobBike] = useState('');
  const [newJobCustomer, setNewJobCustomer] = useState('');
  const [newJobService, setNewJobService] = useState('');
  const [newJobMechanic, setNewJobMechanic] = useState('');

  // Stock Inward Inputs
  const [newProdName, setNewProdName] = useState('');
  const [newProdSKU, setNewProdSKU] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Lubricants');
  const [newProdCost, setNewProdCost] = useState('');
  const [newProdResellerRate, setNewProdResellerRate] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');

  // Quick Expense Inputs
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('General');
  const [expenseAmount, setExpenseAmount] = useState('');

  // ---------------- DEALER LEDGER STATE ----------------
  const [dealers, setDealers] = useState([
    { id: 101, name: 'Rafiqul Motors', company: 'Rafiqul Enterprise', phone: '01711223344', total_supplied: 85000, total_paid: 50000, current_due: 35000 }
  ]);
  const [dealerTransactions, setDealerTransactions] = useState([
    { id: 1, dealer_name: 'Rafiqul Motors', type: 'SALE', description: '50 Pcs Drive Chain & Engine Oil', amount: 85000, date: '2026-09-01' },
    { id: 2, dealer_name: 'Rafiqul Motors', type: 'PAYMENT', description: 'Bank Transfer (EBL)', amount: 50000, date: '2026-09-03' }
  ]);
  const [newDealerName, setNewDealerName] = useState('');
  const [newDealerCompany, setNewDealerCompany] = useState('');
  const [newDealerPhone, setNewDealerPhone] = useState('');
  const [txDealerId, setTxDealerId] = useState(101);
  const [txType, setTxType] = useState('SALE');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');

  // ---------------- RESELLER STATE & PAYOUTS ----------------
  const [resellers, setResellers] = useState([
    { id: 201, name: 'Tanvir Hossain', page_name: 'MotoZone BD', phone: '01899112233', payout_channel: 'bKash', payout_account: '01899112233', total_earned_profit: 3200, paid_profit: 2000, pending_payout: 1200 },
    { id: 202, name: 'Sabbir Ahmed', page_name: 'Biker Point Dhaka', phone: '01755667788', payout_channel: 'Bank Transfer', payout_account: 'City Bank (1502938471)', total_earned_profit: 4500, paid_profit: 4500, pending_payout: 0 }
  ]);
  const [payoutLogs, setPayoutLogs] = useState([
    { id: 1, reseller_name: 'Tanvir Hossain', page_name: 'MotoZone BD', channel: 'bKash', account: '01899112233', amount: 2000, date: '2026-09-02', trx_ref: 'TRX982741' }
  ]);
  const [newResellerName, setNewResellerName] = useState('');
  const [newResellerPage, setNewResellerPage] = useState('');
  const [newResellerPhone, setNewResellerPhone] = useState('');
  const [newResellerChannel, setNewResellerChannel] = useState('bKash');
  const [newResellerAcc, setNewResellerAcc] = useState('');

  const [payoutResellerId, setPayoutResellerId] = useState(201);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bKash');
  const [payoutTrxRef, setPayoutTrxRef] = useState('');

  // ---------------- COURIER PARCEL TRACKING STATE ----------------
  const [deliveries, setDeliveries] = useState([
    { id: 1, courier_name: 'Steadfast', tracking_code: 'STF-849201', recipient_name: 'Rakibul Hasan', phone: '01711998877', address: 'House 12, Road 4, Sector 7, Uttara, Dhaka', cod_amount: 1950, delivery_status: 'In Transit', reseller_page: 'MotoZone BD', date: '2026-09-03' },
    { id: 2, courier_name: 'Sundarban', tracking_code: 'SBD-592014', recipient_name: 'Mahmudul Karim', phone: '01822334455', address: 'Chawkbazar Main Road, Chittagong', cod_amount: 1300, delivery_status: 'Delivered', reseller_page: 'Direct Sale', date: '2026-09-02' }
  ]);
  const [bookingCourier, setBookingCourier] = useState('Steadfast');
  const [bookingRecipient, setBookingRecipient] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingCod, setBookingCod] = useState('');
  const [bookingResellerPage, setBookingResellerPage] = useState('Direct Sale');

  // ---------------- FACEBOOK CHATBOT ORDERS STATE ----------------
  const [fbOrders, setFbOrders] = useState([
    { id: 1, customer_name: 'Kabir Ahmed', customer_phone: '01700112233', items_ordered: 'Laser Iridium Spark Plug (2 Pcs)', delivery_address: 'Mirpur 10, Dhaka', order_status: 'Pending Review', date: '2026-09-04' }
  ]);

  // Commercial & Islamic Banks List
  const bdBankList = [
    'BRAC Bank PLC', 'City Bank PLC', 'Dutch-Bangla Bank PLC (DBBL)', 'Eastern Bank PLC (EBL)',
    'Dhaka Bank PLC', 'Mutual Trust Bank PLC (MTB)', 'Prime Bank PLC', 'Pubali Bank PLC',
    'Southeast Bank PLC', 'NCC Bank PLC', 'Islami Bank Bangladesh PLC', 'Social Islami Bank PLC',
    'Sonali Bank PLC', 'Agrani Bank PLC', 'Standard Chartered Bangladesh'
  ];

  const categories = ['All', 'Lubricants', 'Braking System', 'Intake System', 'Ignition', 'Drivetrain', 'Electrical'];

  // Cart Helper Computations
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

  // Execute POS Sale & Register
  const handleCheckout = () => {
    if (!customerPhone.trim()) return alert('কাস্টমারের ফোন নম্বর প্রদান করুন!');
    if (cart.length === 0) return alert('বিলিং কাউন্টার খালি!');

    setLoading(true);
    const paymentGatewayDetails = paymentMethod === 'bank' ? `${selectedBank} (Ref: ${bankTxnRef || 'CARD'})` : paymentMethod.toUpperCase();
    const currentDate = new Date().toISOString().split('T')[0];

    const invoicePayload = {
      invoice_id: Math.floor(100000 + Math.random() * 900000),
      order_type: orderType,
      reseller: orderType === 'reseller' ? activeReseller : null,
      customer_name: customerName || 'Walk-in Client',
      customer_phone: customerPhone,
      bike_number: bikeNumber || 'N/A',
      items: [...cart],
      subtotal: totalCustomerPayable,
      paid_amount: finalPayable,
      redeemed_points: redeemedPoints,
      payment_method: paymentGatewayDetails,
      date: new Date().toLocaleString()
    };

    // Credit profit to reseller if reseller order
    if (orderType === 'reseller' && activeReseller && totalResellerProfit > 0) {
      setResellers(resellers.map(r => r.id === activeReseller.id ? {
        ...r,
        total_earned_profit: r.total_earned_profit + totalResellerProfit,
        pending_payout: r.pending_payout + totalResellerProfit
      } : r));
    }

    // Record sales in the analytical ledger
    const newSaleRecord = {
      id: invoicePayload.invoice_id,
      date: currentDate,
      bike_number: invoicePayload.bike_number,
      customer_name: invoicePayload.customer_name,
      items_count: cart.reduce((t, i) => t + i.quantity, 0),
      total_cost_cogs: totalCogsForCart,
      total_sales: finalPayable,
      profit: finalPayable - totalCogsForCart,
      payment_method: paymentGatewayDetails
    };

    setSalesRecords([newSaleRecord, ...salesRecords]);
    setCompletedInvoice(invoicePayload);
    setLoading(false);
    setCart([]);
    setBikeNumber('');
    setCustomerName('');
    setCustomerPhone('');
    setRedeemedPoints(0);
    setAvailablePoints(0);
    setBankTxnRef('');
  };

  // PDF Export
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

  // Add Stock Inward
  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProdName || !newProdCost || !newProdPrice || !newProdStock) return alert('পণ্যের বিবরণ দিন!');
    const newId = Date.now();
    const curDate = new Date().toISOString().split('T')[0];

    const prod = {
      id: newId,
      name: newProdName,
      sku: newProdSKU || `SKU-${newId.toString().slice(-4)}`,
      category: newProdCategory,
      cost_price: Number(newProdCost),
      reseller_base_price: Number(newProdResellerRate || newProdCost),
      selling_price: Number(newProdPrice),
      stock: Number(newProdStock),
      min_stock: 5
    };

    setProducts([...products, prod]);
    setPurchaseLedger([{
      id: newId,
      date: curDate,
      product_name: newProdName,
      supplier_name: newSupplierName || 'Direct Wholesale',
      supplier_phone: 'N/A',
      quantity: Number(newProdStock),
      purchase_price: Number(newProdCost),
      total_cost: Number(newProdCost) * Number(newProdStock)
    }, ...purchaseLedger]);

    alert('স্টক যুক্ত হয়েছে এবং ক্রয় লেজারে রেকর্ড করা হয়েছে!');
    setNewProdName(''); setNewProdSKU(''); setNewProdCost(''); setNewProdResellerRate(''); setNewProdPrice(''); setNewProdStock(''); setNewSupplierName('');
  };

  // Quick Expense Handler
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return alert('খরচের বিবরণ দিন!');
    const curDate = new Date().toISOString().split('T')[0];
    setExpenses([{ id: Date.now(), date: curDate, title: expenseTitle, category: expenseCategory, amount: Number(expenseAmount) }, ...expenses]);
    setExpenseTitle(''); setExpenseAmount('');
    alert('খরচ রেকর্ড সম্পন্ন!');
  };

  // Dealer Handlers
  const handleAddDealer = (e) => {
    e.preventDefault();
    if (!newDealerName || !newDealerPhone) return alert('ডিলারের নাম ও ফোন দিন!');
    const newD = { id: Date.now(), name: newDealerName, company: newDealerCompany || 'Direct Store', phone: newDealerPhone, total_supplied: 0, total_paid: 0, current_due: 0 };
    setDealers([newD, ...dealers]);
    setNewDealerName(''); setNewDealerCompany(''); setNewDealerPhone('');
    alert('ডিলার সফলভাবে যুক্ত হয়েছে!');
  };

  const handleDealerTransaction = (e) => {
    e.preventDefault();
    if (!txAmount) return alert('টাকার পরিমাণ লিখুন!');
    const targetDealer = dealers.find(d => d.id === Number(txDealerId));
    const amt = Number(txAmount);
    const newTx = {
      id: Date.now(),
      dealer_name: targetDealer ? targetDealer.name : 'Dealer',
      type: txType,
      description: txDesc || (txType === 'SALE' ? 'Goods Supplied' : 'Payment Received'),
      amount: amt,
      date: new Date().toISOString().split('T')[0]
    };

    setDealerTransactions([newTx, ...dealerTransactions]);
    setDealers(dealers.map(d => {
      if (d.id === Number(txDealerId)) {
        const supplied = txType === 'SALE' ? d.total_supplied + amt : d.total_supplied;
        const paid = txType === 'PAYMENT' ? d.total_paid + amt : d.total_paid;
        return { ...d, total_supplied: supplied, total_paid: paid, current_due: supplied - paid };
      }
      return d;
    }));
    setTxAmount(''); setTxDesc('');
    alert('ডিলার ট্রানজ্যাকশন সম্পন্ন!');
  };

  // Reseller Handlers
  const handleAddReseller = (e) => {
    e.preventDefault();
    if (!newResellerName || !newResellerPage || !newResellerPhone) return alert('রিসেলারের নাম, পেজ ও ফোন দিন!');
    const newR = {
      id: Date.now(),
      name: newResellerName,
      page_name: newResellerPage,
      phone: newResellerPhone,
      payout_channel: newResellerChannel,
      payout_account: newResellerAcc || newResellerPhone,
      total_earned_profit: 0,
      paid_profit: 0,
      pending_payout: 0
    };
    setResellers([newR, ...resellers]);
    setNewResellerName(''); setNewResellerPage(''); setNewResellerPhone(''); setNewResellerAcc('');
    alert('নতুন রিসেলার যুক্ত হয়েছে!');
  };

  const handleResellerPayout = (e) => {
    e.preventDefault();
    const amt = Number(payoutAmount);
    if (!amt || amt <= 0) return alert('সঠিক টাকার পরিমাণ দিন!');
    const targetReseller = resellers.find(r => r.id === Number(payoutResellerId));
    if (!targetReseller) return alert('রিসেলার সিলেক্ট করুন!');
    if (amt > targetReseller.pending_payout) return alert('বকেয়া প্রফিটের চেয়ে বেশি টাকা ট্রান্সফার করা যাবে না!');

    const log = {
      id: Date.now(),
      reseller_name: targetReseller.name,
      page_name: targetReseller.page_name,
      channel: payoutMethod,
      account: targetReseller.payout_account,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      trx_ref: payoutTrxRef || `PAY-${Date.now().toString().slice(-6)}`
    };

    setPayoutLogs([log, ...payoutLogs]);
    setResellers(resellers.map(r => r.id === targetReseller.id ? { ...r, paid_profit: r.paid_profit + amt, pending_payout: r.pending_payout - amt } : r));
    setPayoutAmount(''); setPayoutTrxRef('');
    alert(`Tk ${amt.toLocaleString()} প্রফিট পে-আউট সফলভাবে রেকর্ড হয়েছে!`);
  };

  // Courier Handlers
  const handleCreateDelivery = (e) => {
    e.preventDefault();
    if (!bookingRecipient || !bookingPhone || !bookingAddress) return alert('কাস্টমারের নাম, ফোন ও ঠিকানা দিন!');
    const prefix = bookingCourier === 'Steadfast' ? 'STF' : 'SBD';
    const randomTrack = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newDel = {
      id: Date.now(),
      courier_name: bookingCourier,
      tracking_code: randomTrack,
      recipient_name: bookingRecipient,
      phone: bookingPhone,
      address: bookingAddress,
      cod_amount: Number(bookingCod) || 0,
      delivery_status: 'In Transit',
      reseller_page: bookingResellerPage,
      date: new Date().toISOString().split('T')[0]
    };

    setDeliveries([newDel, ...deliveries]);
    setBookingRecipient(''); setBookingPhone(''); setBookingAddress(''); setBookingCod('');
    alert(`পার্সেল বুকিং সফল! ট্র্যাকিং কোড: ${randomTrack}`);
  };

  // Workshop Handlers
  const addJobCard = (e) => {
    e.preventDefault();
    if (!newJobBike.trim() || !newJobService.trim()) return alert('গাড়ির নম্বর ও সার্ভিস আবশ্যক!');
    setJobCards([{ id: Date.now(), bike_number: newJobBike.toUpperCase(), customer_name: newJobCustomer || 'Client', service_type: newJobService, mechanic: newJobMechanic || 'Workshop Tech', status: 'Queued' }, ...jobCards]);
    setNewJobBike(''); setNewJobCustomer(''); setNewJobService(''); setNewJobMechanic('');
  };

  const updateJobStatus = (id, newStatus) => {
    setJobCards(jobCards.map(j => j.id === id ? { ...j, status: newStatus } : j));
  };

  // Date Filtering Calculations
  const filteredSales = salesRecords.filter(s => s.date >= startDate && s.date <= endDate);
  const filteredPurchases = purchaseLedger.filter(p => p.date >= startDate && p.date <= endDate);
  const filteredExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate);

  const totalPeriodSales = filteredSales.reduce((s, i) => s + i.total_sales, 0);
  const totalPeriodCogs = filteredSales.reduce((s, i) => s + i.total_cost_cogs, 0);
  const totalPeriodPurchases = filteredPurchases.reduce((s, i) => s + i.total_cost, 0);
  const totalPeriodExpenses = filteredExpenses.reduce((s, i) => s + i.amount, 0);
  const grossProfit = totalPeriodSales - totalPeriodCogs;
  const netProfit = grossProfit - totalPeriodExpenses;

  const filteredCatalog = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ background: '#0f1117', color: '#cbd5e1', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ================= HEADER NAVIGATION ================= */}
      <header style={{ background: '#181b24', borderBottom: '1px solid #282d3c', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', color: '#f8fafc' }}>
              MODX <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '700' }}>ENTERPRISE</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Complete POS, Workshop, Partners & Deliveries System
            </div>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
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
                color: activeTab === t.id ? '#ffffff' : '#94a3b8',
                whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main style={{ padding: '20px 24px', maxWidth: '1600px', margin: '0 auto', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        
        {/* ---------------- 1. POS BILLING TAB ---------------- */}
        {activeTab === 'pos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '20px', alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <input
                  type="text"
                  placeholder="পণ্য বা পার্টসের নাম / SKU দিয়ে খুঁজুন..."
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
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>Tk {p.selling_price.toLocaleString()}</div>
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

              {/* Reseller Order Selection & Margin Banner */}
              {orderType === 'reseller' && (
                <div style={{ background: '#1e293b', border: '1px solid #3b82f6', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#93c5fd', fontWeight: '600', marginBottom: '4px' }}>অর্ডারকারী রিসেলার নির্বাচন করুন:</div>
                  <select
                    value={selectedResellerId}
                    onChange={(e) => setSelectedResellerId(e.target.value)}
                    style={{ width: '100%', padding: '6px', background: '#0f1117', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '12px', marginBottom: '6px' }}
                  >
                    {resellers.map(r => (
                      <option key={r.id} value={r.id}>{r.name} — Page: {r.page_name} ({r.phone})</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '6px 8px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>রিসেলারের প্রফিট কমিশন:</span>
                    <strong style={{ fontSize: '13px', color: '#4ade80' }}>+ Tk {totalResellerProfit.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              {/* Customer Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <input placeholder="কাস্টমারের ফোন নম্বর *" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ padding: '8px 10px', background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input placeholder="কাস্টমারের নাম" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ flex: 1, padding: '8px 10px', background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }} />
                  <input placeholder="বাইক নম্বর" value={bikeNumber} onChange={(e) => setBikeNumber(e.target.value)} style={{ flex: 1, padding: '8px 10px', background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }} />
                </div>
              </div>

              {/* Cart Items Table */}
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

              {/* Payment Methods */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {['cash', 'bkash', 'nagad', 'rocket', 'bank'].map((m) => (
                  <button key={m} type="button" onClick={() => setPaymentMethod(m)} style={{ padding: '6px 0', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize', border: '1px solid', borderColor: paymentMethod === m ? '#dc2626' : '#282d3c', background: paymentMethod === m ? '#2d1417' : '#0f1117', color: paymentMethod === m ? '#f87171' : '#94a3b8', cursor: 'pointer' }}>
                    {m}
                  </button>
                ))}
              </div>

              {/* QR & Bank Drawers */}
              {(paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket') && finalPayable > 0 && (
                <div style={{ textAlign: 'center', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', marginBottom: '8px' }}>
                  <div style={{ background: '#ffffff', padding: '4px', display: 'inline-block', borderRadius: '4px' }}>
                    <QRCodeSVG value={`${paymentMethod}://pay?amount=${finalPayable}&merchant=01700000000`} size={70} />
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '2px', color: '#94a3b8' }}>Scan via {paymentMethod.toUpperCase()} App</div>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div style={{ background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', padding: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} style={{ width: '100%', padding: '6px', background: '#181b24', border: '1px solid #333b4f', borderRadius: '4px', color: '#f8fafc', fontSize: '11px' }}>
                    {bdBankList.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <input placeholder="Card Approval Reference / TrxID" value={bankTxnRef} onChange={(e) => setBankTxnRef(e.target.value)} style={{ width: '100%', padding: '6px', background: '#181b24', border: '1px solid #333b4f', borderRadius: '4px', color: '#f8fafc', fontSize: '11px', boxSizing: 'border-box' }} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Customer Total:</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>Tk {finalPayable.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: '11px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}>
                {loading ? 'Processing...' : (orderType === 'reseller' ? `${activeReseller?.page_name} নামে ইনভয়েস ও বিল` : 'সম্পূর্ণ করুন ও প্রিন্ট')}
              </button>
            </div>
          </div>
        )}

        {/* ---------------- 2. FINANCIAL REPORTS & ANALYTICS ---------------- */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc' }}>DATE-RANGE FINANCIAL AUDIT REPORT</span>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>তারিখ অনুযায়ী বেচাকেনা, মালের ক্রয় খরচ ও নিট লাভ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>From:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '6px', background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }} />
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>To:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '6px', background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }} />
                <button onClick={() => { const today = new Date().toISOString().split('T')[0]; setStartDate(today); setEndDate(today); }} style={{ padding: '6px 12px', background: '#222734', border: '1px solid #333b4f', borderRadius: '4px', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}>Today</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#181b24', border: '1px solid #282d3c', padding: '14px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>মোট বিক্রি (Total Sales)</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>Tk {totalPeriodSales.toLocaleString()}</div>
              </div>
              <div style={{ background: '#181b24', border: '1px solid #282d3c', padding: '14px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>বিক্রিত মালের কেনাদাম (COGS)</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#94a3b8', marginTop: '4px' }}>Tk {totalPeriodCogs.toLocaleString()}</div>
              </div>
              <div style={{ background: '#181b24', border: '1px solid #282d3c', padding: '14px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>স্টক ক্রয় খরচ (Purchases)</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>Tk {totalPeriodPurchases.toLocaleString()}</div>
              </div>
              <div style={{ background: '#181b24', border: '1px solid #282d3c', padding: '14px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>দোকানের খরচ (Expenses)</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>Tk {totalPeriodExpenses.toLocaleString()}</div>
              </div>
              <div style={{ background: '#181b24', border: '1px solid #282d3c', padding: '14px', borderRadius: '6px', borderLeft: '3px solid #22c55e' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>নিট লাভ (Net Profit)</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: netProfit >= 0 ? '#4ade80' : '#ef4444', marginTop: '4px' }}>Tk {netProfit.toLocaleString()}</div>
              </div>
            </div>

            {/* Detailed Sales and Expenses List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>Daily Sales Register</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#11131a', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Date</th>
                      <th style={{ padding: '6px' }}>Customer / Bike</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #1f2330' }}>
                        <td style={{ padding: '6px', color: '#64748b' }}>{s.date}</td>
                        <td style={{ padding: '6px', color: '#fff' }}>{s.customer_name} ({s.bike_number})</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: '700', color: '#fff' }}>Tk {s.total_sales.toLocaleString()}</td>
                        <td style={{ padding: '6px', textAlign: 'right', color: '#4ade80' }}>+Tk {s.profit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Expense Logger */}
              <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>+ Record Shop Expense</div>
                <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  <input placeholder="Expense Title *" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} style={{ flex: 1.5, padding: '7px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '11px' }} />
                  <input placeholder="Tk *" type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} style={{ width: '70px', padding: '7px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '11px' }} />
                  <button type="submit" style={{ padding: '7px 12px', background: '#dc2626', border: 'none', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Add</button>
                </form>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#11131a', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Date</th>
                      <th style={{ padding: '6px' }}>Title</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(e => (
                      <tr key={e.id} style={{ borderBottom: '1px solid #1f2330' }}>
                        <td style={{ padding: '6px', color: '#64748b' }}>{e.date}</td>
                        <td style={{ padding: '6px', color: '#fff' }}>{e.title}</td>
                        <td style={{ padding: '6px', textAlign: 'right', color: '#ef4444', fontWeight: '700' }}>Tk {e.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- 3. DEALER KHOTIYAN ---------------- */}
        {activeTab === 'dealers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
            <div>
              {/* Add Dealer */}
              <form onSubmit={handleAddDealer} style={{ background: '#181b24', border: '1px solid #282d3c', padding: '16px', borderRadius: '6px', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>+ নতুন ডিলার যুক্ত করুন</div>
                <input placeholder="ডিলারের নাম *" value={newDealerName} onChange={(e) => setNewDealerName(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box' }} />
                <input placeholder="দোকান বা কোম্পানির নাম" value={newDealerCompany} onChange={(e) => setNewDealerCompany(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box' }} />
                <input placeholder="ফোন নম্বর *" value={newDealerPhone} onChange={(e) => setNewDealerPhone(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '10px', boxSizing: 'border-box' }} />
                <button type="submit" style={{ width: '100%', padding: '9px', background: '#222734', border: '1px solid #333b4f', color: '#fff', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>ডিলার সেভ করুন</button>
              </form>

              {/* Transaction Entry */}
              <form onSubmit={handleDealerTransaction} style={{ background: '#181b24', border: '1px solid #282d3c', padding: '16px', borderRadius: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>+ ডিলার চালান / পেমেন্ট এন্ট্রি</div>
                <select value={txDealerId} onChange={(e) => setTxDealerId(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px' }}>
                  {dealers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.company})</option>)}
                </select>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <select value={txType} onChange={(e) => setTxType(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }}>
                    <option value="SALE">মাল দেওয়া (চালান)</option>
                    <option value="PAYMENT">টাকা আদায় (পেমেন্ট)</option>
                  </select>
                  <input type="number" placeholder="Tk *" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }} />
                </div>
                <input placeholder="মালের বিবরণ বা রেফারেন্স" value={txDesc} onChange={(e) => setTxDesc(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '10px', boxSizing: 'border-box' }} />
                <button type="submit" style={{ width: '100%', padding: '9px', background: txType === 'SALE' ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>
                  {txType === 'SALE' ? 'চালান রেকর্ড করুন' : 'পেমেন্ট জমা করুন'}
                </button>
              </form>
            </div>

            {/* Dealers Tables */}
            <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginBottom: '12px' }}>ডিলারদের বর্তমান খতিয়ান ও বকেয়া তালিকা</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#11131a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>ডিলার</th>
                    <th style={{ padding: '8px' }}>ফোন</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>মোট মাল নিয়েছে</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>পরিশোধ করেছে</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>বর্তমান বকেয়া</th>
                  </tr>
                </thead>
                <tbody>
                  {dealers.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #1f2330' }}>
                      <td style={{ padding: '8px', color: '#fff', fontWeight: '600' }}>{d.name} <span style={{ fontSize: '11px', color: '#64748b' }}>({d.company})</span></td>
                      <td style={{ padding: '8px', color: '#94a3b8' }}>{d.phone}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>Tk {d.total_supplied.toLocaleString()}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#4ade80' }}>Tk {d.total_paid.toLocaleString()}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: d.current_due > 0 ? '#ef4444' : '#94a3b8' }}>Tk {d.current_due.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>লেনদেনের হিস্ট্রি লগ</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  {dealerTransactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #1f2330' }}>
                      <td style={{ padding: '6px', color: '#64748b' }}>{t.date}</td>
                      <td style={{ padding: '6px', color: '#fff' }}>{t.dealer_name}</td>
                      <td style={{ padding: '6px' }}>
                        <span style={{ padding: '2px 5px', borderRadius: '3px', fontSize: '10px', fontWeight: '700', background: t.type === 'SALE' ? '#2d1417' : '#0f291e', color: t.type === 'SALE' ? '#f87171' : '#4ade80' }}>{t.type}</span>
                      </td>
                      <td style={{ padding: '6px', color: '#94a3b8' }}>{t.description}</td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: '700', color: t.type === 'SALE' ? '#f87171' : '#4ade80' }}>{t.type === 'SALE' ? '+' : '-'} Tk {t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- 4. RESELLER & PAYOUTS ---------------- */}
        {activeTab === 'resellers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
            <div>
              {/* Register Reseller */}
              <form onSubmit={handleAddReseller} style={{ background: '#181b24', border: '1px solid #282d3c', padding: '16px', borderRadius: '6px', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>+ নতুন রিসেলার পেজ যোগ করুন</div>
                <input placeholder="রিসেলারের নাম *" value={newResellerName} onChange={(e) => setNewResellerName(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box' }} />
                <input placeholder="ফেসবুক পেজের নাম *" value={newResellerPage} onChange={(e) => setNewResellerPage(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box' }} />
                <input placeholder="মোবাইল নম্বর *" value={newResellerPhone} onChange={(e) => setNewResellerPhone(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  <select value={newResellerChannel} onChange={(e) => setNewResellerChannel(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }}>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank Transfer">Bank</option>
                  </select>
                  <input placeholder="অ্যাকাউন্ট নং" value={newResellerAcc} onChange={(e) => setNewResellerAcc(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }} />
                </div>
                <button type="submit" style={{ width: '100%', padding: '9px', background: '#222734', border: '1px solid #333b4f', color: '#fff', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>রিসেলার সেভ করুন</button>
              </form>

              {/* Payout Transfer Form */}
              <form onSubmit={handleResellerPayout} style={{ background: '#181b24', border: '1px solid #282d3c', padding: '16px', borderRadius: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>💸 প্রফিট পে-আউট ট্রান্সফার (Send Money)</div>
                <select value={payoutResellerId} onChange={(e) => setPayoutResellerId(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px' }}>
                  {resellers.map(r => <option key={r.id} value={r.id}>{r.name} ({r.page_name}) — Due: Tk {r.pending_payout}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }}>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank">Bank</option>
                  </select>
                  <input type="number" placeholder="Tk *" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }} />
                </div>
                <input placeholder="Trx Reference" value={payoutTrxRef} onChange={(e) => setPayoutTrxRef(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '10px', boxSizing: 'border-box' }} />
                <button type="submit" style={{ width: '100%', padding: '9px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>পেমেন্ট ক্লিয়ার করুন</button>
              </form>
            </div>

            {/* Reseller Tables */}
            <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginBottom: '12px' }}>রিসেলার কমিশন ব্যালেন্স খতিয়ান</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#11131a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>রিসেলার ও পেজ</th>
                    <th style={{ padding: '8px' }}>অ্যাকাউন্ট</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>মোট কমিশন আয়</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>পরিশোধিত</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>বাকি পে-আউট</th>
                  </tr>
                </thead>
                <tbody>
                  {resellers.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #1f2330' }}>
                      <td style={{ padding: '8px', color: '#fff', fontWeight: '600' }}>{r.name} <div style={{ fontSize: '11px', color: '#38bdf8' }}>Page: {r.page_name}</div></td>
                      <td style={{ padding: '8px', color: '#94a3b8' }}>{r.payout_channel} ({r.payout_account})</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>Tk {r.total_earned_profit.toLocaleString()}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#4ade80' }}>Tk {r.paid_profit.toLocaleString()}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: r.pending_payout > 0 ? '#f59e0b' : '#64748b' }}>Tk {r.pending_payout.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>পে-আউট হিস্ট্রি লগ</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  {payoutLogs.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #1f2330' }}>
                      <td style={{ padding: '6px', color: '#64748b' }}>{l.date}</td>
                      <td style={{ padding: '6px', color: '#fff' }}>{l.reseller_name}</td>
                      <td style={{ padding: '6px', color: '#38bdf8' }}>{l.channel} - {l.account}</td>
                      <td style={{ padding: '6px', color: '#94a3b8' }}>{l.trx_ref}</td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: '700', color: '#4ade80' }}>Tk {l.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- 5. COURIER TRACKING ---------------- */}
        {activeTab === 'courier' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
            <form onSubmit={handleCreateDelivery} style={{ background: '#181b24', border: '1px solid #282d3c', padding: '16px', borderRadius: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>📦 নতুন পার্সেল বুকিং</div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button type="button" onClick={() => setBookingCourier('Steadfast')} style={{ flex: 1, padding: '7px', borderRadius: '4px', border: '1px solid', borderColor: bookingCourier === 'Steadfast' ? '#38bdf8' : '#282d3c', background: bookingCourier === 'Steadfast' ? '#082f49' : '#0f1117', color: bookingCourier === 'Steadfast' ? '#38bdf8' : '#94a3b8', fontWeight: '700', cursor: 'pointer' }}>Steadfast</button>
                <button type="button" onClick={() => setBookingCourier('Sundarban')} style={{ flex: 1, padding: '7px', borderRadius: '4px', border: '1px solid', borderColor: bookingCourier === 'Sundarban' ? '#f59e0b' : '#282d3c', background: bookingCourier === 'Sundarban' ? '#451a03' : '#0f1117', color: bookingCourier === 'Sundarban' ? '#f59e0b' : '#94a3b8', fontWeight: '700', cursor: 'pointer' }}>Sundarban</button>
              </div>
              <select value={bookingResellerPage} onChange={(e) => setBookingResellerPage(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px' }}>
                <option value="Direct Sale">Direct Mart Sale</option>
                {resellers.map(r => <option key={r.id} value={r.page_name}>{r.page_name} ({r.name})</option>)}
              </select>
              <input placeholder="প্রাপকের নাম *" value={bookingRecipient} onChange={(e) => setBookingRecipient(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box' }} />
              <input placeholder="মোবাইল নম্বর *" value={bookingPhone} onChange={(e) => setBookingPhone(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box' }} />
              <textarea placeholder="পূর্ণাঙ্গ ঠিকানা *" value={bookingAddress} onChange={(e) => setBookingAddress(e.target.value)} style={{ width: '100%', height: '55px', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box', resize: 'none' }} />
              <input placeholder="COD টাকা (Tk)" type="number" value={bookingCod} onChange={(e) => setBookingCod(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '12px', boxSizing: 'border-box' }} />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>বুকিং নিশ্চিত করুন</button>
            </form>

            <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginBottom: '12px' }}>পার্সেল ট্র্যাকিং ও কুরিয়ার খতিয়ান</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#11131a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>কুরিয়ার ও ট্র্যাকিং কোড</th>
                    <th style={{ padding: '8px' }}>প্রাপক ও পেজ</th>
                    <th style={{ padding: '8px' }}>COD</th>
                    <th style={{ padding: '8px' }}>স্ট্যাটাস</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>অনলাইন ট্র্যাকিং</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #1f2330' }}>
                      <td style={{ padding: '8px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '3px', fontWeight: '700', background: d.courier_name === 'Steadfast' ? '#0369a1' : '#b45309', color: '#fff' }}>{d.courier_name}</span>
                        <div style={{ fontWeight: '700', color: '#fff', marginTop: '3px' }}>{d.tracking_code}</div>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ color: '#fff' }}>{d.recipient_name} ({d.phone})</div>
                        <div style={{ fontSize: '10px', color: '#38bdf8' }}>{d.reseller_page}</div>
                      </td>
                      <td style={{ padding: '8px', fontWeight: '700', color: '#4ade80' }}>Tk {d.cod_amount}</td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={d.delivery_status}
                          onChange={(e) => setDeliveries(deliveries.map(item => item.id === d.id ? { ...item, delivery_status: e.target.value } : item))}
                          style={{ padding: '3px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '3px', fontSize: '11px' }}
                        >
                          <option value="In Transit">In Transit</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <button onClick={() => window.open(d.courier_name === 'Steadfast' ? `https://steadfast.com.bd/t/${d.tracking_code}` : 'https://sundarbancourierltd.com/', '_blank')} style={{ padding: '5px 10px', background: '#222734', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>🌐 Track Live</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- 6. WORKSHOP KANBAN ---------------- */}
        {activeTab === 'workshop' && (
          <div>
            <form onSubmit={addJobCard} style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '14px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 1.2fr auto', gap: '8px' }}>
              <input placeholder="গাড়ির নম্বর *" value={newJobBike} onChange={(e) => setNewJobBike(e.target.value)} style={{ padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '12px' }} />
              <input placeholder="গ্রাহকের নাম" value={newJobCustomer} onChange={(e) => setNewJobCustomer(e.target.value)} style={{ padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '12px' }} />
              <input placeholder="সার্ভিস কাজ *" value={newJobService} onChange={(e) => setNewJobService(e.target.value)} style={{ padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '12px' }} />
              <input placeholder="মেকানিক" value={newJobMechanic} onChange={(e) => setNewJobMechanic(e.target.value)} style={{ padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', fontSize: '12px' }} />
              <button type="submit" style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>জব কার্ড তৈরি</button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {['Queued', 'In Progress', 'Washing & Final QC', 'Ready'].map((col) => (
                <div key={col} style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', minHeight: '440px', padding: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', borderBottom: '1px solid #282d3c', paddingBottom: '8px', marginBottom: '10px' }}>{col}</div>
                  {jobCards.filter((j) => j.status === col).map((job) => (
                    <div key={job.id} style={{ background: '#0f1117', border: '1px solid #282d3c', borderRadius: '4px', padding: '10px', marginBottom: '8px' }}>
                      <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '12px' }}>{job.bike_number}</div>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', margin: '4px 0' }}>{job.service_type}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>Tech: {job.mechanic}</div>
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

        {/* ---------------- 7. STOCK & SOURCING ---------------- */}
        {activeTab === 'inventory' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
            <form onSubmit={handleAddProduct} style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>স্টক ইনওয়ার্ড (মাল ক্রয়)</div>
              <input placeholder="পণ্যের নাম *" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <input placeholder="কেনা দাম *" type="number" value={newProdCost} onChange={(e) => setNewProdCost(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }} />
                <input placeholder="রিসেলার রেট" type="number" value={newProdResellerRate} onChange={(e) => setNewProdResellerRate(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }} />
                <input placeholder="বিক্রি দাম *" type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px' }} />
              </div>
              <input placeholder="স্টক পরিমাণ *" type="number" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '8px', boxSizing: 'border-box' }} />
              <input placeholder="মহাজন / সাপ্লায়ারের নাম" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f1117', border: '1px solid #282d3c', color: '#fff', borderRadius: '4px', marginBottom: '12px', boxSizing: 'border-box' }} />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>স্টকে যোগ করুন</button>
            </form>

            <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginBottom: '12px' }}>পার্টস ক্রয় ও মহাজন লেজার</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#11131a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>তারিখ</th>
                    <th style={{ padding: '8px' }}>পণ্য</th>
                    <th style={{ padding: '8px' }}>সাপ্লায়ার</th>
                    <th style={{ padding: '8px' }}>পরিমাণ</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>মোট কেনা খরচ</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseLedger.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #1f2330' }}>
                      <td style={{ padding: '8px', color: '#64748b' }}>{p.date}</td>
                      <td style={{ padding: '8px', color: '#fff' }}>{p.product_name}</td>
                      <td style={{ padding: '8px', color: '#94a3b8' }}>{p.supplier_name}</td>
                      <td style={{ padding: '8px' }}>{p.quantity}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: '#f59e0b' }}>Tk {p.total_cost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- 8. FACEBOOK CHATBOT ORDERS ---------------- */}
        {activeTab === 'fb_orders' && (
          <div style={{ background: '#181b24', border: '1px solid #282d3c', borderRadius: '6px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>ফেসবুক মেসেঞ্জার চ্যাটবট অর্ডার ডেস্কে আসা অর্ডার</div>
              <button onClick={() => alert('অর্ডার সিঙ্ক সম্পন্ন!')} style={{ padding: '6px 12px', background: '#222734', border: '1px solid #333b4f', color: '#38bdf8', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>🔄 Sync Orders</button>
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

      {/* ================= PRINTABLE INVOICE MODAL ================= */}
      {completedInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '100%', color: '#0f172a' }}>
            <div ref={invoicePdfRef} style={{ padding: '16px', background: '#fff' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
                  {completedInvoice.order_type === 'reseller' && completedInvoice.reseller ? completedInvoice.reseller.page_name : 'MODX BIKE MART'}
                </h2>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {completedInvoice.order_type === 'reseller' ? `Fulfilled by ModX | Partner: ${completedInvoice.reseller.name}` : 'Official POS Sales & Workshop Receipt'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Invoice #{completedInvoice.invoice_id} | {completedInvoice.date}</div>
              </div>

              <div style={{ fontSize: '12px', marginBottom: '12px', lineHeight: '1.6' }}>
                <div><strong>Customer:</strong> {completedInvoice.customer_name} ({completedInvoice.customer_phone})</div>
                <div><strong>Vehicle Reg:</strong> {completedInvoice.bike_number}</div>
                <div><strong>Payment:</strong> {completedInvoice.payment_method}</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '6px 0' }}>Item</th>
                    <th style={{ padding: '6px 0', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completedInvoice.items.map((i, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                      <td style={{ padding: '6px 0' }}>{i.name}</td>
                      <td style={{ padding: '6px 0', textAlign: 'center' }}>{i.quantity}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>Tk {i.customer_price}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>Tk {i.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '2px solid #0f172a', paddingTop: '8px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                <span>Net Payable:</span>
                <span>Tk {completedInvoice.paid_amount.toLocaleString()}</span>
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>
                Thank you for choosing us! Ride Safe.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={downloadInvoicePDF} style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>💾 Save PDF</button>
              <button onClick={() => setCompletedInvoice(null)} style={{ padding: '10px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <footer style={{ background: '#11131a', borderTop: '1px solid #282d3c', padding: '14px 24px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
        © {new Date().getFullYear()} <strong style={{ color: '#f8fafc' }}>ModX - Bike Modification Mart</strong>. All Rights Reserved. System Developed by <strong style={{ color: '#dc2626' }}>Md Raihan - AlaapAi</strong>
      </footer>
    </div>
  );
}