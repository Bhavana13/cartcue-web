import { useState, useEffect } from 'react';

// Cloud Run URL comes from .env.production at build time; local dev talks to uvicorn
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const CATEGORIES = ['All', "Women's Dresses", "Men's Apparels", 'Electronics'];

const PRODUCTS = [
  { id: 1, category: "Women's Dresses", name: 'Women Fit & Flare Dress', price: 826, image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&auto=format&fit=crop&q=60' },
  { id: 2, category: "Women's Dresses", name: 'Royal Export Maxi Dress', price: 885, image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&auto=format&fit=crop&q=60' },
  { id: 3, category: "Women's Dresses", name: 'Sangria Embroidered Dress', price: 991, image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&auto=format&fit=crop&q=60' },
  { id: 4, category: "Women's Dresses", name: 'SFOTY A-Line Midi Dress', price: 699, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&auto=format&fit=crop&q=60' },
  { id: 5, category: "Men's Apparels", name: 'Classic Oxford Casual Shirt', price: 1199, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&auto=format&fit=crop&q=60' },
  { id: 6, category: "Men's Apparels", name: 'Slim Fit Denim Jeans', price: 1799, image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=60' },
  { id: 7, category: "Men's Apparels", name: 'Oversized Cotton Hoodie', price: 1499, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60' },
  { id: 8, category: "Men's Apparels", name: 'Formal Tailored Blazer', price: 3499, image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=60' },
  { id: 9, category: 'Electronics', name: 'Wireless Noise-Canceling Earbuds', price: 2999, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60' },
  { id: 10, category: 'Electronics', name: 'Smart Fitness Tracker Watch', price: 2499, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60' },
  { id: 11, category: 'Electronics', name: 'Portable Bluetooth Speaker', price: 1899, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60' },
  { id: 12, category: 'Electronics', name: 'HD Action Camera 4K', price: 4999, image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60' },
];

const SHIPPING_OPTIONS = [
  { label: 'Standard Delivery (Free)', fee: 0 },
  { label: 'Express Delivery (Rs. 150)', fee: 150 },
  { label: 'Same-Day Priority Delivery (Rs. 350)', fee: 350 }
];

const PLATFORM_FEE = 23;

async function fetchDashboardData() {
  const responses = await Promise.all([
    fetch(`${API_BASE_URL}/sessions?limit=20`),
    fetch(`${API_BASE_URL}/analytics/summary`)
  ]);
  if (responses.some(res => !res.ok)) throw new Error('Backend returned an error');
  return Promise.all(responses.map(res => res.json()));
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#store');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [agentMessage, setAgentMessage] = useState(null);
  
  // Exit-Intent AI states
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitAiMessage, setExitAiMessage] = useState('');
  const [isFetchingExitAi, setIsFetchingExitAi] = useState(false);
  const [hasTriggeredExit, setHasTriggeredExit] = useState(false);
  const [exitOffer, setExitOffer] = useState(null);
  const [exitOfferApplied, setExitOfferApplied] = useState(false);
  
  // Checkout options state
  const [selectedPayment, setSelectedPayment] = useState('PhonePe');
  const [selectedShipping, setSelectedShipping] = useState(SHIPPING_OPTIONS[0]);

  // Dashboard states
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(null);

  // Table filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Dynamic price calculations
  const itemsTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const finalTotalAmount = itemsTotal > 0 ? itemsTotal + selectedShipping.fee + PLATFORM_FEE : 0;

  useEffect(() => {
    const handleHashChange = () => setCurrentRoute(window.location.hash || '#store');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // AI-Driven Exit-Intent Mouseleave Event Listener
  useEffect(() => {
  const handleMouseLeave = async (e) => {
    if (e.clientY <= 10 && !showExitModal && !hasTriggeredExit && !isBagOpen && cart.length > 0) {
        setShowExitModal(true);
        setHasTriggeredExit(true); // Ensures it only triggers once!
        setIsFetchingExitAi(true);
        try {
          const res = await fetch(`${API_BASE_URL}/agent/exit-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart_items: cart, total_value: finalTotalAmount })
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setExitAiMessage(data.message);
          setExitOffer(data.offer_type ? { type: data.offer_type, label: data.offer_label } : null);
        } catch (err) {
          console.error('Exit intent AI error:', err);
          setExitAiMessage("We noticed you left items in your bag. Stay a bit longer!");
          setExitOffer(null);
        } finally {
          setIsFetchingExitAi(false);
        }
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showExitModal, hasTriggeredExit, isBagOpen, cart, finalTotalAmount]);

  // Applies the offer Nova presented in the exit-intent popup, then shows the updated bag
  const applyExitOffer = () => {
    if (exitOffer?.type === 'FREE_PRIORITY_DELIVERY') {
      const priorityOpt = SHIPPING_OPTIONS.find(opt => opt.label.includes('Priority')) || SHIPPING_OPTIONS[2];
      setSelectedShipping({ ...priorityOpt, fee: 0, waived: true });
    } else if (exitOffer?.type === 'PERCENT_OFF_10') {
      // Items already discounted by a wishlist offer keep their price
      setCart(cart.map(item => item.novaOffer ? item : { ...item, price: Math.round(item.price * 0.9), novaOffer: true }));
    }
    setExitOfferApplied(true);
    setShowExitModal(false);
    setIsBagOpen(true);
  };

  const loadDashboardData = () =>
    fetchDashboardData()
      .then(([sessionsData, summaryData]) => {
        setSessions(sessionsData);
        setSummary(summaryData);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        setError(`Could not load dashboard data from ${API_BASE_URL}.`);
      });

  useEffect(() => {
    if (currentRoute === '#dashboard') {
      loadDashboardData();
    }
  }, [currentRoute]);

  const filteredProducts = selectedCategory === 'All' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === selectedCategory);

  const addToCart = (product) => {
    setCart([...cart, product]);
    setIsBagOpen(true);
  };

  const moveToWishlist = async (product, cartIndex) => {
    setCart(cart.filter((_, idx) => idx !== cartIndex));
    setWishlist([...wishlist, product]);

    try {
      const res = await fetch(`${API_BASE_URL}/agent/wishlist-hesitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: product.name, price: product.price })
      });
      if (res.ok) {
        const data = await res.json();
        setAgentMessage(data.message);
      }
    } catch (err) {
      console.error("Agent error:", err);
    }
  };

  const handleRecoverSession = async (targetId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${targetId}/recover`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to recover session');
      const data = await res.json();
      alert(`Recovery email successfully dispatched for session ${targetId}!\nSubject: ${data.mock_email?.subject}`);
      loadDashboardData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCheckoutOrder = async () => {
    try {
      const isAiAgentOrder = cart.some(item => item.novaOffer) || Boolean(selectedShipping.waived);

      const res = await fetch(`${API_BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_items: cart,
          total_value: finalTotalAmount,
          payment_method: selectedPayment,
          shipping_method: selectedShipping.label,
          shipping_fee_waived: Boolean(selectedShipping.waived),
          recovery_source: !isAiAgentOrder ? 'ORGANIC' : exitOfferApplied ? 'NOVA_EXIT_INTENT_AGENT' : 'NOVA_WISHLIST_AGENT',
          nova_intervention_triggered: isAiAgentOrder
        })
      });

      if (!res.ok) throw new Error('Checkout failed');
      const data = await res.json();

      alert(`🎉 Order Placed Successfully!\nOrder ID: ${data.order_id}\nPayment via: ${selectedPayment}\nShipping: ${selectedShipping.label}\nTotal Paid: Rs. ${data.total_value}`);

      setCart([]);
      setSelectedShipping(SHIPPING_OPTIONS[0]);
      setExitOfferApplied(false);
      setWishlist([]);
      setAgentMessage(null);
      setIsBagOpen(false);
      window.location.hash = '#dashboard';
    } catch (err) {
      console.error(err);
      alert('Checkout failed. Make sure your FastAPI backend is running.');
    }
  };

  const handleSimulateCause = async (causeName, causeEnum) => {
    try {
      const generatedSessionId = `cs_${Math.random().toString(16).slice(2, 10)}`;

      const sessionPayload = {
        session_id: generatedSessionId,
        item_count: cart.length,
        cart_value: finalTotalAmount,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, category: i.category })),
        ground_truth_cause: causeEnum,
        drop_off_step: "CHECKOUT",
        status: "abandoned",
        created_at: new Date().toISOString()
      };

      const res = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionPayload)
      });

      if (!res.ok) throw new Error('Failed to save session');

      alert(`Simulated Checkout Drop-off!\nSession ID: ${generatedSessionId}\nCause: ${causeName}\nTotal: Rs. ${finalTotalAmount}`);
      setIsBagOpen(false);
      setCart([]);
      setSelectedShipping(SHIPPING_OPTIONS[0]);
      window.location.hash = '#dashboard';
    } catch (err) {
      console.error(err);
      alert('Simulation failed: Make sure FastAPI backend is running on port 8000.');
    }
  };

  const handleAnalyze = async (sessionObj) => {
    setLoading(true);
    setError(null);
    setResult(null);
    const targetId = sessionObj?.session_id || sessionObj?.id || sessionId;

    if (sessionObj?.is_nova_analysed && sessionObj?.nova_analysis) {
      setResult({
        session_id: targetId,
        primary_cause: sessionObj.nova_analysis.primary_cause,
        confidence_score: sessionObj.nova_analysis.confidence_score,
        explanation: sessionObj.nova_analysis.explanation,
        evidence_summary: sessionObj.nova_analysis.evidence_summary || []
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: targetId }),
      });
      if (!response.ok) throw new Error('Server error or session not found.');
      const data = await response.json();
      setResult(data);
      loadDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleString();
  };

  const filteredSessions = sessions.filter(s => {
    const sId = (s.session_id || s.id || '').toLowerCase();
    const matchesSearch = sId.includes(searchQuery.toLowerCase());
    const status = (s.status || 'ABANDONED').toUpperCase();
    
    if (statusFilter === 'COMPLETED') return matchesSearch && status === 'COMPLETED';
    if (statusFilter === 'ABANDONED') return matchesSearch && status !== 'COMPLETED';
    return matchesSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = filteredSessions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage) || 1;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-8 py-3.5 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-tighter text-pink-600">Omnivo</span>
            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded font-bold">Powered by CartCue</span>
          </div>
          <div className="flex gap-2">
            <a href="#store" className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${currentRoute === '#store' ? 'bg-pink-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🛍️ Omnivo Store</a>
            <a href="#dashboard" className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${currentRoute === '#dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🧠 CartCue AI Dashboard</a>
          </div>
        </div>

        {currentRoute === '#store' && (
          <button onClick={() => setIsBagOpen(true)} className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold rounded-lg shadow transition flex items-center gap-2">
            🛒 Bag ({cart.length}) {wishlist.length > 0 && `| 💡 Wishlist (${wishlist.length})`}
          </button>
        )}
      </nav>

      {/* AI-Driven Exit-Intent Modal Popup */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md p-6 text-center shadow-2xl border border-purple-100">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nova AI Intercept</h3>
            
            {isFetchingExitAi ? (
              <p className="text-sm text-gray-500 py-4">Nova is analyzing your cart for personalized perks...</p>
            ) : (
              <>
                <p className="text-sm text-purple-700 font-medium bg-purple-50 p-3 rounded-xl border border-purple-100 mb-3">
                  "{exitAiMessage}"
                </p>
                {exitOffer && (
                  <p className="text-xs font-bold text-green-700 mb-6">🎁 Your offer: {exitOffer.label}</p>
                )}
              </>
            )}

            <div className="flex gap-3">
              {exitOffer ? (
                <button
                  onClick={applyExitOffer}
                  disabled={isFetchingExitAi}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  Apply Offer 🎁
                </button>
              ) : (
                <button
                  onClick={() => setShowExitModal(false)}
                  disabled={isFetchingExitAi}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  Continue Shopping 🛍️
                </button>
              )}
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold transition cursor-pointer"
              >
                No Thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Views */}
      {currentRoute === '#store' ? (
        <div className="max-w-7xl mx-auto p-8">
          {agentMessage && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h4 className="text-xs font-bold text-purple-900 uppercase">Nova Proactive AI Agent Intervention</h4>
                  <p className="text-sm text-purple-700 font-medium">{agentMessage}</p>
                </div>
              </div>
              <button onClick={() => setAgentMessage(null)} className="text-purple-400 hover:text-purple-700 font-bold">✕</button>
            </div>
          )}

          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Explore Catalog & Test Checkout Triggers</h1>
              <p className="text-sm text-gray-500">Filter category, add to bag, or test wishlist price hesitation.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>{cat}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition">
                <img src={p.image} alt={p.name} className="w-full h-64 object-cover" />
                <div className="p-4">
                  <span className="text-[10px] font-bold text-pink-600 uppercase tracking-wide bg-pink-50 px-2 py-0.5 rounded">{p.category}</span>
                  <h3 className="font-semibold text-gray-800 text-sm mt-1.5 mb-1">{p.name}</h3>
                  <p className="text-gray-900 font-bold mb-4">Rs. {p.price}</p>
                  <button onClick={() => addToCart(p)} className="w-full py-2.5 bg-gray-900 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition">Add to Bag</button>
                </div>
              </div>
            ))}
          </div>

          {/* Bag Drawer */}
          {isBagOpen && (
            <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
              <div className="w-full max-w-md bg-white h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
                <div>
                  <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h2 className="text-lg font-bold text-gray-800">Shopping Bag ({cart.length})</h2>
                    <button onClick={() => setIsBagOpen(false)} className="text-gray-400 hover:text-gray-700 font-bold text-lg">✕</button>
                  </div>

                  <div className="space-y-3 mb-6">
                    {cart.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Your bag is empty.</p>
                    ) : (
                      cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b pb-3">
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <span className="text-xs text-gray-400">Rs. {item.price}</span>
                          </div>
                          <button onClick={() => moveToWishlist(item, idx)} className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg transition border border-purple-200">
                            💡 Move to Wishlist
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {wishlist.length > 0 && (
                    <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <h4 className="text-xs font-bold text-purple-900 uppercase mb-2">Wishlist (Dynamic AI Offer Test)</h4>
                      {wishlist.map((w, idx) => {
                        const isExpressUpgrade = w.price > 1500;
                        const adjustedPrice = isExpressUpgrade ? w.price : Math.round(w.price * 0.9);
                        
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs text-purple-800 py-2 border-b border-purple-200/50 last:border-0">
                            <div>
                              <p className="font-semibold">{w.name}</p>
                              {isExpressUpgrade ? (
                                <span className="text-blue-600 font-bold">✨ Free Same-Day Priority Delivery Unlocked!</span>
                              ) : (
                                <>
                                  <span className="line-through text-gray-400">Rs. {w.price}</span>{' '}
                                  <span className="text-green-600 font-bold">Rs. {adjustedPrice} (10% Off)</span>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (isExpressUpgrade) {
                                  const priorityOpt = SHIPPING_OPTIONS.find(opt => opt.label.includes('Priority')) || SHIPPING_OPTIONS[2];
                                  setSelectedShipping({ ...priorityOpt, fee: 0, waived: true });
                                }
                                setCart([...cart, { ...w, price: adjustedPrice, novaOffer: true }]);
                                setWishlist(wishlist.filter((_, i) => i !== idx));
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition shadow-sm"
                            >
                              🛒 Move to Bag
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Shipping Method</label>
                        <select
                          value={selectedShipping.label}
                          onChange={(e) => {
                            const found = SHIPPING_OPTIONS.find(opt => opt.label === e.target.value);
                            setSelectedShipping(found);
                          }}
                          className="w-full text-xs p-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-pink-500"
                        >
                          {SHIPPING_OPTIONS.map((opt, idx) => (
                            <option key={idx} value={opt.label}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Select Payment Gateway</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['PhonePe', 'GooglePay', 'Paytm'].map((gateway) => (
                            <button
                              key={gateway}
                              type="button"
                              onClick={() => setSelectedPayment(gateway)}
                              className={`py-2 text-xs font-bold rounded-xl border transition ${selectedPayment === gateway ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                            >
                              {gateway}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                        <h4 className="font-bold text-gray-700 uppercase tracking-wide mb-1">Price Details</h4>
                        <div className="flex justify-between text-gray-600">
                          <span>Bag Total (MRP)</span>
                          <span>Rs. {itemsTotal}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Shipping Fee</span>
                          <span>{selectedShipping.fee === 0 ? 'FREE' : `Rs. ${selectedShipping.fee}`}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Platform Fee</span>
                          <span>Rs. {PLATFORM_FEE}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-sm">
                          <span>Total Amount</span>
                          <span className="text-pink-600">Rs. {finalTotalAmount}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleCheckoutOrder}
                        className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
                      >
                        🛍️ Pay via {selectedPayment} & Place Order
                      </button>

                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-[10px] uppercase font-bold">Or test failure triggers</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                      </div>

                      <button onClick={() => handleSimulateCause('Shipping Fee Shock', 'SHIPPING_COST_SURPRISE')} className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-sm">🚨 Trigger: Shipping Fee Shock</button>
                      <button onClick={() => handleSimulateCause('Payment Gateway Timeout', 'PAYMENT_FRICTION')} className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm">⚠️ Trigger: Payment Gateway Timeout</button>
                      <button onClick={() => handleSimulateCause('Forced Account Wall', 'TECHNICAL_DROP_OFF')} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm">🔒 Trigger: Forced Account Wall</button>
                    </div>
                  )}
                </div>
                <button onClick={() => setIsBagOpen(false)} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition mt-4">Continue Shopping</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* --- DASHBOARD VIEW --- */
        <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            {summary && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Executive Metrics</h2>
                <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Abandoned Sessions:</span><span className="font-bold text-gray-900">{summary.total_abandoned_sessions}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Recovery Rate:</span><span className="font-bold text-green-600">{summary.recovery_rate_percentage}%</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Revenue at Risk:</span><span className="font-bold text-pink-600">Rs. {summary.total_revenue_at_risk}</span></div>
                
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-purple-900">
                    <span>🤖 AI Recovered Orders:</span>
                    <span>{summary.ai_agent_stats?.recovered_orders_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-purple-900">
                    <span>💡 AI Recovered Revenue:</span>
                    <span className="text-purple-600">Rs. {summary.ai_agent_stats?.recovered_revenue || 0}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Run Diagnostics</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Session ID</label>
                <input type="text" value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={() => handleAnalyze({ session_id: sessionId })} disabled={loading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition disabled:opacity-50">{loading ? 'Nova Analyzing...' : 'Run Diagnostics'}</button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm"><strong>Error:</strong> {error}</div>}

            {result && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200 bg-gradient-to-br from-blue-50/20 to-white">
                <h3 className="text-sm font-bold text-blue-900 uppercase mb-3">Nova Diagnostic Report</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Primary Cause:</strong> <span className="text-red-600 font-semibold">{result.primary_cause}</span></p>
                  <p><strong>Confidence Score:</strong> {(result.confidence_score * 100).toFixed(0)}%</p>
                  <p><strong>Explanation:</strong> {result.explanation}</p>
                  {result.evidence_summary?.length > 0 && (
                    <div>
                      <strong>Evidence:</strong>
                      <ul className="list-disc ml-5 mt-1 text-gray-700">
                        {result.evidence_summary.map((ev, i) => <li key={i}>{ev}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <h2 className="text-lg font-bold text-gray-800">Checkout Sessions & Orders</h2>
                
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Search Session ID..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-44"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs bg-white font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ABANDONED">Abandoned</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase">
                      <th className="pb-2">Session ID</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Created At</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentSessions.length === 0 ? (
                      <tr><td colSpan="4" className="py-6 text-center text-gray-400 text-xs">No matching sessions found.</td></tr>
                    ) : (
                      currentSessions.map((s, idx) => {
                        const isCompleted = (s.status || '').toUpperCase() === 'COMPLETED';
                        const isWaiting = (s.status || '').toUpperCase() === 'WAITING_ON_USER_TO_ACT';
                        const isAiRecovered = isCompleted && s.metadata?.nova_intervention_triggered === true;
                        const isAlreadyAnalyzed = s.is_nova_analysed === true || s.nova_analysis != null;
                        
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-3 font-mono text-xs text-blue-600">
                              {s.session_id || s.id}
                              {isAiRecovered && (
                                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">
                                  🤖 AI Recovered
                                </span>
                              )}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isCompleted 
                                  ? 'bg-green-100 text-green-700' 
                                  : isWaiting 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {s.status || 'ABANDONED'}
                              </span>
                            </td>
                            <td className="py-3 text-xs text-gray-500">{formatDate(s.created_at)}</td>
                            <td className="py-3 text-right space-x-2">
                              {isCompleted ? (
                                <span className="text-xs text-gray-400 font-semibold italic px-2">Order Completed</span>
                              ) : isWaiting ? (
                                <span className="text-xs text-purple-600 font-semibold italic px-2">📧 Email Sent (Waiting...)</span>
                              ) : (
                                <>
                                  <button onClick={() => { setSessionId(s.session_id || s.id); handleAnalyze(s); }} className="px-3 py-1 bg-gray-100 hover:bg-blue-600 hover:text-white text-xs font-semibold rounded-lg transition">
                                    {isAlreadyAnalyzed ? '🔍 Show Analysis' : 'Analyze'}
                                  </button>
                                  <button onClick={() => handleRecoverSession(s.session_id || s.id)} className="px-3 py-1 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 text-xs font-semibold rounded-lg transition border border-purple-200">🚀 Recover</button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center pt-4 mt-4 border-t border-gray-100 text-xs text-gray-600 gap-3">
                <span>
                  Showing {filteredSessions.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredSessions.length)} of {filteredSessions.length} sessions
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="font-bold px-2">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}