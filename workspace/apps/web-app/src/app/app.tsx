import { Route, Routes, Link } from 'react-router-dom';
import SbcAgentSim from './SbcAgentSim';

export function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navigation */}
      <nav style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '1rem 2rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/" style={{ 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            marginRight: 'auto'
          }}>
            ♻️ Trash2Cash
          </Link>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem 1rem' }}>Home</Link>
          <Link to="/page-2" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem 1rem' }}>About</Link>
          <Link to="/sbc-agent-sim" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem 1rem' }}>Simulator</Link>
        </div>
      </nav>

      <div style={{ flex: 1 }}>
        <Routes>
        <Route
          path="/"
          element={
            <div>
              {/* Hero Section */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%), url(https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1600&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                color: 'white',
                padding: '5rem 2rem',
                textAlign: 'center'
              }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                  <h1 style={{ 
                    fontSize: '3.5rem', 
                    fontWeight: 'bold', 
                    marginBottom: '1.5rem',
                    lineHeight: '1.2'
                  }}>
                    Turn Trash to Cash in Real-Time
                  </h1>
                  <p style={{ 
                    fontSize: '1.5rem', 
                    marginBottom: '2.5rem',
                    opacity: 0.95,
                    lineHeight: '1.6'
                  }}>
                    Earn rewards instantly by recycling. Scan, recycle, and get paid in SBC tokens on the Solana blockchain.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link 
                      to="/sbc-agent-sim" 
                      style={{
                        background: 'white',
                        color: '#667eea',
                        padding: '1rem 2.5rem',
                        borderRadius: '50px',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      Try Simulator
                    </Link>
                    <Link 
                      to="/page-2" 
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '1rem 2.5rem',
                        borderRadius: '50px',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        border: '2px solid white',
                        transition: 'transform 0.2s'
                      }}
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ 
                  textAlign: 'center', 
                  fontSize: '2.5rem', 
                  marginBottom: '3rem',
                  color: '#333'
                }}>
                  How It Works
                </h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                  gap: '2rem' 
                }}>
                  <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center',
                    borderRadius: '12px',
                    background: '#f8f9fa',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#667eea' }}>Scan</h3>
                    <p style={{ color: '#666', lineHeight: '1.6' }}>
                      Use our AI-powered scanner to identify recyclable items instantly
                    </p>
                  </div>
                  <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center',
                    borderRadius: '12px',
                    background: '#f8f9fa',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>♻️</div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#667eea' }}>Recycle</h3>
                    <p style={{ color: '#666', lineHeight: '1.6' }}>
                      Drop off your items at designated collection points
                    </p>
                  </div>
                  <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center',
                    borderRadius: '12px',
                    background: '#f8f9fa',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#667eea' }}>Earn</h3>
                    <p style={{ color: '#666', lineHeight: '1.6' }}>
                      Receive SBC tokens directly to your wallet in real-time
                    </p>
                  </div>
                </div>
              </div>
            </div>
          }
        />
        <Route
          path="/page-2"
          element={
            <div style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#333' }}>About Trash2Cash</h1>
              <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#666', marginBottom: '1rem' }}>
                Trash2Cash is revolutionizing the recycling industry by incentivizing sustainable behavior through blockchain technology.
              </p>
              <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#666' }}>
                Every item you recycle earns you real value in the form of SBC tokens, which can be used within our ecosystem or traded.
              </p>
              <div style={{ marginTop: '2rem' }}>
                <Link to="/" style={{ color: '#667eea', fontSize: '1.1rem', textDecoration: 'none' }}>← Back to Home</Link>
              </div>
            </div>
          }
        />
        <Route path="/sbc-agent-sim" element={<SbcAgentSim />} />
        </Routes>
      </div>

      {/* Footer */}
      <footer style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '3rem 2rem 1.5rem',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {/* Company Info */}
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                ♻️ Trash2Cash
              </h3>
              <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
                Revolutionizing recycling through blockchain technology. Turn your waste into wealth instantly.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Quick Links
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link to="/" style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>
                    Home
                  </Link>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link to="/page-2" style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>
                    About Us
                  </Link>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link to="/sbc-agent-sim" style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>
                    Try Simulator
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Connect With Us
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.5rem', opacity: 0.9 }}>
                  📧 hello@trash2cash.io
                </li>
                <li style={{ marginBottom: '0.5rem', opacity: 0.9 }}>
                  🐦 @Trash2Cash
                </li>
                <li style={{ marginBottom: '0.5rem', opacity: 0.9 }}>
                  💬 Discord Community
                </li>
              </ul>
            </div>

            {/* Blockchain Info */}
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Powered By
              </h4>
              <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
                ⚡ Solana Blockchain<br />
                🪙 SBC Tokens<br />
                🔐 Secure & Transparent
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: '1.5rem',
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <p style={{ margin: 0, opacity: 0.8 }}>
              © 2025 Trash2Cash. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <a href="#" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>
                Privacy Policy
              </a>
              <a href="#" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>
                Terms of Service
              </a>
              <a href="#" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>
                FAQ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
