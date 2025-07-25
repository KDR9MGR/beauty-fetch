import React from 'react';

const TestPage = () => {
  console.log('TestPage rendering');
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>✅ Test Page</h1>
      <p>If you can see this, React is working!</p>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '15px', 
        marginTop: '20px',
        border: '1px solid #ddd',
        borderRadius: '4px'
      }}>
        <h2>Environment Check:</h2>
        <ul>
          <li>Mode: {import.meta.env.MODE}</li>
          <li>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
          <li>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
          <li>Timestamp: {new Date().toLocaleString()}</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ 
          display: 'inline-block',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          Back to Home
        </a>
      </div>
    </div>
  );
};

export default TestPage; 