
import React, { useEffect } from 'react'
import { useProblemStore } from '../store/useProblemStore'
import { Loader } from 'lucide-react'
import ProblemTable from '../components/ProblemTable'

const HomePage: React.FC = () => {

  const { getAllProblems, problems, isProblemsLoading } = useProblemStore()

  useEffect(() => {
    getAllProblems()
  }, [getAllProblems])

  if(isProblemsLoading) {
    return (
      <div className='min-h-screen flex justify-center items-center'>
        <Loader className='animate-spin text-primary size-10' />
      </div>
    )
  }
  return (
    <div className='min-h-screen flex flex-col items-center mt-14 px-4'>
      <div className='absolute top-16 left-0 w-1/3 h-1/3 bg-primary opacity-30 blur-3xl rounded-md bottom-9'>
      </div>
      <h1 className='text-4xl fonrt-extrabold z-10 text-center'>
        Welcome to <span className='text-primary'>codeyudh</span>
      </h1>

      <p className='mt-4 text-center text-lg font-semibold text-grey-500 dart:text-grey-400 z-10'>
        A Platform where coders can engage in "yudh" (war) - battling with code and challenging others.
      </p>

      {
        problems?.length > 0 ? <ProblemTable problems={problems} /> : (
          <p className='mt-10 text-center text-lg font-semibold text-gray-500 dark:text-gray-400 z-10 border border-primary px-4 py-2 rounded-md border-dashed'>
            No problems found
          </p>
        )
      }
    </div>
  )
}

export default HomePage