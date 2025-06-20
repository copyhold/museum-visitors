
import React, { useState, useEffect } from 'react';
import { VisitFormData, VisitTypeEnum, EventType, AgeGroupCounts, Visit } from '../types';
import { AGE_GROUP_KEYS, AGE_GROUP_LABELS, MAX_GROUP_DESCRIPTION_LENGTH } from '../constants';

interface AddVisitFormProps {
  initialData?: Visit | null;
  eventTypes: EventType[];
  onSubmit: (data: VisitFormData) => void;
  onClear: () => void;
}

const getDefaultFormData = (): VisitFormData => ({
  date: new Date().toISOString().split('T')[0],
  visit_type: VisitTypeEnum.INDIVIDUAL,
  group_description: '',
  children_count: 0,
  adults_count: 0,
  seniors_count: 0,
  students_count: 0,
  event_type_id: 0,
});

const AddVisitForm: React.FC<AddVisitFormProps> = ({ initialData, eventTypes, onSubmit, onClear }) => {
  const [formData, setFormData] = useState<VisitFormData>(getDefaultFormData());
  const [groupDescCharsLeft, setGroupDescCharsLeft] = useState<number>(MAX_GROUP_DESCRIPTION_LENGTH);

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        visit_type: initialData.visit_type,
        group_description: initialData.group_description || '',
        children_count: initialData.children_count,
        adults_count: initialData.adults_count,
        seniors_count: initialData.seniors_count,
        students_count: initialData.students_count,
        event_type_id: initialData.event_type_id,
      });
      if (initialData.group_description) {
        setGroupDescCharsLeft(MAX_GROUP_DESCRIPTION_LENGTH - initialData.group_description.length);
      } else {
         setGroupDescCharsLeft(MAX_GROUP_DESCRIPTION_LENGTH);
      }
    } else {
      setFormData(getDefaultFormData());
      setGroupDescCharsLeft(MAX_GROUP_DESCRIPTION_LENGTH);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'radio' && name === 'visit_type') {
      setFormData(prev => ({ 
        ...prev, 
        visit_type: value as VisitTypeEnum,
        group_description: value === VisitTypeEnum.INDIVIDUAL ? '' : prev.group_description,
      }));
      if (value === VisitTypeEnum.INDIVIDUAL) {
        setGroupDescCharsLeft(MAX_GROUP_DESCRIPTION_LENGTH);
      }
      return;
    }

    if (name === 'group_description') {
      const remaining = MAX_GROUP_DESCRIPTION_LENGTH - value.length;
      if (remaining >= 0) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setGroupDescCharsLeft(remaining);
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseInt(value, 10) || 0) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.event_type_id || formData.event_type_id === 0) {
      alert("Please select an event type.");
      return;
    }
    onSubmit(formData);
  };

  const handleClear = () => {
    setFormData(getDefaultFormData());
    setGroupDescCharsLeft(MAX_GROUP_DESCRIPTION_LENGTH);
    onClear(); 
  };
  
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-lg shadow-xl space-y-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">{initialData ? 'Edit Visit' : 'Add New Visit'}</h2>
      
      {/* Visit Type */}
      <fieldset className="space-y-2">
        <legend className="text-lg font-medium text-gray-700">Visit Type</legend>
        <div className="flex items-center space-x-4">
          {(Object.values(VisitTypeEnum) as VisitTypeEnum[]).map(type => (
            <label key={type} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="visit_type"
                value={type}
                checked={formData.visit_type === type}
                onChange={handleChange}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Group Description */}
      {formData.visit_type === VisitTypeEnum.GROUP && (
        <div>
          <label htmlFor="group_description" className="block text-sm font-medium text-gray-700 mb-1">
            Group Description
          </label>
          <textarea
            id="group_description"
            name="group_description"
            value={formData.group_description || ''}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            maxLength={MAX_GROUP_DESCRIPTION_LENGTH}
          />
          <p className="text-xs text-gray-500 mt-1">{groupDescCharsLeft} characters remaining</p>
        </div>
      )}

      {/* Date Selection */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date of Visit</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          max={today}
          className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
        />
      </div>

      {/* Age Group Counters */}
      <fieldset className="space-y-2">
        <legend className="text-lg font-medium text-gray-700">Visitor Counts</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {AGE_GROUP_KEYS.map(key => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
                {AGE_GROUP_LABELS[key]}
              </label>
              <input
                type="number"
                id={key}
                name={key}
                value={formData[key as keyof AgeGroupCounts]}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Event Type Selection */}
      <div>
        <label htmlFor="event_type_id" className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
        <select
          id="event_type_id"
          name="event_type_id"
          value={formData.event_type_id}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white"
        >
          <option value="0" disabled>Select an event type</option>
          {eventTypes.map(et => (
            <option key={et.id} value={et.id}>{et.name}</option>
          ))}
        </select>
      </div>
      
      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
        <button
          type="submit"
          className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
        >
          {initialData ? 'Update Visit' : 'Save Visit'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
        >
          Clear Form
        </button>
      </div>
    </form>
  );
};

export default AddVisitForm;
