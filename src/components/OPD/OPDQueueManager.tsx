import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Reorder } from 'framer-motion';
import {
    Users,
    Activity,
    Calendar,
    Clock,
    CheckCircle,
    PlayCircle,
    UserPlus,
    RefreshCw
} from 'lucide-react';
import HospitalService from '../../services/hospitalService';
import { logger } from '../../utils/logger';
import type { User, OPDQueue } from '../../config/supabaseNew';
import VitalsRecordingModal from './VitalsRecordingModal';
import WalkInQueueModal from './WalkInQueueModal';

const OPDQueueManager: React.FC = () => {
    const [queues, setQueues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Vitals Modal State
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [selectedPatientForVitals, setSelectedPatientForVitals] = useState<{ id: string, name: string, queueId: string } | null>(null);

    // Walk-in Modal State
    const [showWalkInModal, setShowWalkInModal] = useState(false);

    useEffect(() => {
        loadDoctors();
        loadQueues();

        // Auto-refresh every 30 seconds
        const interval = setInterval(loadQueues, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDoctors = async () => {
        try {
            const docs = await HospitalService.getDoctors();
            setDoctors(docs);
        } catch (error) {
            console.error('Failed to load doctors', error);
        }
    };

    const loadQueues = async () => {
        try {
            setLoading(true);
            const data = await HospitalService.getOPDQueues(
                statusFilter !== 'all' ? statusFilter : undefined,
                selectedDoctor || undefined
            );
            setQueues(data);
        } catch (error) {
            console.error('Failed to load queues', error);
            toast.error('Failed to load queue data');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (queueId: string, newStatus: string) => {
        try {
            await HospitalService.updateQueueStatus(queueId, newStatus);
            toast.success(`Status updated to ${newStatus}`);
            loadQueues();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const openVitalsModal = (patient: any, queueId: string) => {
        setSelectedPatientForVitals({
            id: patient.patient_id, // Use the correct ID field based on SQL join
            name: `${patient.first_name} ${patient.last_name}`,
            queueId: queueId
        });
        setShowVitalsModal(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WAITING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'VITALS_DONE': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'IN_CONSULTATION': return 'bg-green-100 text-green-800 border-green-200';
            case 'WAITING': return 'border-l-yellow-500'; // Changed to border-l for consistency with new design
            case 'VITALS_DONE': return 'border-l-blue-500';
            case 'IN_CONSULTATION': return 'border-l-green-500';
            case 'COMPLETED': return 'border-l-gray-400';
            case 'CANCELLED': return 'border-l-red-500';
            default: return 'border-l-gray-300';
        }
    };

    // Sort function for local state only (initially matches backend sort)
    // When dragging happens, the order is updated locally then sent to backend

    const handleReorder = (newOrder: OPDQueueWithRelations[]) => {
        setQueue(newOrder); // Optimistic update

        // Prepare payload for backend
        const reorderPayload = newOrder.map((item, index) => ({
            id: item.id,
            order: index + 1
        }));

        // Debounce or just send? For now just send, maybe debounce later if needed
        HospitalService.reorderOPDQueue(reorderPayload).catch(err => {
            console.error('Failed to save queue order', err);
            toast.error('Failed to save new order');
            loadQueues(); // Revert on failure
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">🏥 OPD Queue Live Status</h2>
                    <p className="text-sm text-gray-500">Drag to reorder • {queue.length} patients waiting</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowWalkInModal(true)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                    >
                        <UserPlus size={16} />
                        Add Walk-in
                    </button>
                    <button
                        onClick={loadQueues}
                        className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                        title="Refresh Queue"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <select
                        value={selectedDoctor}
                        onChange={(e) => { setSelectedDoctor(e.target.value); loadQueues(); }}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Doctors</option>
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Queue List - Draggable */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                {loading && queue.length === 0 ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : queue.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        <div className="text-4xl mb-2">👥</div>
                        <p>No patients in queue</p>
                    </div>
                ) : (
                    <Reorder.Group
                        axis="y"
                        values={queue}
                        onReorder={handleReorder}
                        className="space-y-3"
                    >
                        {queue.map((item, index) => (
                            <Reorder.Item
                                key={item.id}
                                value={item}
                                className="cursor-grab active:cursor-grabbing"
                            >
                                <div className={`bg-white p-4 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow relative ${getStatusColor(item.status)}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold text-gray-700 text-sm mt-1">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">
                                                    {item.patient?.first_name} {item.patient?.last_name}
                                                </h3>
                                                <div className="text-sm text-gray-600 flex flex-col gap-1 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        Token #{item.token_number} • {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                    {item.appointment_id && (
                                                        <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                                                            📅 Appt: {item.patient?.appointments?.find(a => a.id === item.appointment_id)?.appointment_time || 'Scheduled'}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        👨‍⚕️ {item.doctor?.first_name} {item.doctor?.last_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 items-end">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                                                item.status === 'IN_CONSULTATION' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.status.replace('_', ' ')}
                                            </span>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-2">
                                                {item.status === 'WAITING' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPatientForVitals(item);
                                                            setShowVitalsModal(true);
                                                        }}
                                                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                                                        title="Record Vitals"
                                                    >
                                                        <Activity size={14} /> Vitals
                                                    </button>
                                                )}

                                                {item.status === 'WAITING' && (
                                                    <button
                                                        onClick={() => updateStatus(item.id, 'IN_CONSULTATION')}
                                                        className="bg-green-50 text-green-600 hover:bg-green-100 p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                                                        title="Start Consultation"
                                                    >
                                                        <PlayCircle size={14} /> Start
                                                    </button>
                                                )}

                                                {item.status === 'IN_CONSULTATION' && (
                                                    <button
                                                        onClick={() => updateStatus(item.id, 'COMPLETED')}
                                                        className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                                                        title="Complete"
                                                    >
                                                        <CheckCircle size={14} /> Done
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Drag Handle Indicator (Visual only) */}
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 opacity-50 hover:opacity-100 cursor-grab">
                                        <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
                                            <circle cx="4" cy="4" r="1.5" />
                                            <circle cx="4" cy="10" r="1.5" />
                                            <circle cx="4" cy="16" r="1.5" />
                                            <circle cx="8" cy="4" r="1.5" />
                                            <circle cx="8" cy="10" r="1.5" />
                                            <circle cx="8" cy="16" r="1.5" />
                                        </svg>
                                    </div>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </div>

            {/* Modals */}
            <WalkInQueueModal
                isOpen={showWalkInModal}
                onClose={() => { setShowWalkInModal(false); loadQueues(); }}
            />

            {showVitalsModal && selectedPatientForVitals && (
                <VitalsRecordingModal
                    patientId={selectedPatientForVitals.patient?.id || ''} // Access patient ID from nested object
                    patientName={`${selectedPatientForVitals.patient?.first_name || ''} ${selectedPatientForVitals.patient?.last_name || ''}`}
                    queueId={selectedPatientForVitals.id}
                    isOpen={showVitalsModal}
                    onClose={() => { setShowVitalsModal(false); loadQueues(); }}
                />
            )}
        </div>
    );
};

export default OPDQueueManager;
