import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Users, GraduationCap, FileText, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import hrmService from '../../services/hrmService';
import type { FamilyMember, Education, EmployeeDocument } from '../../types/hrm';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Props {
    employeeId: string;
    onBack: () => void;
}

const EmployeeProfile: React.FC<Props> = ({ employeeId, onBack }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'personal' | 'family' | 'education' | 'documents'>('personal');

    // Fetch Employee Basic Details
    const { data: employee } = useQuery({
        queryKey: ['employee', employeeId],
        queryFn: () => hrmService.getEmployeeMasters().then(res => res.find(e => e.id === employeeId)),
    });

    // Fetch Related Data
    const { data: family } = useQuery({
        queryKey: ['family', employeeId],
        queryFn: () => hrmService.getEmployeeFamily(employeeId),
        enabled: activeTab === 'family',
    });

    const { data: education } = useQuery({
        queryKey: ['education', employeeId],
        queryFn: () => hrmService.getEmployeeEducation(employeeId),
        enabled: activeTab === 'education',
    });

    const { data: documents } = useQuery({
        queryKey: ['documents', employeeId],
        queryFn: () => hrmService.getEmployeeDocuments(employeeId),
        enabled: activeTab === 'documents',
    });

    // Mutations
    const addFamilyMutation = useMutation({
        mutationFn: (data: Partial<FamilyMember>) => hrmService.addFamilyMember({ ...data, employee_id: employeeId }),
        onSuccess: () => {
            toast.success('Family member added');
            queryClient.invalidateQueries({ queryKey: ['family', employeeId] });
        },
    });

    const addEducationMutation = useMutation({
        mutationFn: (data: Partial<Education>) => hrmService.addEducation({ ...data, employee_id: employeeId }),
        onSuccess: () => {
            toast.success('Education added');
            queryClient.invalidateQueries({ queryKey: ['education', employeeId] });
        },
    });

    const addDocumentMutation = useMutation({
        mutationFn: (data: Partial<EmployeeDocument>) => hrmService.addDocument({ ...data, employee_id: employeeId }),
        onSuccess: () => {
            toast.success('Document added');
            queryClient.invalidateQueries({ queryKey: ['documents', employeeId] });
        },
    });

    if (!employee) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{employee.first_name} {employee.last_name}</h2>
                    <p className="text-sm text-gray-500">{employee.job_title} | {employee.staff_unique_id}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('personal')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'personal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" /> Personal
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('family')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'family' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Family
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('education')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'education' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" /> Education
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('documents')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Documents
                    </div>
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {activeTab === 'personal' && (
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Email</dt>
                                    <dd className="font-medium">{employee.work_email}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Phone</dt>
                                    <dd className="font-medium">{employee.personal_phone}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">DOB</dt>
                                    <dd className="font-medium">{format(new Date(employee.date_of_birth), 'd MMM yyyy')}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Gender</dt>
                                    <dd className="font-medium">{employee.gender}</dd>
                                </div>
                            </dl>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Employment Details</h3>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Joining Date</dt>
                                    <dd className="font-medium">{format(new Date(employee.date_of_joining), 'd MMM yyyy')}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Status</dt>
                                    <dd className="font-medium">{employee.employment_status}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Basic Salary</dt>
                                    <dd className="font-medium">₹{employee.basic_salary?.toLocaleString()}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {activeTab === 'family' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button size="sm" onClick={() => {
                                // Mock add
                                addFamilyMutation.mutate({
                                    name: 'New Member',
                                    relationship: 'Spouse',
                                    is_emergency_contact: true
                                });
                            }}>
                                <Plus className="w-4 h-4 mr-2" /> Add Member
                            </Button>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Relationship</th>
                                    <th className="px-4 py-2">Emergency Contact</th>
                                    <th className="px-4 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {family?.map((member) => (
                                    <tr key={member.id} className="border-b">
                                        <td className="px-4 py-3">{member.name}</td>
                                        <td className="px-4 py-3">{member.relationship}</td>
                                        <td className="px-4 py-3">{member.is_emergency_contact ? 'Yes' : 'No'}</td>
                                        <td className="px-4 py-3">
                                            <button className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'education' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button size="sm" onClick={() => {
                                // Mock add
                                addEducationMutation.mutate({
                                    degree: 'B.Sc Nursing',
                                    institution: 'City Medical College',
                                    year_of_passing: 2018
                                });
                            }}>
                                <Plus className="w-4 h-4 mr-2" /> Add Education
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {education?.map((edu) => (
                                <div key={edu.id} className="flex justify-between items-center p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                                        <p className="text-sm text-gray-600">{edu.institution}, {edu.year_of_passing}</p>
                                    </div>
                                    <button className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button size="sm" onClick={() => {
                                // Mock add
                                addDocumentMutation.mutate({
                                    document_type: 'Aadhaar',
                                    document_url: 'https://example.com/doc.pdf',
                                    document_number: '1234-5678-9012'
                                });
                            }}>
                                <Plus className="w-4 h-4 mr-2" /> Upload Document
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {documents?.map((doc) => (
                                <div key={doc.id} className="p-4 border rounded-lg flex items-center gap-3">
                                    <FileText className="w-8 h-8 text-blue-500" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium truncate">{doc.document_type}</p>
                                        <p className="text-xs text-gray-500">{format(new Date(doc.created_at), 'd MMM yyyy')}</p>
                                    </div>
                                    <button className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeProfile;
