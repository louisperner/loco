import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const SignUp: React.FC = () => {
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
    await signUp(email, password);
  };

  return (
    <div className='bg-[#222222] flex flex-row'>
      <div className='w-screen md:w-1/2 flex min-h-full flex-col justify-center px-6 py-12 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-sm mb-20'>
          <img className='mx-auto h-28 w-auto' src='/loco-logo.png' alt='Loco' />
        </div>
        <div className='mt-10 sm:mx-auto sm:w-1/2 sm:max-w-sm'>
          <div className='space-y-6'>
            <div>
              <label htmlFor='email' className='block text-sm font-medium leading-6 text-white'>
                Email address
              </label>
              <div className='mt-2'>
                <input
                  id='email'
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  className='block w-full rounded-md border-0 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 p-2'
                />
              </div>
            </div>

            <div>
              <div className='flex items-center justify-between'>
                <label htmlFor='password' className='block text-sm font-medium leading-6 text-white'>
                  Password
                </label>
              </div>
              <div className='mt-2'>
                <input
                  id='password'
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  name='password'
                  type='password'
                  autoComplete='new-password'
                  required
                  className='block w-full rounded-md border-0 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 p-2'
                />
              </div>
            </div>

            <div>
              <div className='flex items-center justify-between'>
                <label htmlFor='confirm-password' className='block text-sm font-medium leading-6 text-white'>
                  Confirm Password
                </label>
              </div>
              <div className='mt-2'>
                <input
                  id='confirm-password'
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  name='confirm-password'
                  type='password'
                  autoComplete='new-password'
                  required
                  className='block w-full rounded-md border-0 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 p-2'
                />
              </div>
            </div>

            {(passwordError || error) && (
              <div className='text-red-500 text-sm'>
                {passwordError || error}
              </div>
            )}

            <div>
              <button
                onClick={handleSignUp}
                type='submit'
                className='flex w-full justify-center rounded-md bg-[#7d3296] px-3 py-1.5 text-md font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              >
                Sign up
              </button>
            </div>
          </div>

          <div className='flex mt-5 justify-between'>
            <p className='text-center text-sm text-gray-500'>Already have an account?</p>
            <div className='text-sm'>
              <a href='#' className='font-semibold text-[#7d3296] hover:text-indigo-500'>
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className='bg-black md:w-1/2 h-screen bg-[url("/loco-bg.jpg")] bg-cover invisible md:visible bg-center'></div>
    </div>
  );
};

export default SignUp; 