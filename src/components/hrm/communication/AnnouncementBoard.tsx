import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Bell, Calendar, User } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';

const AnnouncementBoard: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [expiryDate, setExpiryDate] = useState('');

    const { data: announcements, isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => hrmService.getAnnouncements(),
    });

    const createMutation = useMutation({
        mutationFn: () => hrmService.createAnnouncement({
            title,
            content,
            priority: priority as any,
            expiry_date: expiryDate || undefined,
            posted_by: user?.id,
        }),
        onSuccess: () => {
            toast.success('Announcement posted');
            setShowForm(false);
            setTitle('');
            setContent('');
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        },
        onError: () => toast.error('Failed to post announcement'),
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
                    <p className="text-gray-600">Company news and updates</p>
                </div>
                {hasPermission('hrm.announcement.create') && (
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Post New
                    </Button>
                )}
            </div>

            {/* Announcement List */}
            <div className="grid gap-4">
                {announcements?.map((announcement) => (
                    <div
                        key={announcement.id}
                        className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${announcement.priority === 'High' ? 'border-l-red-500' :
                                announcement.priority === 'Medium' ? 'border-l-blue-500' :
                                    'border-l-green-500'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{announcement.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${announcement.priority === 'High' ? 'bg-red-100 text-red-800' :
                                    announcement.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                }`}>
                                {announcement.priority} Priority
                            </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap mb-4">{announcement.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-3">
                            <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                Posted: {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                            </span>
                            {announcement.expiry_date && (
                                <span className="flex items-center text-orange-600">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Expires: {format(new Date(announcement.expiry_date), 'MMM d, yyyy')}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                {(!announcements || announcements.length === 0) && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                        <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No announcements yet.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <h3 className="text-lg font-bold mb-4">Post Announcement</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Important Update..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    rows={5}
                                    placeholder="Details..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button onClick={() => createMutation.mutate()}>Post</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper icon
const Clock = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

export default AnnouncementBoard;
