import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Users, Plus, Search, MapPin } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const RecruitmentDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs');
    const [showCreateJobModal, setShowCreateJobModal] = useState(false);

    const { data: jobs, isLoading: jobsLoading } = useQuery({
        queryKey: ['recruitment-jobs'],
        queryFn: () => hrmService.getJobPostings(),
    });

    const { data: candidates, isLoading: candidatesLoading } = useQuery({
        queryKey: ['recruitment-candidates'],
        queryFn: () => hrmService.getCandidates(),
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Recruitment</h2>
                <div className="flex gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('jobs')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'jobs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Jobs
                        </button>
                        <button
                            onClick={() => setActiveTab('candidates')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'candidates' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Candidates
                        </button>
                    </div>
                    {activeTab === 'jobs' && (
                        <Button onClick={() => setShowCreateJobModal(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Post Job
                        </Button>
                    )}
                </div>
            </div>

            {activeTab === 'jobs' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jobs?.map((job) => (
                        <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${job.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {job.status}
                                    </span>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    <p>{job.positions} Openings</p>
                                    <p>Posted: {format(new Date(job.posted_date), 'd MMM')}</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{job.description}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <span className="text-xs text-gray-500">
                                    {/* TODO: Count candidates */}
                                    0 Applicants
                                </span>
                                <Button variant="outline" size="sm">View Details</Button>
                            </div>
                        </div>
                    ))}
                    {(!jobs || jobs.length === 0) && (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                            No active job postings.
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Candidate</th>
                                <th className="px-6 py-3">Applied For</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidates?.map((candidate) => (
                                <tr key={candidate.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{candidate.first_name} {candidate.last_name}</div>
                                        <div className="text-xs text-gray-500">{candidate.email}</div>
                                    </td>
                                    <td className="px-6 py-4">{candidate.job?.title || '-'}</td>
                                    <td className="px-6 py-4">{format(new Date(candidate.applied_at), 'd MMM yyyy')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${candidate.status === 'Hired' ? 'bg-green-100 text-green-800' :
                                                candidate.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {candidate.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-600 hover:underline">View</button>
                                    </td>
                                </tr>
                            ))}
                            {(!candidates || candidates.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No candidates found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Job Modal Placeholder */}
            {showCreateJobModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Post New Job</h3>
                        <p className="text-gray-500 text-sm mb-4">Form implementation pending...</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCreateJobModal(false)}>Cancel</Button>
                            <Button>Post Job</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruitmentDashboard;
