import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface RecycleTransaction {
  id: string;
  userId: string;
  recycledItemClassification: string;
  itemDescription: string;
  rewardAmount: number;
  location?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  processedAt?: Date;
  imageUrl?: string;
  metadata?: {
    weight?: number;
    volume?: number;
    condition?: string;
    aiConfidence?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export function RecycleTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<RecycleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/users/${user.id}/recycle-transactions`);
        
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        } else {
          setError('Failed to load transactions');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'pending':
        return '#f59e0b'; // yellow
      case 'failed':
        return '#ef4444'; // red
      case 'cancelled':
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '🚫';
      default:
        return '❓';
    }
  };

  const getItemEmoji = (classification: string) => {
    const emojiMap: { [key: string]: string } = {
      'plastic_bottle': '🍶',
      'aluminum_can': '🥤',
      'cardboard': '📦',
      'paper': '📄',
      'glass_bottle': '🍾',
      'metal': '🔩',
      'electronics': '📱',
      'battery': '🔋',
      'organic': '🍎',
      'textile': '👕'
    };
    return emojiMap[classification] || '♻️';
  };

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        padding: '2rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          textAlign: 'center',
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#667eea', marginBottom: '1rem' }}>Please Sign In</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            You need to be signed in to view your recycling transactions.
          </p>
          <Link 
            to="/sign-in" 
            style={{ 
              color: '#667eea', 
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Sign In →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              margin: 0,
              color: '#333'
            }}>
              ♻️ My Recycling History
            </h1>
            <Link 
              to="/" 
              style={{ 
                color: '#667eea', 
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1.1rem'
              }}
            >
              ← Back to Home
            </Link>
          </div>
          <p style={{ 
            margin: 0, 
            color: '#666',
            fontSize: '1.1rem'
          }}>
            Track your recycling activities and SBC token rewards
          </p>
        </div>

        {/* Content */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <p>Loading your recycling transactions...</p>
            </div>
          ) : error ? (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center',
              color: '#ef4444'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>♻️</div>
              <h3 style={{ color: '#333', marginBottom: '1rem' }}>No Recycling Transactions Yet</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Start recycling to earn SBC tokens and see your transactions here!
              </p>
              <Link 
                to="/sbc-agent-sim" 
                style={{ 
                  color: '#667eea', 
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Try the Simulator →
              </Link>
            </div>
          ) : (
            <div style={{ padding: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  margin: 0,
                  color: '#333'
                }}>
                  {transactions.length} Transaction{transactions.length !== 1 ? 's' : ''}
                </h2>
                <div style={{ 
                  background: '#f0f9ff', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '20px',
                  color: '#0369a1',
                  fontWeight: '600'
                }}>
                  Total Earned: {transactions.reduce((sum, t) => sum + t.rewardAmount, 0).toFixed(2)} SBC
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      background: '#fafafa',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '2rem' }}>
                          {getItemEmoji(transaction.recycledItemClassification)}
                        </div>
                        <div>
                          <h3 style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: 'bold', 
                            margin: 0,
                            color: '#333'
                          }}>
                            {transaction.itemDescription}
                          </h3>
                          <p style={{ 
                            margin: 0, 
                            color: '#666',
                            fontSize: '0.9rem',
                            textTransform: 'capitalize'
                          }}>
                            {transaction.recycledItemClassification.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '1.3rem', 
                          fontWeight: 'bold', 
                          color: '#10b981',
                          marginBottom: '0.25rem'
                        }}>
                          +{transaction.rewardAmount} SBC
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          fontSize: '0.85rem',
                          color: getStatusColor(transaction.status)
                        }}>
                          {getStatusEmoji(transaction.status)}
                          {transaction.status}
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '1rem',
                      fontSize: '0.9rem',
                      color: '#666'
                    }}>
                      <div>
                        <strong>Date:</strong> {formatDate(transaction.createdAt)}
                      </div>
                      {transaction.location && (
                        <div>
                          <strong>Location:</strong> {transaction.location}
                        </div>
                      )}
                      {transaction.metadata?.weight && (
                        <div>
                          <strong>Weight:</strong> {transaction.metadata.weight} kg
                        </div>
                      )}
                      {transaction.metadata?.aiConfidence && (
                        <div>
                          <strong>AI Confidence:</strong> {(transaction.metadata.aiConfidence * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>

                    {transaction.notes && (
                      <div style={{ 
                        marginTop: '1rem', 
                        padding: '0.75rem', 
                        background: '#f0f9ff', 
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        color: '#0369a1'
                      }}>
                        <strong>Notes:</strong> {transaction.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecycleTransactions;
