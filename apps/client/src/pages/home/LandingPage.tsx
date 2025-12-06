
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100">
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">X</div>
            <span className="font-bold text-xl tracking-tight">Xeno<span className="text-blue-600">FDE</span></span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>Log In</Button>
            <Button variant="primary" onClick={() => navigate('/register')}>Get Started</Button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium border border-blue-100">
              New: Real-time Shopify Sync
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mt-6 leading-tight">
              Turn your data into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Actionable Growth.</span>
            </h1>
            <p className="text-xl text-gray-500 mt-6 max-w-2xl mx-auto">
              The all-in-one analytics dashboard for modern e-commerce brands. Connect your store in seconds and unlock revenue insights immediately.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button variant="gradient" className="h-12 text-lg px-8" onClick={() => navigate('/register')}>
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mt-24 text-left">
            {[
              { icon: Zap, title: "Real-time Sync", desc: "Webhooks ensure your data is always up to the second." },
              { icon: TrendingUp, title: "Revenue Trajectory", desc: "Visualize growth with advanced charting tools." },
              { icon: ShieldCheck, title: "Enterprise Security", desc: "Your data is encrypted and secure by default." },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}
                className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
                <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm mb-4">
                  <item.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                <p className="text-gray-500 mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}