import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Notification {
  title: string;
  body: string;
}

const InAppNotification = () => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleNotification = (event: CustomEvent<Notification>) => {
      setNotification(event.detail);
      setIsVisible(true);
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    window.addEventListener('in-app-notification', handleNotification as EventListener);
    return () => {
      window.removeEventListener('in-app-notification', handleNotification as EventListener);
    };
  }, []);

  if (!isVisible || !notification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{notification.title}</AlertTitle>
        <AlertDescription>{notification.body}</AlertDescription>
      </Alert>
    </div>
  );
};

export default InAppNotification;