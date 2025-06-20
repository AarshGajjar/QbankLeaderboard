import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const examDate = new Date('2025-08-02T20:00:00');
      const now = new Date();
      const difference = examDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  interface TimeUnitProps {
    value: number;
    label: string;
  }

  interface FlipNumberProps {
    value: number;
  }

  const FlipNumber = ({ value }: FlipNumberProps) => {
    const [flip, setFlip] = useState(false);
    const [prevValue, setPrevValue] = useState(value);

    useEffect(() => {
      if (prevValue !== value) {
        setFlip(true);
        const timer = setTimeout(() => {
          setFlip(false);
          setPrevValue(value);
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [value, prevValue]);

    return (
      <div className="relative h-8 w-8">
        <div
          className={`absolute w-full h-full flex items-center justify-center transition-all duration-300 ${
            flip ? 'animate-flip-down' : ''
          }`}
        >
          <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {value.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    );
  };

  const TimeUnit = ({ value, label }: TimeUnitProps) => (
    <div className="flex flex-col items-center bg-gradient-to-br from-purple-100 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-lg p-2 shadow-sm">
      <FlipNumber value={value} />
      <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  );

  const DesktopTimer = () => (
    <div className="rounded-xl p-4 bg-gradient-to-r from-purple-50/80 via-slate-50/80 to-blue-50/80 dark:from-slate-800/80 dark:via-slate-900/80 dark:to-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 shadow-lg">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <Timer className="text-purple-600" size={20} />
          <span className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            INICET Countdown
          </span>
        </div>
        <div className="flex gap-3">
          {[
            { value: timeLeft.days, label: 'Days' },
            { value: timeLeft.hours, label: 'Hours' },
            { value: timeLeft.minutes, label: 'Minutes' },
            { value: timeLeft.seconds, label: 'Seconds' }
          ].map((unit) => (
            <TimeUnit key={unit.label} {...unit} />
          ))}
        </div>
      </div>
    </div>
  );

  const MobileTimer = () => (
    <div className="rounded-xl p-3 bg-gradient-to-r from-purple-50/80 via-slate-50/80 to-blue-50/80 dark:from-slate-800/80 dark:via-slate-900/80 dark:to-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 shadow-lg">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          <Timer className="text-purple-600" size={16} />
          <span className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            INICET Countdown
          </span>
        </div>
        <div className="flex gap-2">
          {[
            { value: timeLeft.days, label: 'D' },
            { value: timeLeft.hours, label: 'H' },
            { value: timeLeft.minutes, label: 'M' },
            { value: timeLeft.seconds, label: 'S' }
          ].map((unit) => (
            <TimeUnit key={unit.label} {...unit} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden sm:block">
        <DesktopTimer />
      </div>
      <div className="sm:hidden">
        <MobileTimer />
      </div>
    </>
  );
};

export default CountdownTimer;