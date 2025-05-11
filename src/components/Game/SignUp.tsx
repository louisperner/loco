import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const SignUp: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const { signUp, error, clearError } = useAuth();

  const handleSignUp = async (): Promise<void> => {
    clearError();
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setPasswordError(null);
    await signUp(email, password, name);
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium leading-6 text-white">
          Name
        </label>
        <div className="mt-2">
          <input
            id="name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            name="name"
            type="text"
            autoComplete="name"
            required
            className="block w-full rounded-md border-0 bg-gray-800 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#7d3296] sm:text-sm sm:leading-6 p-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium leading-6 text-white">
          Email address
        </label>
        <div className="mt-2">
          <input
            id="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-md border-0 bg-gray-800 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#7d3296] sm:text-sm sm:leading-6 p-2"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium leading-6 text-white">
            Password
          </label>
        </div>
        <div className="mt-2">
          <input
            id="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="block w-full rounded-md border-0 bg-gray-800 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#7d3296] sm:text-sm sm:leading-6 p-2"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="confirm-password" className="block text-sm font-medium leading-6 text-white">
            Confirm Password
          </label>
        </div>
        <div className="mt-2">
          <input
            id="confirm-password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            className="block w-full rounded-md border-0 bg-gray-800 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#7d3296] sm:text-sm sm:leading-6 p-2"
          />
        </div>
      </div>

      {(passwordError || error) && (
        <div className="text-red-500 text-sm">
          {passwordError || error}
        </div>
      )}

      <div>
        <button
          onClick={handleSignUp}
          type="submit"
          className="flex w-full justify-center rounded-md bg-[#7d3296] px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
        >
          Sign up
        </button>
      </div>
    </div>
  );
};

export default SignUp; 