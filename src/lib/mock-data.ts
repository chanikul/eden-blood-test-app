// Mock blood test data for fallback when Stripe API is unavailable
export const mockBloodTests = [
  {
    id: 'mock_test_basic',
    name: 'Basic Health Check',
    description: 'A comprehensive blood test covering essential health markers.',
    price: 9900, // £99.00
    priceId: 'mock_price_basic',
    image: '/images/blood-tests/basic-health.jpg',
    metadata: {
      type: 'blood_test',
      category: 'general',
      turnaround_time: '3-5 days'
    }
  },
  {
    id: 'mock_test_advanced',
    name: 'Advanced Health Profile',
    description: 'Detailed blood analysis with comprehensive biomarkers for optimal health monitoring.',
    price: 14900, // £149.00
    priceId: 'mock_price_advanced',
    image: '/images/blood-tests/advanced-health.jpg',
    metadata: {
      type: 'blood_test',
      category: 'general',
      turnaround_time: '5-7 days'
    }
  },
  {
    id: 'mock_test_hormone',
    name: 'Hormone Panel',
    description: 'Complete hormone profile to assess endocrine function and balance.',
    price: 12900, // £129.00
    priceId: 'mock_price_hormone',
    image: '/images/blood-tests/hormone-panel.jpg',
    metadata: {
      type: 'blood_test',
      category: 'hormone',
      turnaround_time: '4-6 days'
    }
  },
  {
    id: 'mock_test_vitamin',
    name: 'Vitamin & Mineral Check',
    description: 'Assessment of essential vitamins and minerals to identify deficiencies.',
    price: 8900, // £89.00
    priceId: 'mock_price_vitamin',
    image: '/images/blood-tests/vitamin-check.jpg',
    metadata: {
      type: 'blood_test',
      category: 'nutrition',
      turnaround_time: '3-5 days'
    }
  }
];
