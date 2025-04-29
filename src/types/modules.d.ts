// Declaración de tipos para módulos que faltan
declare module 'react' {
  function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  function useRef<T>(initialValue: T): { current: T };
}

declare module 'react-dom';
declare module 'next/navigation';
declare module 'framer-motion';
declare module 'react-icons/fa';

declare module 'firebase/firestore' {
  class Timestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
    toMillis(): number;
    static now(): Timestamp;
    static fromDate(date: Date): Timestamp;
    static fromMillis(milliseconds: number): Timestamp;
  }
}
