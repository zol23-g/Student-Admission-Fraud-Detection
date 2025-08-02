// src/pages/api/fraud-analysis.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Forward the request to your backend service
    const backendResponse = await axios.post('http://localhost:8000/api/v1/chat/query-with-chain', {
      message: req.body.question,
      conversation_id: null,
      provider: 'default'
    });

    // Structure the response for the fraud analysis page
    const formattedResponse = {
      question: req.body.question,
      sql_query: backendResponse.data.sql_query,
      explanation: backendResponse.data.explanation,
      result_count: backendResponse.data.result_count || 0,
      sample_results: Array.isArray(backendResponse.data.results) ? 
        backendResponse.data.results : []
    };

    res.status(200).json(formattedResponse);
  } catch (error) {
    console.error('Fraud analysis error:', error);
    res.status(500).json({ message: 'Error processing fraud analysis' });
  }
}