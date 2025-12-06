import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

// Fix: Extend HTMLMotionProps instead of React.ButtonHTMLAttributes to resolve onDrag type conflict
interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'outline' | 'ghost' | 'gradient';
  children: ReactNode;
}

export const Button = ({ children, onClick, variant = 'primary', className, disabled, type = 'button', ...props }: ButtonProps) => {
  const base = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50 h-10 px-6 py-2 active:scale-95";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",
    gradient: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/25 border-0",
    outline: "border border-gray-200 bg-white shadow-sm hover:bg-gray-50 text-gray-900",
    ghost: "hover:bg-gray-100 text-gray-700",
  };

  return (
    <motion.button 
      whileTap={{ scale: 0.98 }}
      type={type}
      disabled={disabled}
      onClick={onClick} 
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {disabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  );
};