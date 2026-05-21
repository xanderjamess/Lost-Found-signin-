import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Item } from '../types';

interface ItemCardProps {
  item: Item;
  reporterName?: string;
  onClick?: (item: Item) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, reporterName, onClick }) => {
  const statusColors = {
    'pending': 'bg-amber-100 text-amber-700',
    'lost': 'bg-red-100 text-red-700',
    'found': 'bg-primary/10 text-primary',
    'claimed': 'bg-green-100 text-green-700',
    'under-review': 'bg-blue-100 text-blue-700',
    'declined': 'bg-gray-200 text-gray-600'
  };

  return (
    <div 
      className="glass-card bg-white overflow-hidden cursor-pointer group card-hover"
      onClick={() => onClick?.(item)}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={item.imageUrl || 'https://picsum.photos/seed/item/400/300'} 
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3">
          <span className={`status-badge shadow-sm ${statusColors[item.status]}`}>
            {item.status}
          </span>
        </div>
        {item.status === 'claimed' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
            <div className="bg-green-500 text-white px-6 py-2 rounded-full font-display font-bold text-sm uppercase tracking-widest shadow-xl transform -rotate-12 border-2 border-white">
              Claimed
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">ID: #{item.id.slice(0, 6).toUpperCase()}</div>
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-xs text-slate-500">
            <MapPin size={14} className="mr-2 text-slate-400" />
            {item.location}
          </div>
          <div className="flex items-center text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-primary/20 mr-2"></div>
            {item.category}
          </div>
          {reporterName && (
            <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-1">
              Reported by: {reporterName}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">View Details</span>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
