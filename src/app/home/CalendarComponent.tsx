"use client"
import React from 'react';
import { Calendar, Clock } from 'lucide-react';

// Define TypeScript interfaces
interface WorkoutHistoryItem {
  id: number;
  date: string;
  workout: string;
  duration: string;
  completed: boolean;
}

interface CalendarComponentProps {
  showChatbot: boolean;
  workoutHistory: WorkoutHistoryItem[];
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({ showChatbot, workoutHistory = [] }) => {
  // Generate days of the current month for the calendar view
  const getDaysInMonth = (year: number, month: number): Date[] => {
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const calendarDays = getDaysInMonth(currentYear, currentMonth);
  
  // Function to format date for display
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Function to get workout for a specific date
  const getWorkoutForDate = (dateString: string): WorkoutHistoryItem | undefined => {
    return workoutHistory.find(record => record.date === dateString);
  };
  
  // Get month name for display
  const monthNames: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = monthNames[currentMonth];
  
  return (
    <div className={`backdrop-blur-lg bg-white/5 rounded-xl ${showChatbot ? 'p-4' : 'p-6'} border border-white/10 mb-8`}>
      <h2 className={`${showChatbot ? 'text-lg' : 'text-xl'} font-light mb-4 flex items-center text-white/90`}>
        <Calendar className="mr-3 text-white/50" size={20} />
        Your Workout Progress
      </h2>
      
      <div className={`${showChatbot ? 'mb-6' : 'mb-10'}`}>
        <h3 className={`${showChatbot ? 'text-sm' : 'text-base'} font-light mb-4 text-white/70`}>{currentMonthName} {currentYear}</h3>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-white/50 mb-2">
              {day}
            </div>
          ))}
          
          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12 rounded-lg"></div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dateString = day.toISOString().split('T')[0];
            const workout = getWorkoutForDate(dateString);
            const isToday = day.getDate() === currentDate.getDate();
            
            return (
              <div 
                key={dateString}
                className={`h-12 rounded-lg ${isToday ? 'border border-white/20 bg-white/10 backdrop-blur-sm' : workout ? 'bg-white/5' : ''} p-1 relative transition-all duration-200 hover:bg-white/10`}
              >
                <div className={`text-xs text-right ${isToday ? 'text-white/90 font-medium' : 'text-white/60'}`}>
                  {day.getDate()}
                </div>
                {workout && (
                  <div 
                    className={`text-xs truncate px-1.5 py-0.5 rounded-full mt-1 text-center ${
                      workout.completed 
                        ? 'bg-green-500/20 text-green-400/90' 
                        : 'bg-amber-500/20 text-amber-400/90'
                    }`}
                    title={`${workout.workout} - ${workout.duration}`}
                  >
                    •
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Recent Workout History */}
      <div>
        <h3 className={`${showChatbot ? 'text-sm' : 'text-base'} font-light mb-4 text-white/70`}>Recent Workouts</h3>
        {workoutHistory && workoutHistory.length > 0 ? (
          <div className={`grid grid-cols-1 ${showChatbot ? '' : 'md:grid-cols-2'} gap-3`}>
            {workoutHistory.map((record) => (
              <div key={record.id} className="flex items-center p-3 bg-white/5 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
                <div className="w-10 h-10 flex flex-col items-center justify-center bg-white/5 rounded-lg mr-3">
                  <div className="text-sm font-medium text-white/80">{formatDate(record.date).split(' ')[1]}</div>
                  <div className="text-xs text-white/50">{formatDate(record.date).split(' ')[0]}</div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-white/90">{record.workout}</div>
                  <div className="text-xs text-white/50 flex items-center">
                    <Clock size={12} className="mr-1" />
                    {record.duration}
                  </div>
                </div>
                <div className={`px-2.5 py-1 text-xs font-light rounded-full ${
                  record.completed 
                    ? 'bg-green-500/10 text-green-400/90 border border-green-500/20' 
                    : 'bg-amber-500/10 text-amber-400/90 border border-amber-500/20'
                }`}>
                  {record.completed ? 'Complete' : 'Partial'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 bg-white/5 rounded-lg text-white/60 text-sm">
            No workout history yet. Complete a workout to see it here!
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarComponent;