import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import axios from 'axios';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: 'Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

const CheckoutForm = ({ 
  amount, 
  serviceId, 
  userId, 
  petId, 
  paymentType = 'full',
  appointmentDetails,
  onPaymentSuccess, 
  onPaymentError 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await axios.post('/api/v1/payments/intent', {
          service_id: serviceId,
          user_id: userId,
          pet_id: petId,
          payment_type: paymentType
        });

        setClientSecret(response.data.client_secret);
      } catch (err) {
        console.error('Failed to create payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
      }
    };

    if (serviceId && userId && petId) {
      createPaymentIntent();
    }
  }, [serviceId, userId, petId, paymentType]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError('');

    const card = elements.getElement(CardElement);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // If payment succeeded, confirm with our backend
      if (paymentIntent.status === 'succeeded') {
        const confirmResponse = await axios.post('/api/v1/payments/confirm', {
          payment_intent_id: paymentIntent.id,
          appointment_details: appointmentDetails
        });

        // Call success callback
        if (onPaymentSuccess) {
          onPaymentSuccess({
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            appointmentCreated: !!appointmentDetails
          });
        }
      }
    } catch (err) {
      console.error('Payment confirmation failed:', err);
      setError(err.response?.data?.error || 'Payment processing failed. Please try again.');
      if (onPaymentError) {
        onPaymentError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
        <div className="flex justify-between text-sm">
          <span>Amount ({paymentType}):</span>
          <span className="font-medium">${amount?.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-md p-3 bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || !clientSecret}
        className={`w-full py-3 px-4 rounded-md font-medium text-white ${
          loading || !stripe || !clientSecret
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Pay $${amount?.toFixed(2)} ${paymentType === 'deposit' ? 'Deposit' : ''}`
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Secure payment powered by Stripe</span>
        </div>
      </div>
    </form>
  );
};

const PaymentForm = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default PaymentForm;