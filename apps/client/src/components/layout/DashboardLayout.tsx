import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Orders', icon: ShoppingBag, path: '/orders' },
    { label: 'Products', icon: Package, path: '/products' },
    { label: 'Customers', icon: Users, path: '/customers' },
    { label: 'Checkouts', icon: LogOut, path: '/checkouts' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full hidden lg:block z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">X</div>
          <span className="font-bold text-lg">XenoFDE</span>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div 
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-medium cursor-pointer transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-700 border border-blue-100" 
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} /> 
                {item.label}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-gray-400 truncate">ID: {user?.tenantId.slice(0,8)}...</p>
          </div>
          <Button variant="outline" onClick={logout} className="w-full text-red-600 hover:bg-red-50 border-red-100 justify-start">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}