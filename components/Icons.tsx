
import React from 'react';
import { 
  Activity, Book, Droplet, Dumbbell, Code, Coffee, Moon, Sun, 
  Music, Zap, Smile, Briefcase, DollarSign, Heart, HelpCircle,
  Check, Star, Flame, Trophy, Target, Flag, Bell,
  Utensils, Apple, Brain, Bike, Footprints, Timer, Watch, Mountain, Navigation, Map,
  PenTool, FileText, Folder, Archive, Layers, Monitor,
  CreditCard, Wallet, PiggyBank, TrendingUp, BarChart,
  Headphones, Camera, Image, Video, Gamepad, ShoppingBag, Gift, Plane, Home, Anchor, Key,
  Users, User, MessageCircle, Phone, Mail, Share2,
  // New Icons
  BedDouble, Sunrise, Sunset, GlassWater, Leaf, Flower, TreeDeciduous, Tent,
  Gamepad2, Calculator, Palette, Brush, Scissors, Smartphone, Laptop,
  Bike as Bicycle, Car, Bus, Train, Rocket,
  Bath, Shirt, Watch as Clock, Calendar, Hash, Percent,
  Cloud, Umbrella, Wind, Thermometer
} from 'lucide-react';

export const IconMap: Record<string, React.FC<{ size?: number, className?: string }>> = {
  Activity, Book, Droplet, Dumbbell, Code, Coffee, Moon, Sun, 
  Music, Zap, Smile, Briefcase, DollarSign, Heart,
  Check, Star, Flame, Trophy, Target, Flag, Bell,
  Utensils, Apple, Brain, Bike, Footprints, Timer, Watch, Mountain, Navigation, Map,
  PenTool, FileText, Folder, Archive, Layers, Monitor,
  CreditCard, Wallet, PiggyBank, TrendingUp, BarChart,
  Headphones, Camera, Image, Video, Gamepad, ShoppingBag, Gift, Plane, Home, Anchor, Key,
  Users, User, MessageCircle, Phone, Mail, Share2,
  // New Mappings
  BedDouble, Sunrise, Sunset, GlassWater, Leaf, Flower, TreeDeciduous, Tent,
  Gamepad2, Calculator, Palette, Brush, Scissors, Smartphone, Laptop,
  Bicycle, Car, Bus, Train, Rocket,
  Bath, Shirt, Clock, Calendar, Hash, Percent,
  Cloud, Umbrella, Wind, Thermometer
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 20, className }) => {
  if (!name || name === 'help' || name === 'none') return null;

  // Check if it's an emoji or symbol
  const isEmoji = !IconMap[name] && /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(name);
  
  if (isEmoji) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
        {name}
      </span>
    );
  }

  const IconComponent = IconMap[name];
  if (!IconComponent) {
    // If it's a short string (e.g. emoji or short text), render text directly
    if (name.length <= 4) {
      return (
        <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
          {name}
        </span>
      );
    }
    return null;
  }

  return <IconComponent size={size} className={className} />;
};

export default Icon;
