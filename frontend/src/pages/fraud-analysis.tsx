import React, { useState } from 'react';
import axios from 'axios';
import Head from 'next/head';

interface FraudStudent {
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2: string;
  phone_fraud_ring: string;
}

interface FraudAnalysisResult {
  question: string;
  sql_query: string;
  explanation: string;
  result_count: number;
  sample_results: FraudStudent[];
}

export default function FraudAnalysisPage() {
  const [data, setData] = useState<FraudAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [question, setQuestion] = useState(
    'What are the addresses and names of students with the highest phone fraud occurrence?'
  );

  const fetchFraudAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/fraud-analysis', {
        question
      });
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch fraud analysis data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFraudAnalysis();
  };

  const handleCopy = async () => {
    if (data?.sql_query) {
      try {
        await navigator.clipboard.writeText(data.sql_query);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const formatExplanation = (text: string) => {
    return text.split('\n\n').map((paragraph, i) => (
      <p key={i} className="mb-4 last:mb-0 text-gray-700 leading-relaxed">
        {paragraph}
      </p>
    ));
  };

  return (
    <>
      <Head>
        <title>Fraud Analysis Dashboard</title>
        <meta name="description" content="Analyze phone fraud patterns" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Fraud Analysis Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600">
              Investigate phone fraud patterns independently
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                  Analysis Question
                </label>
                <textarea
                  id="question"
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </form>
          </div>

          {loading && (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Processing your fraud analysis request...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {data && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Fraud Analysis Report</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full text-white">
                      {data.result_count} records found
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Question */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Original Question</h3>
                  <p className="text-lg font-medium text-gray-800">{data.question}</p>
                </div>

                {/* Explanation */}
                <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">Analysis Summary</h3>
                  <div className="prose prose-blue max-w-none">
                    {formatExplanation(data.explanation)}
                  </div>
                </div>

                {/* Toggle for technical details */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
                >
                  {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
                  <svg
                    className={`ml-2 h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Technical Details */}
                {showDetails && (
                  <div className="space-y-6">
                    {/* SQL Query */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-gray-700">SQL Query</h3>
                        <button
                          onClick={handleCopy}
                          className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                        >
                          {copied ? 'Copied!' : 'Copy'}
                          <svg
                            className="ml-1 h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <pre className="text-sm text-gray-100 p-4 overflow-x-auto">
                          <code>{data.sql_query}</code>
                        </pre>
                      </div>
                    </div>

                    {/* Sample Results */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Sample Results</h3>
                      <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Address
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fraud Rings
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {data.sample_results.map((student, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {student.first_name} {student.last_name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  <div className="space-y-1">
                                    <div className="font-mono text-xs bg-gray-100 p-1 rounded">
                                      {student.address_line_1}
                                    </div>
                                    {student.address_line_2 && (
                                      <div className="font-mono text-xs bg-gray-100 p-1 rounded">
                                        {student.address_line_2}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                    {student.phone_fraud_ring}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Note: Addresses are encrypted to protect privacy
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning Footer */}
                <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Confidential Information</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          This report contains sensitive fraud analysis data. Please handle this information
                          according to your organization's security policies.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}