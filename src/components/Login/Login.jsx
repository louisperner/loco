import React from 'react';
import { auth, googleProvider } from '../../utils/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
    }
  };
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };
  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className='bg-[#222222] flex flex-row'>
      <div className='w-screen md:w-1/2 flex min-h-full flex-col justify-center px-6 py-12 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-sm mb-20'>
          <img className='mx-auto h-28 w-auto' src='/loco-logo.png' alt='Your Company' />
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
                  onChange={(e) => setEmail(e.target.value)}
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  className='block w-full rounded-md border-0 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset  sm:text-sm sm:leading-6 p-2'
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
                  onChange={(e) => setPassword(e.target.value)}
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  required
                  className='block w-full rounded-md border-0 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset  sm:text-sm sm:leading-6 p-2'
                />
              </div>
            </div>

            <div>
              <button
                onClick={signIn}
                type='submit'
                className='flex w-full justify-center rounded-md bg-[#7d3296] px-3 py-1.5 text-md font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              >
                Sign in
              </button>
            </div>
          </div>

          <div className='flex mt-5 justify-between'>
            <p className='text-center text-sm text-gray-500'>Create a account</p>
            <div className='text-sm'>
              <a href='#' className='font-semibold text-[#7d3296] hover:text-indigo-500'>
                Forgot password?
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className='bg-black md:w-1/2 h-screen bg-[url("/loco-bg.jpg")] bg-cover invisible md:visible bg-center'></div>
    </div>
  );
}

export default Login;
