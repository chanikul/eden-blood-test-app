import { CreditCard } from 'lucide-react';

export function CardIcon({ brand }: { brand: string }) {
  const brandLower = brand.toLowerCase();

  switch (brandLower) {
    case 'visa':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <path d="M21.5 12c0-5.25-4.25-9.5-9.5-9.5S2.5 6.75 2.5 12s4.25 9.5 9.5 9.5 9.5-4.25 9.5-9.5z" fill="#1A1F71"/>
          <path d="M10.4 14.6L8.7 9.4h1.4l1.1 3.4 1.1-3.4h1.4l-1.7 5.2h-1.6zm4.6 0V9.4h1.3v5.2H15zm-6.8 0L6.5 9.4h1.4l1.7 5.2H8.2z" fill="white"/>
        </svg>
      );
    case 'mastercard':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="12" r="7" fill="#EB001B"/>
          <circle cx="15" cy="12" r="7" fill="#F79E1B"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M12 17.3a7 7 0 0 0 0-10.6 7 7 0 0 0 0 10.6z" fill="#FF5F00"/>
        </svg>
      );
    case 'amex':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#006FCF"/>
          <path d="M12.7 10.7h1.6l.8-1.9.8 1.9h1.6l-1.3-3 1.3-3h-1.6l-.8 1.9-.8-1.9h-1.6l1.3 3-1.3 3zm-6.4 0h2l.4-.9h2.2l.4.9h2.1L11 4.7H9L6.3 10.7zm2-2.2l.7-1.7.7 1.7H8.3z" fill="white"/>
        </svg>
      );
    default:
      return <CreditCard className="h-6 w-6 text-gray-400" />;
  }
}
