
import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Code2, Lightbulb, Minus, FileCode, Info, CheckCircle, Bug, RefreshCw, AlertTriangle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { axiosInstance } from '../utils/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { createProblemSchema } from '../inputValidations/createProblemValidation';
import type { CreateProblemFormData } from '../inputValidations/createProblemValidation';

const CreateProblemForm: React.FC = () => {
  const [sampleType, setSampleType] = useState<'DP' | 'string'>('DP');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProblemFormData>({
    resolver: zodResolver(createProblemSchema),
    defaultValues: {
      testCases: [{ input: '', output: '' }],
      tags: [],
      examples: {
        JAVASCRIPT: { input: '', output: '', explanation: '' },
        PYTHON: { input: '', output: '', explanation: '' },
        JAVA: { input: '', output: '', explanation: '' },
      },
      codeSnippets: {
        JAVASCRIPT: 'function solution() {\n // Write your code here\n}',
        PYTHON: 'def solution(): \n # Write your code here\n pass',
        JAVA: 'public class Solution {\n public static void main(String[] args) {\n // Write your code here\n }\n}',
      },
      referenceSolutions: {
        JAVASCRIPT: '// Add your reference solution here',
        PYTHON: '# Add your reference solution here',
        JAVA: '// Add your reference solution here',
      },
    },
  });

  const { fields: testCaseFields, append: appendTestCase, remove: removeTestCase } = useFieldArray({
    control,
    name: 'testCases',
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control,
    name: 'tags',
  });

  const onSubmit = async (value: CreateProblemFormData) => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.post('/problems/create-problem', value);
      // This will be implemented later with actual submission logic
      console.log('Form data submitted:', value);
      toast.success(res.data.message ?? 'Problem created successfully! 🎉');
      
      // Reset the form
      reset();

      // Navigate to the problems page
      navigate('/problems');
    } catch (error) {
      console.error('Error creating problem:', error);
      toast.error('Failed to create problem. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <div className="bg-base-200 rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Create a New Problem</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <Info className="w-5 h-5" />
                Basic Information
              </h2>
              
              <div className="form-control w-full">
                <label htmlFor="title" className="label">
                  <span className="label-text font-medium">Problem Title</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter problem title"
                  className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
                  {...register('title')}
                />
                {errors.title && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.title.message}</span>
                  </label>
                )}
              </div>
              
              {/* Problem Description */}
              <div className="form-control w-full">
                <label htmlFor="title" className="label">
                  <span className="label-text font-medium">Problem Description</span>
                </label>
                <textarea
                  placeholder="Enter detailed problem description"
                  className={`textarea textarea-bordered h-32 ${errors.description ? 'textarea-error' : ''}`}
                  {...register('description')}
                />
                {errors.description && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.description.message}</span>
                  </label>
                )}
              </div>
              
              {/* Difficulty Level & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label htmlFor="title" className="label">
                    <span className="label-text font-medium">Difficulty Level</span>
                  </label>
                  <select
                    className={`select select-bordered w-full ${errors.difficulty ? 'select-error' : ''}`}
                    {...register('difficulty')}
                  >
                    <option value="">Select Difficulty</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                  {errors.difficulty && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.difficulty.message}</span>
                    </label>
                  )}
                </div>
                
                <div className="form-control w-full">
                  <label htmlFor="title" className="label">
                    <span className="label-text font-medium">Problem Category</span>
                  </label>
                  <select
                    className={`select select-bordered w-full ${errors.category ? 'select-error' : ''}`}
                    {...register('category')}
                  >
                    <option value="">Select Category</option>
                    <option value="ARRAY">Array</option>
                    <option value="STRING">String</option>
                    <option value="LINKED_LIST">Linked List</option>
                    <option value="TREE">Tree</option>
                    <option value="GRAPH">Graph</option>
                    <option value="DYNAMIC_PROGRAMMING">Dynamic Programming</option>
                    <option value="SORTING">Sorting</option>
                    <option value="GREEDY">Greedy</option>
                    <option value="RECURSION">Recursion</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.category && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.category.message}</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Tags */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                Tags
              </h2>
              
              <div className="space-y-4">
                {tagFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <div className="flex-grow">
                      <input
                        type="text"
                        placeholder={`Tag ${index + 1}`}
                        className={`input input-bordered w-full ${errors.tags?.[index] ? 'input-error' : ''}`}
                        {...register(`tags.${index}`)}
                      />
                      {errors.tags?.[index] && (
                        <label className="label">
                          <span className="label-text-alt text-error">{errors.tags?.[index]?.message}</span>
                        </label>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      className="btn btn-square btn-error btn-sm"
                      onClick={() => removeTag(index)}
                      disabled={tagFields.length === 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="btn btn-outline btn-primary btn-sm"
                  onClick={() => appendTag([{ value: '' }])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tag
                </button>
              </div>
            </div>
          </div>
          
          {/* Constraints & Hints */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Constraints & Hints
              </h2>
              
              <div className="form-control w-full">
                <label htmlFor="title" className="label">
                  <span className="label-text font-medium">Constraints</span>
                </label>
                <textarea
                  placeholder="Enter constraints (e.g., '1 <= nums.length <= 10^5')"
                  className={`textarea textarea-bordered h-24 ${errors.constraints ? 'textarea-error' : ''}`}
                  {...register('constraints')}
                />
                {errors.constraints && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.constraints.message}</span>
                  </label>
                )}
              </div>
              
              <div className="form-control w-full">
                <label htmlFor="title" className="label">
                  <span className="label-text font-medium">Hints (Optional)</span>
                </label>
                <textarea
                  placeholder="Enter hints to help users solve the problem"
                  className={`textarea textarea-bordered h-24 ${errors.hints ? 'textarea-error' : ''}`}
                  {...register('hints')}
                />
                {errors.hints && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.hints.message}</span>
                  </label>
                )}
              </div>
            </div>
          </div>
          
          {/* Test Cases */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Test Cases
              </h2>
              
              <div className="space-y-6">
                {testCaseFields.map((field, index) => (
                  <div key={field.id} className="card bg-base-200 p-4 shadow-sm">
                    <h3 className="font-medium mb-3">Test Case {index + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control w-full">
                        <label htmlFor="title" className="label">
                          <span className="label-text font-medium">Input</span>
                        </label>
                        <textarea
                          placeholder="Enter test case input"
                          className={`textarea textarea-bordered h-24 ${errors.testCases?.[index]?.input ? 'textarea-error' : ''}`}
                          {...register(`testCases.${index}.input`)}
                        />
                        {errors.testCases?.[index]?.input && (
                          <label className="label">
                            <span className="label-text-alt text-error">{errors.testCases?.[index]?.input?.message}</span>
                          </label>
                        )}
                      </div>
                      
                      <div className="form-control w-full">
                        <label htmlFor="title" className="label">
                          <span className="label-text font-medium">Expected Output</span>
                        </label>
                        <textarea
                          placeholder="Enter expected output"
                          className={`textarea textarea-bordered h-24 ${errors.testCases?.[index]?.output ? 'textarea-error' : ''}`}
                          {...register(`testCases.${index}.output`)}
                        />
                        {errors.testCases?.[index]?.output && (
                          <label className="label">
                            <span className="label-text-alt text-error">{errors.testCases?.[index]?.output?.message}</span>
                          </label>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="btn btn-error btn-sm"
                        onClick={() => removeTestCase(index)}
                        disabled={testCaseFields.length === 1}
                      >
                        <Minus className="w-4 h-4 mr-2" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="btn btn-outline btn-primary btn-sm"
                  onClick={() => appendTestCase({ input: '', output: '' })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Test Case
                </button>
              </div>
            </div>
          </div>
          
          {/* Examples */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Examples
              </h2>
              
              <div className="tabs tabs-boxed mb-4">
                <a className={`tab ${sampleType === 'DP' ? 'tab-active' : ''}`} onClick={() => setSampleType('DP')}>Dynamic Programming</a>
                <a className={`tab ${sampleType === 'string' ? 'tab-active' : ''}`} onClick={() => setSampleType('string')}>String Manipulation</a>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {['JAVASCRIPT', 'PYTHON', 'JAVA'].map((language) => (
                  <div key={language} className="card bg-base-200 p-4 md:p-6 shadow-md">
                    <h3 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
                      <Code2 className="w-5 h-5" />
                      {language}
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control w-full">
                          <label htmlFor="title" className="label">
                            <span className="label-text font-medium">Input</span>
                          </label>
                          <textarea
                            placeholder={`Enter example input for ${language}`}
                            className="textarea textarea-bordered h-24"
                            {...register(`examples.${language as 'JAVASCRIPT' | 'PYTHON' | 'JAVA'}.input`)}
                          />
                        </div>
                        
                        <div className="form-control w-full">
                          <label htmlFor="title" className="label">
                            <span className="label-text font-medium">Output</span>
                          </label>
                          <textarea
                            placeholder={`Enter example output for ${language}`}
                            className="textarea textarea-bordered h-24"
                            {...register(`examples.${language as 'JAVASCRIPT' | 'PYTHON' | 'JAVA'}.output`)}
                          />
                        </div>
                      </div>
                      
                      <div className="form-control w-full">
                        <label htmlFor="title" className="label">
                          <span className="label-text font-medium">Explanation</span>
                        </label>
                        <textarea
                          placeholder={`Enter explanation for ${language} example`}
                          className="textarea textarea-bordered h-24"
                          {...register(`examples.${language as 'JAVASCRIPT' | 'PYTHON' | 'JAVA'}.explanation`)}
                        />
                      </div>
                      
                      {/* Starter Code Template */}
                      <div className="card bg-base-100 shadow-md">
                        <div className="card-body p-4 md:p-6">
                          <h4 className="font-semibold text-base md:text-lg mb-4">
                            Starter Code Template
                          </h4>
                          <div className="border rounded-md overflow-hidden">
                            <Controller
                              name={`codeSnippets.${language as 'JAVASCRIPT' | 'PYTHON' | 'JAVA'}`}
                              control={control}
                              render={({ field }) => (
                                <Editor
                                  height="300px"
                                  language={language.toLowerCase()}
                                  theme="vs-dark"
                                  value={field.value}
                                  onChange={field.onChange}
                                  options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: "on",
                                    roundedSelection: false,
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                  }}
                                />
                              )}
                            />
                          </div>
                          {errors.codeSnippets?.[language as 'JAVASCRIPT' | 'PYTHON' | 'JAVA'] && (
                            <div className="mt-2">
                              <span className="text-error text-sm">
                                {errors.codeSnippets[language as 'JAVASCRIPT' | 'PYTHON' | 'JAVA']?.message}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Creating Problem...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Create Problem
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProblemForm;
