import React from 'react';
import { FaCheckCircle, FaPlay, FaSpinner } from 'react-icons/fa';

interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  inProgress?: boolean;
}

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onStart?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onStart }) => {
  return (
    <div className={`p-4 mb-4 rounded-xl shadow-sm ${
      task.completed 
        ? 'bg-green-500/10 border border-green-500/30' 
        : task.inProgress 
          ? 'bg-yellow-500/10 border border-yellow-500/30'
          : 'bg-white/10 border border-white/30'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-400 mt-1">{task.description}</p>
          )}
        </div>
        
        <div>
          {task.completed ? (
            <div className="bg-green-500 text-white p-2 rounded-full">
              <FaCheckCircle />
            </div>
          ) : task.inProgress ? (
            <button 
              className="bg-yellow-500 text-white p-2 rounded-full"
              onClick={onComplete}
              disabled={!task.inProgress}
            >
              <FaSpinner className="animate-spin" />
            </button>
          ) : (
            <button 
              className="bg-primary text-white p-2 rounded-full"
              onClick={onStart}
            >
              <FaPlay />
            </button>
          )}
        </div>
      </div>
      
      {task.inProgress && !task.completed && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-yellow-500 h-2.5 rounded-full animate-pulse" style={{ width: '50%' }}></div>
          </div>
          <p className="text-xs text-center mt-1">جاري تنفيذ المهمة...</p>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
