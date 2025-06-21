const CrossPlatformNotifications = {
  async init() {
    // Check if the device is mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Check if we can use service workers for PWA
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          return {
            supported: true,
            type: 'pwa',
            registration
          };
        } catch (error) {
          console.log('PWA notification setup failed:', error);
        }
      }
      
      // Fallback for mobile devices without notification support
      return {
        supported: true,
        type: 'fallback',
        // Could implement alternative notification methods here:
        // - In-app notifications
        // - Sound alerts
        // - Vibration API if available
        notify: (title: string, options: NotificationOptions) => { // Typed title and options
          // Use vibration API if available
          if ('vibrate' in navigator) {
            navigator.vibrate(200);
          }
          
          // Create an in-app notification
          const event = new CustomEvent('in-app-notification', {
            detail: { title, ...options }
          });
          window.dispatchEvent(event);
        }
      };
    }
    
    // Desktop browser notification handling
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return {
        supported: permission === 'granted',
        type: 'web',
        notify: (title: string, options: NotificationOptions | undefined) => new Notification(title, options)
      };
    }
    
    return { supported: false, type: 'none' as const }; // Use as const for 'none'
  },
  
  // Updated showNotification function
  async showNotification(
    log: { user_type: string | number; completed: number; correct: number; id?: string | number }, // Added id for tag, made completed/correct numbers
    userNames: { [key: string]: string; }, // Key should be string
    iconUrl?: string // Changed from icon to iconUrl for clarity and made optional
  ) {
    const notificationSystem = await this.init();
    
    if (!notificationSystem.supported) {
        // Attempt in-app as a last resort if even fallback isn't "supported" by init logic but might still work
        if (notificationSystem.type === 'none' || notificationSystem.type === 'fallback') {
             const userName = userNames[log.user_type] || 'User';
             const accuracy = log.completed > 0 ? ((log.correct / log.completed) * 100).toFixed(1) : "0.0";
             const title = `${userName} - QBank Update`;
             const body = `${userName} completed ${log.completed} questions with ${accuracy}% accuracy.`;
             window.dispatchEvent(new CustomEvent('in-app-notification', { detail: { title, body } }));
        }
        return;
    }
    
    const userName = userNames[log.user_type] || 'User';
    const accuracy = log.completed > 0 ? ((log.correct / log.completed) * 100).toFixed(1) : "0.0";

    const notificationData: NotificationOptions = {
      body: `${userName} completed ${log.completed} questions with ${accuracy}% accuracy.`,
      icon: iconUrl || '/assets/qbank.png', // Default icon path
      data: {
        url: window.location.pathname
      },
      tag: `qbank-activity-${log.id || new Date().getTime()}` // Use log.id if available for tagging
    };
    const title = `${userName} - QBank Update`;
    
    switch (notificationSystem.type) {
      case 'pwa':
        if (notificationSystem.registration) {
          await notificationSystem.registration.showNotification(
            title,
            notificationData
          );
        }
        break;
        
      case 'fallback': // This case in init already defines its own notify
        if ('notify' in notificationSystem && typeof notificationSystem.notify === 'function') {
            notificationSystem.notify(title, notificationData);
        }
        break;
        
      case 'web':
        if ('notify' in notificationSystem && typeof notificationSystem.notify === 'function') {
            notificationSystem.notify(title, notificationData);
        }
        break;
    }
  }
};

export default CrossPlatformNotifications;