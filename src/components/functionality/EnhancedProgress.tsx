import React, { useMemo, useState } from 'react';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
import { Crown, Rocket } from 'lucide-react';

interface DualUserProgressProps {
  user1: {
    previous?: number;
    name: string;
    current: number;
    color: string;
  };
  user2: {
    previous?: number;
    name: string;
    current: number;
    color: string;
  };
  target: number;
}

const DualUserProgress: React.FC<DualUserProgressProps> = ({ user1: rawUser1, user2: rawUser2, target }) => {
  // Override the colors to ensure correct assignment
  const user1 = { ...rawUser1, color: '#9333ea' }; // Purple
  const user2 = { ...rawUser2, color: '#3b82f6' }; // Blue

  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

  // Calculate maxProgress considering target and both users' current values
  const maxProgress = Math.max(user1.current, user2.current, target);

  const getProgressStats = (current: number) => {
    const rawPercentage = (current / target) * 100;
    const isTargetReached = current >= target;
    const questionsLeft = Math.max(target - current, 0);
    const visualPosition = (current / maxProgress) * 100; // Use maxProgress for positioning
    return { 
      rawPercentage, 
      visualPosition, 
      isTargetReached, 
      questionsLeft,
      extraProgress: isTargetReached ? current - target : 0
    };
  };

  const user1Stats = getProgressStats(user1.current);
  const user2Stats = getProgressStats(user2.current);

  const getMotivationalMessage = () => {
    // Helper functions for cleaner code
    const calculateProgress = (current: number, target: number) => (current / target) * 100;
    const formatPercentage = (value: number) => Math.round(value);
    
    // Calculate progress stats
    const user1Progress = calculateProgress(user1.current, target);
    const user2Progress = calculateProgress(user2.current, target);
    const differencePercentage = Math.abs(user1Progress - user2Progress);
    const isUser1Leading = user1Progress > user2Progress;
    const leader = isUser1Leading ? user1 : user2;
    const follower = isUser1Leading ? user2 : user1;
    const leaderStats = isUser1Leading ? user1Stats : user2Stats;
    const followerStats = isUser1Leading ? user2Stats : user1Stats;
    
    // Track momentum and progress patterns
    const hasLeaderMomentum = leader.previous !== undefined && leader.current > leader.previous;
    const hasFollowerMomentum = follower.previous !== undefined && follower.current > follower.previous;
    const isLeaderSlowing = leader.previous !== undefined && leader.current < leader.previous;
    const bothProgressing = hasLeaderMomentum && hasFollowerMomentum;
    
    // Target achievement scenarios
    if (user1Stats.isTargetReached && user2Stats.isTargetReached) {
      // Look at raw percentages to determine if it was a close finish
      const percentageDiff = Math.abs(user1Stats.rawPercentage - user2Stats.rawPercentage);
      const closeFinish = percentageDiff < 5; // Within 5% of each other
      
      if (closeFinish) {
        return `Phenomenal effort! ${user1.name} and ${user2.name} both crushed the target in an incredibly close race! 🏆 Simply outstanding! ⭐`;
      }
      return `Champions, both of you! ${user1.name} and ${user2.name} have conquered the challenge! 🎉 Time to set new heights! 🚀`;
    }
  
    if (user1Stats.isTargetReached || user2Stats.isTargetReached) {
      const achiever = user1Stats.isTargetReached ? user1.name : user2.name;
      const chaser = user1Stats.isTargetReached ? user2.name : user1.name;
      const chaserStats = user1Stats.isTargetReached ? user2Stats : user1Stats;
      
      // Use questionsLeft to provide more specific encouragement
      if (chaserStats.questionsLeft <= 3) {
        return `${achiever} has crossed the finish line! ${chaser}, you're just ${chaserStats.questionsLeft} questions away from glory! 💪 Final sprint! ⚡`;
      }
      
      if (chaserStats.rawPercentage > 90) {
        return `${achiever} has made it! ${chaser} is so close - just that final push needed! 💪 Victory awaits! ⚡`;
      }
      return `${achiever} has reached the summit! ${chaser}, you're on your way - keep that fire burning! 🔥 The view is worth it! 🏔️`;
    }
  
    // Starting phase scenarios
    if (user1.current === 0 && user2.current === 0) {
      return `The stage is set for an epic challenge! ${user1.name} and ${user2.name}, your journey to greatness begins now! 🎬 Ready, set, go! 🚀`;
    }
  
    if (user1.current === 0 || user2.current === 0) {
      const starter = user1.current > 0 ? user1.name : user2.name;
      const waiting = user1.current === 0 ? user1.name : user2.name;
      const starterProgress = formatPercentage(Math.max(user1Progress, user2Progress));
      
      if (starterProgress < 5) {
        return `${starter} has taken the first brave step! ${waiting}, the perfect time to join is now! 🎯 Let the challenge begin! 💫`;
      }
      return `${starter} is ${starterProgress}% of the way there! ${waiting}, jump in - the competition is heating up! 🔥 Your time to shine! ⭐`;
    }
  
    // Progress patterns and momentum scenarios
    if (bothProgressing) {
      if (differencePercentage < 2) {
        return `Incredible pace from both! ${leader.name} and ${follower.name} are pushing each other to new heights! 🏃‍♂️ Pure determination! ⚡`;
      }
      return `What a spectacle! Both ${leader.name} and ${follower.name} are on fire! 🔥 Keep this amazing momentum going! 🚀`;
    }
  
    if (hasFollowerMomentum && isLeaderSlowing) {
      const gap = formatPercentage(differencePercentage);
      return `The tide is turning! ${follower.name} is gaining ground, just ${gap}% behind ${leader.name}! 🌊 Momentum shift! 🔄`;
    }
  
    // Competition closeness scenarios
    if (user1Progress === user2Progress) {
      const progress = formatPercentage(user1Progress);
      if (progress > 75) {
        return `Dead heat at ${progress}%! ${user1.name} and ${user2.name} are sprinting to the finish! 🏁 Who wants it more? 💥`;
      }
      return `Perfectly matched at ${progress}%! ${user1.name} and ${user2.name}, this is anyone's game! ⚖️ Break the tie! 🎯`;
    }
  
    if (differencePercentage < 5) {
      return `Only ${formatPercentage(differencePercentage)}% separates ${leader.name} and ${follower.name}! 📊 Every effort counts! ⚡`;
    }
  
    // Progress milestone scenarios with questions left context
    const leaderProgress = formatPercentage(Math.max(user1Progress, user2Progress));
    const followerProgress = formatPercentage(Math.min(user1Progress, user2Progress));
  
    if (leaderProgress >= 90) {
      return `${leader.name} is in the final stretch with ${leaderStats.questionsLeft} questions to go! ${follower.name} at ${followerProgress}% - time for an epic finish! 🏁`;
    }
  
    if (leaderProgress >= 75) {
      return `${leader.name} is crushing it at ${leaderProgress}%! ${follower.name}, channel your inner champion - ${followerStats.questionsLeft} questions to greatness! 🦁`;
    }
  
    if (leaderProgress >= 50) {
      const extraProgress = leaderStats.extraProgress > 0 ? ` (+${leaderStats.extraProgress}% bonus)` : '';
      return `Halfway hero ${leader.name} at ${leaderProgress}%${extraProgress}! ${follower.name} pushing at ${followerProgress}% - the race is far from over! 🎯`;
    }
  
    if (differencePercentage >= 30) {
      return `${leader.name} has built a strong lead of ${formatPercentage(differencePercentage)}%! ${follower.name}, every champion has faced adversity! 💪 Rise up! 🚀`;
    }
  
    // Generic progress messages with extra progress context
    const leaderExtra = leaderStats.extraProgress > 0 ? ` (+${leaderStats.extraProgress}% bonus)` : '';
    const followerExtra = followerStats.extraProgress > 0 ? ` (+${followerStats.extraProgress}% bonus)` : '';
    
    return `${leader.name} leads at ${leaderProgress}%${leaderExtra}, with ${follower.name} at ${followerProgress}%${followerExtra}! Every step forward is a victory! 🌟 Keep pushing! 💫`;
  };
  
  const MovingBackground = () => {
    const now = new Date();
    const hours = now.getHours();
    const isDaytime = hours >= 7 && hours < 19; // 7 AM to 7 PM
  
    // Calculate sun/moon position based on time
    const sunMoonPosition = () => {
      // Determine start and end hours for the current cycle (day or night)
      const startHour = isDaytime ? 7 : 19;
      const endHour = isDaytime ? 19 : 7;
      const totalHours = ((endHour - startHour + 24) % 24) || 12; // Ensure a 12-hour cycle if needed
      const currentHour = (hours - startHour + 24) % 24;
      const progress = currentHour / totalHours;
  
      // Horizontal position moves linearly from 0% to 100%
      const x = progress * 100;
  
      // Vertical position follows an arc:
      // At progress = 0 or 1, y = 50% (sun/moon near the horizon)
      // At progress = 0.5, y = 5% (sun/moon at its highest point)
      const y = 27.5 - 22.5 * Math.cos(2 * Math.PI * (progress - 0.5));
  
      return { x, y };
    };
  
    const { x, y } = sunMoonPosition();
  
    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Day/Night Sky Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-sky-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300" />
  
        {/* Sun/Moon */}
        <div
          className="absolute transition-opacity duration-300"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Sun - visible in light mode */}
          <div
            className="w-16 h-16 rounded-full bg-yellow-300 block dark:hidden shadow-[0_0_50px_rgba(250,204,21,0.4)] animate-pulse-slow"
          />
  
          {/* Moon - visible in dark mode */}
          <div
            className="w-12 h-12 rounded-full bg-slate-200 hidden dark:block shadow-[0_0_30px_rgba(226,232,240,0.3)]"
          />
        </div>
  
        {/* Clouds - Light Mode */}
        <div className="absolute inset-0 dark:hidden">
          <div className="absolute w-full h-40 animate-move-clouds-1">
            <div className="absolute top-10 left-[10%] w-24 h-10 bg-white rounded-full opacity-80" />
            <div className="absolute top-5 left-[20%] w-32 h-12 bg-white rounded-full opacity-90" />
            <div className="absolute top-15 left-[45%] w-28 h-10 bg-white rounded-full opacity-85" />
            <div className="absolute top-8 left-[70%] w-36 h-12 bg-white rounded-full opacity-90" />
          </div>
          <div className="absolute w-full h-40 animate-move-clouds-2">
            <div className="absolute top-20 left-[5%] w-28 h-10 bg-white rounded-full opacity-75" />
            <div className="absolute top-25 left-[30%] w-32 h-12 bg-white rounded-full opacity-85" />
            <div className="absolute top-15 left-[60%] w-24 h-10 bg-white rounded-full opacity-80" />
            <div className="absolute top-28 left-[85%] w-36 h-12 bg-white rounded-full opacity-85" />
          </div>
        </div>
  
        {/* Stars - Dark Mode */}
        <div className="absolute inset-0 hidden dark:block">
          <div className="absolute w-full h-full animate-move-stars-1">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={`star1-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                style={{
                  top: `${Math.random() * 60}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.8 + 0.2,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
          <div className="absolute w-full h-full animate-move-stars-2">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={`star2-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                style={{
                  top: `${Math.random() * 60}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.8 + 0.2,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        </div>
  
        {/* Rolling Hills - Both Modes */}
        <div className="absolute bottom-0 w-[200%] h-48">
          {/* First Set of Hills */}
          <div className="absolute bottom-0 w-full h-full animate-move-hills-1">
            <div
              className="absolute bottom-0 w-full h-32 bg-gradient-to-b from-green-300 to-green-400 dark:from-cyan-600 dark:to-purple-800"
              style={{
                borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                transform: 'scaleX(2) translateX(35%)',
              }}
            />
            <div
              className="absolute bottom-0 w-full h-24 bg-gradient-to-b from-green-400 to-green-500 dark:from-cyan-600 dark:to-slate-700"
              style={{
                borderRadius: '40% 60% 0 0 / 100% 100% 0 0',
                transform: 'scaleX(2) translateX(15%)',
              }}
            />
          </div>
  
          {/* Second Set of Hills (for seamless loop) */}
          <div className="absolute bottom-0 w-full h-full translate-x-full animate-move-hills-2">
            <div
              className="absolute bottom-0 w-full h-32 bg-gradient-to-b from-green-300 to-green-400 dark:from-cyan-800 dark:to-purple-800"
              style={{
                borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                transform: 'scaleX(2) translateX(-25%)',
              }}
            />
            <div
              className="absolute bottom-0 w-full h-24 bg-gradient-to-b from-green-400 to-green-500 dark:from-cyan-600 dark:to-slate-900"
              style={{
                borderRadius: '40% 60% 0 0 / 100% 100% 0 0',
                transform: 'scaleX(2) translateX(-15%)',
              }}
            />
          </div>
        </div>
  
        <style>
          {`
            @keyframes move-clouds-1 {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-100%); }
            }
  
            @keyframes move-clouds-2 {
              0% { transform: translateX(100%); }
              100% { transform: translateX(0%); }
            }
  
            @keyframes move-stars-1 {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-100%); }
            }
  
            @keyframes move-stars-2 {
              0% { transform: translateX(100%); }
              100% { transform: translateX(0%); }
            }
  
            @keyframes move-hills-1 {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
  
            @keyframes move-hills-2 {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-bounce-subtle {
            animation: bounce-subtle 3s infinite;
          }
  
          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }
  
          .animate-move-clouds-1 {
            animation: move-clouds-1 30s linear infinite;
          }
  
          .animate-move-clouds-2 {
            animation: move-clouds-2 30s linear infinite;
          }
  
          .animate-move-stars-1 {
            animation: move-stars-1 30s linear infinite;
          }
  
          .animate-move-stars-2 {
            animation: move-stars-2 30s linear infinite;
          }
  
          .animate-move-hills-1 {
            animation: move-hills-1 30s linear infinite;
          }
  
          .animate-move-hills-2 {
            animation: move-hills-2 30s linear infinite;
          }
  
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
  
          .animate-twinkle {
            animation: twinkle 3s ease-in-out infinite;
          }
          `}
        </style>
      </div>
    );
  };
  

  interface UserIndicatorProps {
    name: string;
    current: number;
    color: string;
    position: number;
    isTargetReached: boolean;
    questionsLeft: number;
    extraProgress: number;
    isLeading: boolean;
    isFirstUser: boolean;
  }

  const UserIndicator = ({ 
    name, 
    current, 
    color, 
    position, 
    isTargetReached, 
    questionsLeft,
    extraProgress,
    isLeading,
    isFirstUser
  }: UserIndicatorProps) => {
    const displayPosition = Math.min(Math.max(position, 0), 100);
    
    const baseClassName = "absolute flex flex-col items-center transition-transform duration-300 ease-in-out";
    const hoverClassName = hoveredUser === name ? "z-30 scale-110" : 
                          hoveredUser === null && isLeading ? "z-20" : "z-10";
    
    return (
      <div 
        className={`${baseClassName} ${hoverClassName}`}
        style={{ 
          left: `${displayPosition}%`, 
          top: '-4rem',
          transform: 'translateX(-50%)',
          animation: `bounce-subtle 3s infinite ${isFirstUser ? '0s' : '1.5s'}`
        }}
        onMouseEnter={() => setHoveredUser(name)}
        onMouseLeave={() => setHoveredUser(null)}
      >
        <div className="relative will-change-transform">
          <div className="w-20 h-20 rounded-full bg-card shadow-lg flex flex-col items-center justify-center p-2 border border-border transition-all duration-300 ease-in-out hover:shadow-xl hover:border-border/80 -translate-y-4 hover:scale-105">
            <div className="w-full flex justify-center items-center gap-1">
              <p className="font-semibold text-xs whitespace-nowrap text-foreground">{name}</p>
              {isLeading && (
                <Crown 
                  className="w-3 h-3 text-yellow-500"
                  style={{
                    filter: 'drop-shadow(0 0 2px rgba(234, 179, 8, 0.5))',
                  }}
                />
              )}
            </div>
            <p className="text-sm font-bold" style={{ color }}>{Math.round((current / target) * 100)}%</p>
            <p className="text-[10px] text-muted-foreground">{current}/{target}</p>
            {!isTargetReached ? (
              <p className="text-[10px] text-red-400">{questionsLeft} left</p>
            ) : (
              <p className="text-[10px] text-green-400">+{extraProgress}</p>
            )}
          </div>
          <div 
            className="absolute left-1/2 -translate-x-1/2 -translate-y-6 w-3 h-3 rotate-45 bg-card border-b border-r border-border"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="w-full shadow-lg rounded-lg overflow-hidden bg-gradient-to-br from-white/80 via-white/90 to-white/80 dark:from-slate-900/80 dark:via-slate-900/90 dark:to-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-800/20 relative">
        <MovingBackground />
        <CardHeader className="border-b p-4 relative z-10 bg-gradient-to-r from-purple-600/15 to-blue-600/15 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold relative z-20">
            <Rocket className="w-5 h-5 text-amber-500" /> 
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
              Today's Sprint
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4 px-6 relative">
          <p className="text-m text-center mb-2 pb-5 text-foreground font-semibold 
            bg-gradient-to-r from-slate-50/80 via-slate-100/80 to-slate-50/80 
            dark:from-slate-800/80 dark:via-slate-900/80 dark:to-slate-800/80 
            backdrop-blur-sm py-3 px-6 rounded-lg 
            shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] 
            dark:shadow-[0_4px_14px_0_rgba(255,255,255,0.1)]
            transform transition-all duration-300 hover:scale-[1.02] 
            border border-slate-200/50 dark:border-slate-700/50">
            {getMotivationalMessage()}
          </p>
          <div className="relative mt-16 mx-[6%]">
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden shadow-inner dark:bg-slate-800">
              {[user1Stats, user2Stats].map((stats, index) => {
                const user = index === 0 ? user1 : user2;
                const gradientColors = user === user1
                  ? 'from-purple-400 to-purple-600 dark:from-purple-400 dark:to-purple-600'
                  : 'from-blue-400 to-blue-600 dark:from-blue-400 dark:to-blue-600';
                
                const relativeWidth = (user.current / maxProgress) * 100;
                const isLeading = user.current >= (index === 0 ? user2.current : user1.current);
                
                return (
                  <div key={user.name} 
                    className={`absolute h-full transition-all duration-1000 ease-in-out bg-gradient-to-r ${gradientColors} ${
                      hoveredUser === user.name ? 'z-20' : 
                      hoveredUser === null && isLeading ? 'z-10' : 'z-0'
                    }`}
                    style={{ width: `${relativeWidth}%` }}
                  >
                    <div 
                      className="absolute right-0 top-1/2 w-4 h-4 rounded-full will-change-transform"
                      style={{
                        background: user === user1
                          ? 'radial-gradient(circle at center, #a855f7, #9333ea)'
                          : 'radial-gradient(circle at center, #60a5fa, #3b82f6)',
                        transform: 'translate(50%, -50%)',
                        boxShadow: user === user1
                          ? '0 0 10px rgba(168, 85, 247, 0.5)' 
                          : '0 0 10px rgba(96, 165, 250, 0.5)',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <UserIndicator 
              {...user1}
              position={user1Stats.visualPosition}
              isTargetReached={user1Stats.isTargetReached}
              questionsLeft={user1Stats.questionsLeft}
              extraProgress={user1Stats.extraProgress}
              isLeading={user1.current > user2.current}
              isFirstUser={true}
            />
            <UserIndicator 
              {...user2}
              position={user2Stats.visualPosition}
              isTargetReached={user2Stats.isTargetReached}
              questionsLeft={user2Stats.questionsLeft}
              extraProgress={user2Stats.extraProgress}
              isLeading={user2.current > user1.current}
              isFirstUser={false}
            />
          </div>
          <div className="mt-4 text-center text-sm text-white-200">
            {(() => {
              if (user1.current === user2.current) {
                return null;
              }
              const leaderInfo = user1.current > user2.current 
                ? { name: user1.name, color: user1.color, questions: user1.current }
                : { name: user2.name, color: user2.color, questions: user2.current };
              return (
                <>
                  <span className="font-medium" style={{ color: leaderInfo.color }}>
                    {leaderInfo.name}
                  </span>
                  <span> is leading with {Math.abs(user1.current - user2.current)} questions today!</span>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default DualUserProgress;