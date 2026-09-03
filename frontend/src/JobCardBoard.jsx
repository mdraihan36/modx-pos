import React, { useState, useEffect } from 'react';

const COLUMNS = ['Queued', 'In Progress', 'Washing', 'Ready'];

export default function JobCardBoard() {
  const [cards, setCards] = useState([
    { id: 101, bike_number: 'DHAKA-HA-1234', customer_name: 'Tanvir Ahmed', service_type: 'Full Master Servicing', mechanic_name: 'Karim', status: 'Queued' },
    { id: 102, bike_number: 'DHAKA-LA-5678', customer_name: 'Rafiqul Islam', service_type: 'Mobil & Brake Change', mechanic_name: 'Rahim', status: 'In Progress' }
  ]);
  const [newBike, setNewBike] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newService, setNewService] = useState('');
  const [newMechanic, setNewMechanic] = useState('');

  useEffect(() => {
    fetchJobCards();
  }, []);

  const fetchJobCards = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/jobcards');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) setCards(data);
      }
    } catch (err) {
      console.log('Using local fallback cards');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newBike || !newService) return alert('Bike number and service type are required!');

    const payload = {
      bike_number: newBike,
      customer_name: newCustomer,
      service_type: newService,
      mechanic_name: newMechanic,
      status: 'Queued'
    };

    try {
      const res = await fetch('http://localhost:5000/api/jobcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setCards([data.job_card, ...cards]);
      }
    } catch (err) {
      setCards([{ ...payload, id: Date.now() }, ...cards]);
    }

    setNewBike('');
    setNewCustomer('');
    setNewService('');
    setNewMechanic('');
  };

  const moveStatus = async (id, nextStatus) => {
    try {
      await fetch(`http://localhost:5000/api/jobcards/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      console.log('Local status update fallback');
    }
    setCards(cards.map((c) => (c.id === id ? { ...c, status: nextStatus } : c)));
  };

  return (
    <div style={{ marginTop: '24px' }}>
      {/* New Job Card Form */}
      <form onSubmit={handleCreate} style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input placeholder="Bike No *" value={newBike} onChange={(e) => setNewBike(e.target.value)} style={{ flex: 1, minWidth: '130px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
        <input placeholder="Customer Name" value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} style={{ flex: 1, minWidth: '130px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
        <input placeholder="Service Task *" value={newService} onChange={(e) => setNewService(e.target.value)} style={{ flex: 1.2, minWidth: '150px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
        <input placeholder="Mechanic Assigned" value={newMechanic} onChange={(e) => setNewMechanic(e.target.value)} style={{ flex: 1, minWidth: '130px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
        <button type="submit" style={{ padding: '8px 18px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Create Job</button>
      </form>

      {/* Kanban Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {COLUMNS.map((col) => (
          <div key={col} style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px', minHeight: '350px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
              <span>{col}</span>
              <span style={{ background: '#cbd5e1', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{cards.filter((c) => c.status === col).length}</span>
            </div>
            {cards.filter((c) => c.status === col).map((card) => (
              <div key={card.id} style={{ background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '13px' }}>{card.bike_number}</div>
                <div style={{ fontSize: '13px', margin: '4px 0', fontWeight: '500' }}>{card.service_type}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Cust: {card.customer_name || 'N/A'} | Mech: {card.mechanic_name || 'Unassigned'}</div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {COLUMNS.map((step) => step !== card.status && (
                    <button key={step} onClick={() => moveStatus(card.id, step)} style={{ fontSize: '10px', padding: '2px 6px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer' }}>
                      ➔ {step}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}