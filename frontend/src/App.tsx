import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { bootDone, bootStep } from './app/boot';
import { router } from './routes';

export default function App() {
  useEffect(() => {
    bootStep('route');
    const id = requestAnimationFrame(() => bootDone());
    return () => cancelAnimationFrame(id);
  }, []);

  return <RouterProvider router={router} />;
}
