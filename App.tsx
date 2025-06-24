import React, { useState, useEffect, useCallback } from 'react';
import { NAV_TABS, AGE_GROUP_DISPLAY_KEYS } from './constants';
import AddVisitForm from './components/AddVisitForm';
import VisitList from './components/VisitList';
import Dashboard from './components/Dashboard';
import NavItem from './components/NavItem';
import Modal from './components/Modal';
import LoadingSpinner from './components/LoadingSpinner';
import { EventType, Visit, VisitFormData, DailySummary, ChartDataPoint, HistoricalReportParams } from './types';
import apiService from './services/apiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(NAV_TABS[0].id);
  
  // Data states
  const [visits, setVisits] = useState<Visit[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);
  const [currentMonthData, setCurrentMonthData] = useState<ChartDataPoint[]>([]);
  const [historicalData, setHistoricalData] = useState<ChartDataPoint[]>([]);
  const [historicalParams, setHistoricalParams] = useState<HistoricalReportParams>({ period: 'week', count: 4 });

  // Loading states for each tab
  const [isLoadingEventTypes, setIsLoadingEventTypes] = useState<boolean>(false);
  const [isLoadingVisits, setIsLoadingVisits] = useState<boolean>(false);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // UI states
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [visitToDeleteId, setVisitToDeleteId] = useState<number | null>(null);

  const showMessage = (setter: React.Dispatch<React.SetStateAction<string | null>>, message: string, duration: number = 3000) => {
    setter(message);
    setTimeout(() => setter(null), duration);
  };

  // Load event types (needed for Add Visit form)
  const loadEventTypes = useCallback(async () => {
    if (eventTypes.length > 0) return; // Already loaded
    
    setIsLoadingEventTypes(true);
    setError(null);
    try {
      const eventTypesData = await apiService.getEventTypes();
      setEventTypes(eventTypesData);
    } catch (err) {
      setError('Failed to fetch event types. Please try again later.');
      console.error(err);
    } finally {
      setIsLoadingEventTypes(false);
    }
  }, [eventTypes.length]);

  // Load visits (needed for Manage Visits tab)
  const loadVisits = useCallback(async () => {
    setIsLoadingVisits(true);
    setError(null);
    try {
      const visitsData = await apiService.getVisits();
      setVisits(visitsData);
    } catch (err) {
      setError('Failed to fetch visits. Please try again later.');
      console.error(err);
    } finally {
      setIsLoadingVisits(false);
    }
  }, []);

  // Load reports data (needed for Reports tab)
  const loadReportsData = useCallback(async () => {
    setIsLoadingReports(true);
    setError(null);
    try {
      const [summaryData, monthChartData, histData] = await Promise.all([
        apiService.getTodaySummary(),
        apiService.getCurrentMonthData(),
        apiService.getHistoricalData(historicalParams.period, historicalParams.count)
      ]);
      setTodaySummary(summaryData);
      setCurrentMonthData(monthChartData);
      setHistoricalData(histData);
    } catch (err) {
      setError('Failed to fetch reports data. Please try again later.');
      console.error(err);
    } finally {
      setIsLoadingReports(false);
    }
  }, [historicalParams]);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'add') {
      loadEventTypes();
    } else if (activeTab === 'manage') {
      loadEventTypes(); // Also needed for the visit list
      loadVisits();
    } else if (activeTab === 'reports') {
      loadEventTypes(); // Also needed for the dashboard
      loadReportsData();
    }
  }, [activeTab, loadEventTypes, loadVisits, loadReportsData]);

  const handleFetchHistoricalData = useCallback(async (period: 'week' | 'month', count: number) => {
    setHistoricalParams({ period, count });
    setIsLoadingReports(true);
    try {
      const histData = await apiService.getHistoricalData(period, count);
      setHistoricalData(histData);
    } catch (err) {
      setError('Failed to fetch historical data.');
      console.error(err);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  const handleFormSubmit = async (formData: VisitFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingVisit) {
        await apiService.updateVisit(editingVisit.id, formData);
        showMessage(setSuccessMessage, 'Visit updated successfully!');
      } else {
        await apiService.createVisit(formData);
        showMessage(setSuccessMessage, 'Visit added successfully!');
      }
      setEditingVisit(null);
      setActiveTab(NAV_TABS[1].id); // Switch to Manage Visits tab
      // Refresh visits data after adding/updating
      loadVisits();
    } catch (err) {
      setError('Failed to save visit. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVisit = (visit: Visit) => {
    setEditingVisit(visit);
    setActiveTab(NAV_TABS[0].id); // Switch to Add Visit tab
  };

  const openDeleteModal = (id: number) => {
    setVisitToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setVisitToDeleteId(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteVisit = async () => {
    if (visitToDeleteId === null) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await apiService.deleteVisit(visitToDeleteId);
      closeDeleteModal();
      showMessage(setSuccessMessage, 'Visit deleted successfully!');
      // Refresh visits data after deleting
      loadVisits();
    } catch (err) {
      setError('Failed to delete visit. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleExportCSV = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiService.exportVisits();
      showMessage(setSuccessMessage, 'CSV export started!');
    } catch (err) {
      setError('Failed to export CSV. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which loading state to show based on active tab
  const getCurrentLoadingState = () => {
    if (activeTab === 'add') return isLoadingEventTypes;
    if (activeTab === 'manage') return isLoadingEventTypes || isLoadingVisits;
    if (activeTab === 'reports') return isLoadingEventTypes || isLoadingReports;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Museum Visitor Management</h1>
        </div>
        <nav className="bg-blue-700">
          <div className="container mx-auto px-4 flex space-x-1">
            {NAV_TABS.map(tab => (
              <NavItem
                key={tab.id}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'add') setEditingVisit(null); // Clear editing state if not on add tab
                }}
              />
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {getCurrentLoadingState() && <LoadingSpinner />}
        {isSubmitting && <LoadingSpinner />}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}

        {activeTab === 'add' && (
          <AddVisitForm
            key={editingVisit ? `edit-${editingVisit.id}` : 'add-new'} // Force re-render on edit
            initialData={editingVisit}
            eventTypes={eventTypes}
            onSubmit={handleFormSubmit}
            onClear={() => setEditingVisit(null)}
          />
        )}
        {activeTab === 'manage' && !getCurrentLoadingState() && (
          <VisitList
            visits={visits}
            eventTypes={eventTypes}
            onEdit={handleEditVisit}
            onDelete={openDeleteModal}
            onExportCSV={handleExportCSV}
          />
        )}
        {activeTab === 'reports' && !getCurrentLoadingState() && todaySummary && (
          <Dashboard
            todaySummary={todaySummary}
            currentMonthData={currentMonthData}
            historicalData={historicalData}
            onFetchHistoricalData={handleFetchHistoricalData}
            initialHistoricalParams={historicalParams}
            ageGroupKeys={AGE_GROUP_DISPLAY_KEYS}
          />
        )}
      </main>

      <footer className="bg-gray-800 text-white text-center py-4">
        <p>&copy; {new Date().getFullYear()} Museum Visitor Management. All rights reserved.</p>
      </footer>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteVisit}
        title="Confirm Deletion"
      >
        <p>Are you sure you want to delete this visit record? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default App;
