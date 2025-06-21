import { useState } from 'react';
import { Eye } from 'lucide-react';
import { TestResultViewerModal } from './TestResultViewerModal';
// import { Button } from '../ui/button'; // Temporarily removed for deployment
import { formatDate } from '@/lib/utils';
import { OrderStatus, TestStatus } from '@prisma/client';

interface BloodTestResult {
  id: string;
  testName: string;
  orderDate: Date;
  status: OrderStatus;
  resultStatus?: TestStatus;
  resultId?: string;
}

interface BloodTestResultsTableProps {
  results: BloodTestResult[];
}

export function BloodTestResultsTable({ results }: BloodTestResultsTableProps) {
  const [selectedTest, setSelectedTest] = useState<{id: string, name: string} | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleViewResult = (testId: string, testName: string) => {
    setSelectedTest({ id: testId, name: testName });
    setIsViewerOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Test Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Result
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((test) => (
              <tr key={test.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {test.testName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(test.orderDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {test.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {test.resultStatus === TestStatus.ready ? (
                    <span className="text-green-600">Ready</span>
                  ) : (
                    <span className="text-gray-400">No Result</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => test.resultId && handleViewResult(test.resultId, test.testName)}
                      disabled={!test.resultId || test.resultStatus !== TestStatus.ready}
                      className="p-1 bg-gray-100 text-blue-600 hover:text-blue-800 rounded"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Viewer Modal */}
      {selectedTest && (
        <TestResultViewerModal
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedTest(null);
          }}
          testId={selectedTest.id}
          testName={selectedTest.name}
        />
      )}
    </>
  );
}
