import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import WorkshopList from './pages/WorkshopList';
import WorkshopCheckout from './pages/WorkshopCheckout';
import PaymentSuccess from './pages/PaymentSuccess';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/workshops" element={<WorkshopList />} />
        <Route path="/workshop/:workshopId/checkout" element={<WorkshopCheckout />} />
        <Route path="/workshop/:workshopId/success" element={<PaymentSuccess />} />
        <Route path="/" element={<Navigate to="/workshops" replace />} />
      </Routes>
    </Router>
  );
}

export default App

