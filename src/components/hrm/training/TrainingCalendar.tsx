import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Users, Clock, Plus } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TrainingCalendar: React.FC = () => {
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data: trainings, isLoading } = useQuery({
        queryKey: ['training-programs'],
        queryFn: () => hrmService.getTrainingPrograms(),
    });

    const registerMutation = useMutation({
        mutationFn: (trainingId: string) => {
            // TODO: Get actual employee ID
            const mockEmployeeId = '00000000-0000-0000-0000-000000000000';
            return hrmService.registerForTraining(trainingId, mockEmployeeId);
        },
        onSuccess: () => {
            toast.success('Registered successfully');
            queryClient.invalidateQueries({ queryKey: ['training-programs'] });
        },
        onError: () => toast.error('Failed to register'),
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Training Calendar</h2>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Schedule Training
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainings?.map((program) => (
                    <div key={program.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${program.training_type === 'Technical' ? 'bg-blue-100 text-blue-800' :
                                        program.training_type === 'Soft Skills' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {program.training_type}
                                </span>
                                <span className={`text-xs font-medium ${program.status === 'Scheduled' ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                    {program.status}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2">{program.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{program.description}</p>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                    {format(new Date(program.start_time), 'd MMM yyyy, HH:mm')}
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                    {program.location || 'Online'}
                                </div>
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                                    Trainer: {program.trainer_name}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => registerMutation.mutate(program.id)}
                                disabled={registerMutation.isPending}
                            >
                                Register Now
                            </Button>
                        </div>
                    </div>
                ))}

                {(!trainings || trainings.length === 0) && (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                        No upcoming training programs.
                    </div>
                )}
            </div>

            {/* Create Modal Placeholder */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Schedule Training</h3>
                        <p className="text-gray-500 text-sm mb-4">Form implementation pending...</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button>Create Event</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainingCalendar;
