import React from 'react';
import { FaClock, FaCheckCircle } from 'react-icons/fa';
import { BsCircle } from 'react-icons/bs';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

interface TaskNotificationsProps {
  tasks: Task[];
  timeRemaining: number; // بالمللي ثانية
}

const TaskNotifications: React.FC<TaskNotificationsProps> = ({ tasks, timeRemaining }) => {
  // تحويل الوقت المتبقي إلى ساعات ودقائق
  const hours = Math.floor(timeRemaining / 3600000);
  const minutes = Math.floor((timeRemaining % 3600000) / 60000);
  
  return (
    <div className="bg-white/10 p-4 rounded-xl shadow-sm">
      <div className="flex items-center mb-2">
        <FaClock className="text-primary ml-2" />
        <h3 className="font-bold">الوقت المتبقي: {hours} ساعة و {minutes} دقيقة</h3>
      </div>
      
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center">
            {task.completed ? (
              <FaCheckCircle className="text-green-500 ml-2" />
            ) : (
              <BsCircle className="text-yellow-500 ml-2" />
            )}
            <span className={task.completed ? "line-through text-gray-400" : ""}>
              {task.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskNotifications;
