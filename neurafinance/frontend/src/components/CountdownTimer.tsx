'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// AI Engine mechanism: Rewards are distributed every 12 hours
const REWARD_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      
      // Calculate next 12-hour boundary (00:00, 12:00)
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      const currentSecond = new Date().getSeconds();
      
      // Determine if we're counting to 12:00 or 00:00
      let targetHour = currentHour < 12 ? 12 : 24;
      
      // Calculate remaining time
      const hoursRemaining = targetHour - currentHour - 1;
      const minutesRemaining = 59 - currentMinute;
      const secondsRemaining = 59 - currentSecond;
      
      return {
        hours: Math.max(0, hoursRemaining),
        minutes: Math.max(0, minutesRemaining),
        seconds: Math.max(0, secondsRemaining)
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-2 text-aip-green">
      <Clock className="w-4 h-4" />
      <span className="text-sm font-mono">
        Next Release: {formatNumber(timeLeft.hours)} HRS : {formatNumber(timeLeft.minutes)} MIN : {formatNumber(timeLeft.seconds)} SEC
      </span>
    </div>
  );
}
