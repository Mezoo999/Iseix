import React from 'react';

interface TaskProgressBarProps {
  completedTasks: number;
  totalTasks: number;
}

const TaskProgressBar: React.FC<TaskProgressBarProps> = ({ completedTasks, totalTasks }) => {
  const percentage = (completedTasks / totalTasks) * 100;
  
  return (
    <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="absolute top-0 right-0 h-full bg-gradient-to-l from-primary to-primary-dark"
        style={{ width: `${percentage}%` }}
      />
      <div className="absolute top-0 right-0 w-full h-full flex items-center justify-center">
        <span className="text-xs font-medium text-white">
          {completedTasks}/{totalTasks} مهام مكتملة
        </span>
      </div>
    </div>
  );
};

export default TaskProgressBar;
