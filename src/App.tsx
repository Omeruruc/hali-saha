import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import FieldsList from './pages/fields/FieldsList';
import FieldDetail from './pages/fields/FieldDetail';
import AdminDashboard from './pages/admin/Dashboard';
import AddField from './pages/admin/AddField';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/fields" element={<FieldsList />} />
            <Route path="/fields/:id" element={<FieldDetail />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/fields/new" element={<AddField />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;