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
        notify: (title: any, options: any) => {
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
    
    return { supported: false };
  },
  
  // Updated showNotification function
  async showNotification(log: { user_type: string | number; completed: any; correct: any; }, userNames: { [x: string]: any; }, icon: any) {
    const notificationSystem = await this.init();
    
    if (!notificationSystem.supported) return;
    
    const notificationData = {
      title: 'QBank Activity',
      body: `${userNames[log.user_type]} completed ${log.completed} questions with ${log.correct} correct`,
      icon,
      tag: 'qbank-activity'
    };
    
    switch (notificationSystem.type) {
      case 'pwa':
        if (notificationSystem.registration) {
          await notificationSystem.registration.showNotification(
            notificationData.title,
            notificationData
          );
        }
        break;
        
      case 'fallback':
        if (notificationSystem.notify) {
          notificationSystem.notify(notificationData.title, notificationData);
        }
        break;
        
      case 'web':
        if (notificationSystem.notify) {
          notificationSystem.notify(notificationData.title, notificationData);
        }
        break;
    }
  }
};

export default CrossPlatformNotifications;