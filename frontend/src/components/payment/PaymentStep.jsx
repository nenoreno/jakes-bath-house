import React, { useState, useEffect } from 'react';
import PaymentForm from './PaymentForm';
import axios from 'axios';

const PaymentStep = ({ 
  selectedService, 
  selectedPet, 
  selectedDate, 
  selectedTime, 
  userId, 
  onPaymentSuccess, 
  onBack 
}) => {
  const [paymentType, setPaymentType] = useState('full');
  const [serviceDetails, setServiceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch full service details including deposit requirements
    const fetchServiceDetails = async () => {
      try {
        const response = await axios.get('/api/v1/services');
        const service = response.data.services.find(s => s.id === selectedService);
        setServiceDetails(service);
        
        // Set default payment type based on service requirements
        if (service?.requires_deposit && service.type === 'groom') {
          setPaymentType('deposit');
        }
      } catch (err) {
        console.error('Failed to fetch service details:', err);
        setError('Failed to load service information');
      } finally {
        setLoading(false);
      }
    };

    if (selectedService) {
      fetchServiceDetails();
    }
  }, [selectedService]);

  const calculateAmount = () => {
    if (!serviceDetails) return 0;
    
    if (paymentType === 'deposit' && serviceDetails.requires_deposit) {
      return serviceDetails.price * (serviceDetails.deposit_percentage / 100);
    }
    return serviceDetails.price;
  };

  const handlePaymentSuccess = (paymentResult) => {
    // Call parent success handler with all booking details
    if (onPaymentSuccess) {
      onPaymentSuccess({
        ...paymentResult,
        service: serviceDetails,
        pet: selectedPet,
        date: selectedDate,
        time: selectedTime,
        paymentType
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading payment details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          onClick={onBack}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Go back and try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment</h2>
        
        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Service:</span>
              <span className="font-medium">{serviceDetails?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Pet:</span>
              <span className="font-medium">{selectedPet?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span className="font-medium">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Service Cost:</span>
              <span className="font-medium">${serviceDetails?.price?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Type Selection (for grooming services) */}
        {serviceDetails?.requires_deposit && serviceDetails.type === 'groom' && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Payment Option</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentType"
                  value="deposit"
                  checked={paymentType === 'deposit'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium">Pay Deposit (${calculateAmount().toFixed(2)})</div>
                  <div className="text-sm text-gray-500">
                    Pay {serviceDetails.deposit_percentage}% now, rest on arrival
                  </div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentType"
                  value="full"
                  checked={paymentType === 'full'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium">Pay Full Amount (${serviceDetails.price?.toFixed(2)})</div>
                  <div className="text-sm text-gray-500">
                    Pay complete amount now
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Payment Form */}
      <PaymentForm
        amount={calculateAmount()}
        serviceId={selectedService}
        userId={userId}
        petId={selectedPet?.id}
        paymentType={paymentType}
        appointmentDetails={{
          user_id: userId,
          pet_id: selectedPet?.id,
          service_id: selectedService,
          date: selectedDate,
          time: selectedTime,
          notes: ''
        }}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={(error) => {
          console.error('Payment error:', error);
          setError('Payment failed. Please try again.');
        }}
      />

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export default PaymentStep;