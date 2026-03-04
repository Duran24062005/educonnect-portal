import { create } from 'zustand';

interface AdminUiState {
  enrollmentYearId: string;
  selectedGroupId: string;
  selectedStudentId: string;
  setEnrollmentYearId: (value: string) => void;
  setSelectedGroupId: (value: string) => void;
  setSelectedStudentId: (value: string) => void;
}

const initialYear = localStorage.getItem('admin_enrollment_year') || '';

export const useAdminUiStore = create<AdminUiState>((set) => ({
  enrollmentYearId: initialYear,
  selectedGroupId: '',
  selectedStudentId: '',
  setEnrollmentYearId: (value) => {
    localStorage.setItem('admin_enrollment_year', value);
    set({ enrollmentYearId: value });
  },
  setSelectedGroupId: (value) => set({ selectedGroupId: value }),
  setSelectedStudentId: (value) => set({ selectedStudentId: value }),
}));
