import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, Alert, ActivityIndicator, ScrollView, Modal, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { BASE_URL } from '../../utils/config';

const TIME_SLOTS = [
    { start: '08:00', end: '09:00', label: '8:00 AM - 9:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { start: '12:00', end: '13:00', label: '12:00 PM - 1:00 PM' },
    { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
    { start: '16:00', end: '17:00', label: '4:00 PM - 5:00 PM' },
];

const API_URL = `${BASE_URL}/api/bookings`;
const PAYMENTS_API = `${BASE_URL}/api/payments`;

export default function BookingScreen({ route, navigation }) {
    const { listing } = route.params;

    // State
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [blockedDates, setBlockedDates] = useState([]);
    const [showGateway, setShowGateway] = useState(false);
    const [paymentContext, setPaymentContext] = useState(null);

    // Get today's date in YYYY-MM-DD format for minDate
    const today = new Date().toISOString().split('T')[0];

    // Fetch blocked dates on mount
    useEffect(() => {
        const fetchBlockedDates = async () => {
            try {
                const listingId = listing._id || listing.id;
                const res = await axios.get(`${BASE_URL}/api/listings/${listingId}/blocked-dates`);
                setBlockedDates(res.data || []);
            } catch (err) {
                console.error('Error fetching blocked dates:', err);
            }
        };
        fetchBlockedDates();
    }, []);

    const handleConfirmBooking = async () => {
        if (!selectedDate || !selectedSlot) {
            Alert.alert('Error', 'Please select both a date and a time slot.');
            return;
        }

        setIsBooking(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };

            // 1. Create Razorpay Order on backend
            const { data: order } = await axios.post(
                `${BASE_URL}/api/razorpay/create-order`,
                { amount: listing.price },
                config
            );

            // 2. Open Razorpay Checkout via WebView
            const options = {
                description: `Booking for ${listing.name}`,
                image: 'https://i.imgur.com/3g7nmJC.png',
                currency: order.currency,
                key: order.key_id,  // Returned securely from backend
                amount: order.amount,
                name: 'EverythingBooking',
                order_id: order.id,
                prefill: {
                    email: '',
                    contact: '',
                    name: 'Customer'
                },
                theme: { color: '#0f172a' }
            };

            setPaymentContext({ options, config });
            setShowGateway(true);

        } catch (error) {
            console.error('Booking/Payment error:', error.response?.data || error);
            const errorMsg = error.response?.data?.details?.description ||
                error.response?.data?.message ||
                'Failed to initialize checkout';
            Alert.alert('Checkout Failed', errorMsg);
            setIsBooking(false);
        }
    };

    const handlePaymentResponse = async (response) => {
        setShowGateway(false);

        if (response.error) {
            setIsBooking(false);
            Alert.alert('Payment Cancelled', 'You cancelled the transaction.');
            return;
        }

        try {
            const { config } = paymentContext;

            // 3. Create Booking on backend
            const bookingData = {
                providerId: listing.providerId?._id || listing.providerId,
                listingId: listing._id || listing.id,
                date: selectedDate,
                startTime: selectedSlot.start,
                endTime: selectedSlot.end,
                notes: `Paid via Razorpay Web`,
                paymentStatus: 'paid',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
            };

            const bookingRes = await axios.post(API_URL, bookingData, config);

            // 4. Verify Payment on backend
            await axios.post(`${BASE_URL}/api/razorpay/verify`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingRes.data._id
            }, config);

            Alert.alert(
                'Success!',
                `Payment confirmed. Your booking for ${selectedDate} is locked.`,
                [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
            );
        } catch (error) {
            console.error('Verification error:', error.response?.data || error);
            Alert.alert('Verification Failed', 'Payment succeeded but booking verification failed. Contact support.');
        } finally {
            setIsBooking(false);
        }
    };

    const getRazorpayHTML = (options) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          <style>
              body { background-color: #f5f6f8; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
              .loader { border: 4px solid #e2e8f0; border-top: 4px solid #0f172a; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 16px; align-self: center; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              .container { display: flex; flex-direction: column; align-items: center; }
          </style>
        </head>
        <body>
          <div class="container">
              <div class="loader"></div>
              <p style="color: #64748b; font-weight: 600;">Loading Secure Checkout...</p>
          </div>
          <script>
            setTimeout(function() {
                var options = ${JSON.stringify(options)};
                options.handler = function(response) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(response));
                };
                options.modal = {
                    ondismiss: function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ error: true, code: 'CANCELLED' }));
                    }
                };
                var rzp = new Razorpay(options);
                rzp.open();
            }, 500);
          </script>
        </body>
      </html>
    `;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Let's get booked!</Text>
                    <Text style={styles.headerSub}>Find the perfect time for your service</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Provider/Listing Info Context */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoServiceLabel}>SERVICE DETAILS</Text>
                    <Text style={styles.infoTitle} numberOfLines={1} adjustsFontSizeToFit>{listing.name}</Text>
                    <View style={styles.infoProviderRow}>
                        <Text style={styles.infoSub} numberOfLines={1}>By {listing.providerId?.name || 'Local Expert'}</Text>
                    </View>
                </View>

                {/* 1. Date Selection */}
                <Text style={styles.sectionTitle}>1. Select a Date</Text>
                <View style={styles.calendarContainer}>
                    <Calendar
                        minDate={today}
                        onDayPress={day => {
                            if (blockedDates.includes(day.dateString)) return; // Can't select blocked dates
                            setSelectedDate(day.dateString);
                            setSelectedSlot(null);
                        }}
                        markedDates={{
                            ...blockedDates.reduce((acc, date) => {
                                acc[date] = { disabled: true, disableTouchEvent: true, selectedColor: '#ef4444', selected: true, selectedTextColor: '#ffffff' };
                                return acc;
                            }, {}),
                            ...(selectedDate && !blockedDates.includes(selectedDate) ? {
                                [selectedDate]: { selected: true, disableTouchEvent: true, selectedDotColor: '#121221' }
                            } : {})
                        }}
                        theme={{
                            backgroundColor: '#ffffff',
                            calendarBackground: '#ffffff',
                            textSectionTitleColor: '#6b7280',
                            selectedDayBackgroundColor: '#111827',
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: '#111827',
                            dayTextColor: '#111827',
                            textDisabledColor: '#9ca3af',
                            arrowColor: '#111827',
                            monthTextColor: '#111827',
                            textDayFontWeight: '500',
                            textMonthFontWeight: '800',
                            textDayHeaderFontWeight: '600',
                            textDayFontSize: 16,
                            textMonthFontSize: 18,
                            textDayHeaderFontSize: 13
                        }}
                    />
                </View>

                {/* 2. Time Slot Selection */}
                {selectedDate ? (
                    <View style={styles.slotsSection}>
                        <Text style={styles.sectionTitle}>2. Choose your time</Text>
                        <View style={styles.slotsGrid}>
                            {TIME_SLOTS.map((slot, index) => {
                                const isSelected = selectedSlot?.start === slot.start;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.slotCard, isSelected && styles.slotCardActive]}
                                        onPress={() => setSelectedSlot(slot)}
                                    >
                                        <Text
                                            style={[styles.slotLabel, isSelected && styles.slotLabelActive]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit={true}
                                        >
                                            {slot.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryLabel}>Total Amount</Text>
                    <Text style={styles.summaryValue}>₹{listing.price}</Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.payConfirmBtn,
                        (!selectedDate || !selectedSlot || isBooking) && styles.payConfirmBtnDisabled
                    ]}
                    disabled={!selectedDate || !selectedSlot || isBooking}
                    onPress={handleConfirmBooking}
                >
                    {isBooking ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.payConfirmBtnText}>Pay & Confirm</Text>
                    )}
                </TouchableOpacity>
            </View>
            {/* Razorpay WebView Modal */}
            <Modal visible={showGateway} animationType="slide" onRequestClose={() => handlePaymentResponse({ error: true })}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
                    <View style={styles.webviewHeader}>
                        <TouchableOpacity onPress={() => handlePaymentResponse({ error: true })}>
                            <Text style={styles.webviewClose}>✕ Cancel Payment</Text>
                        </TouchableOpacity>
                    </View>
                    {paymentContext && (
                        <WebView
                            source={{ html: getRazorpayHTML(paymentContext.options) }}
                            onMessage={(event) => {
                                try {
                                    const data = JSON.parse(event.nativeEvent.data);
                                    handlePaymentResponse(data);
                                } catch (e) {
                                    console.error('WebView parse error:', e);
                                    handlePaymentResponse({ error: true });
                                }
                            }}
                            originWhitelist={['*']}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 2,
        marginBottom: 20,
    },
    backBtn: {
        marginRight: 16,
        padding: 8,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    backIcon: { color: '#374151', fontSize: 18, fontFamily: 'Inter_700Bold' },
    headerTextContainer: { flex: 1 },
    headerTitle: { color: '#111827', fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.2 },
    headerSub: { color: '#6b7280', fontSize: 13, marginTop: 2, fontFamily: 'Inter_500Medium' },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 110,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    infoServiceLabel: {
        color: '#9ca3af',
        fontSize: 11,
        fontFamily: 'Inter_700Bold',
        letterSpacing: 1,
        marginBottom: 4,
    },
    infoTitle: { color: '#111827', fontSize: 20, fontFamily: 'Inter_800ExtraBold', marginBottom: 6, letterSpacing: -0.5 },
    infoProviderRow: { flexDirection: 'row', alignItems: 'center' },
    infoSub: { color: '#6b7280', fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 },
    sectionTitle: {
        color: '#1f2937',
        fontSize: 20,
        fontFamily: 'Inter_800ExtraBold',
        marginBottom: 16,
        letterSpacing: -0.2,
    },
    calendarContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 24,
        backgroundColor: '#ffffff',
        padding: 10,
    },
    slotsSection: {
        marginBottom: 20,
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    slotCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        width: '48%',
        alignItems: 'center',
    },
    slotCardActive: {
        borderColor: '#111827',
        backgroundColor: '#ffffff',
        borderWidth: 2,
    },
    slotLabel: {
        color: '#6b7280',
        fontSize: 12,
        fontFamily: 'Inter_500Medium',
        textAlign: 'center',
    },
    slotLabelActive: {
        color: '#111827',
        fontFamily: 'Inter_700Bold',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    summaryContainer: {
        flex: 1,
    },
    summaryLabel: {
        color: '#6b7280',
        fontSize: 13,
        fontFamily: 'Inter_600SemiBold',
        textTransform: 'uppercase',
    },
    priceValue: {
        color: '#111827',
        fontSize: 22,
        fontFamily: 'Inter_800ExtraBold',
    },
    webviewHeader: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        alignItems: 'flex-start'
    },
    webviewClose: {
        color: '#ef4444',
        fontFamily: 'Inter_700Bold',
        fontSize: 15
    },
    summaryValue: {
        color: '#374151',
        fontSize: 18,
        fontFamily: 'Inter_700Bold',
        letterSpacing: -0.2,
        marginTop: 2,
    },
    payConfirmBtn: {
        backgroundColor: '#111827',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 160,
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    payConfirmBtnDisabled: {
        backgroundColor: '#e5e7eb',
        shadowOpacity: 0,
        elevation: 0,
    },
    payConfirmBtnText: {
        color: '#ffffff',
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        letterSpacing: 0.5,
    }
});
