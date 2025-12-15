import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Plus, User, Calendar } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PerformanceDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['performance-reviews'],
        queryFn: () => hrmService.getPerformanceReviews(),
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Performance Reviews</h2>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Start Review
                </Button>
            </div>

            {/* Reviews List */}
            <div className="grid grid-cols-1 gap-4">
                {reviews?.map((review) => (
                    <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {review.employee?.first_name} {review.employee?.last_name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Reviewed by: {review.reviewer?.first_name} {review.reviewer?.last_name}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-yellow-500 font-bold text-lg">
                                    <Star className="w-5 h-5 fill-current" />
                                    {review.overall_rating || '-'}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${review.status === 'Finalized' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {review.status}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 block">Review Period</span>
                                <span className="font-medium">
                                    {format(new Date(review.review_period_start), 'MMM yyyy')} - {format(new Date(review.review_period_end), 'MMM yyyy')}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Submitted On</span>
                                <span className="font-medium">
                                    {review.submitted_at ? format(new Date(review.submitted_at), 'dd MMM yyyy') : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {(!reviews || reviews.length === 0) && (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                        No performance reviews found.
                    </div>
                )}
            </div>

            {/* Create Modal Placeholder */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Start New Review</h3>
                        <p className="text-gray-500 text-sm mb-4">Review form implementation pending...</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button>Create Draft</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceDashboard;
