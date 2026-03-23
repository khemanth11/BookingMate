import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, StatusBar, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';

const TIME_SLOTS = [
    { start: '08:00', end: '09:00', label: '8:00 AM - 9:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { start: '12:00', end: '13:00', label: '12:00 PM - 1:00 PM' },
    { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
    { start: '16:00', end: '17:00', label: '4:00 PM - 5:00 PM' },
];

const API_URL = 'http://10.113.112.195:5000/api/bookings';
const PAYMENTS_API = 'http://10.113.112.195:5000/api/payments';

export default function BookingScreen({ route, navigation }) {
    const { listing } = route.params;

    // State
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [blockedDates, setBlockedDates] = useState([]);

    // Get today's date in YYYY-MM-DD format for minDate
    const today = new Date().toISOString().split('T')[0];

    // Fetch blocked dates on mount
    useEffect(() => {
        const fetchBlockedDates = async () => {
            try {
                const listingId = listing._id || listing.id;
                const res = await axios.get(`http://10.113.112.195:5000/api/listings/${listingId}/blocked-dates`);
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
                `http://10.113.112.195:5000/api/razorpay/create-order`,
                { amount: listing.price },
                config
            );

            // 2. Open Razorpay Checkout
            const options = {
                description: `Booking for ${listing.name}`,
                image: 'https://i.imgur.com/3g7nmJC.png', // Placeholder logo
                currency: order.currency,
                key: 'rzp_test_placeholder', // Should be replaced by process.env or fetched from backend
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

            const response = await RazorpayCheckout.open(options);

            // 3. Create Booking on backend
            const bookingData = {
                providerId: listing.providerId?._id || listing.providerId,
                listingId: listing._id || listing.id,
                date: selectedDate,
                startTime: selectedSlot.start,
                endTime: selectedSlot.end,
                notes: `Paid via Razorpay`,
                paymentStatus: 'paid',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
            };

            const bookingRes = await axios.post(API_URL, bookingData, config);

            // 4. Verify Payment on backend
            await axios.post(`http://10.113.112.195:5000/api/razorpay/verify`, {
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
            console.error('Booking/Payment error:', error);
            if (error.code === 2) { // User cancelled
                Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
            } else {
                Alert.alert('Error', 'Payment failed or was interrupted.');
            }
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Book Service</Text>
                    <Text style={styles.headerSub}>Select date and time</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Provider/Listing Info Context */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Booking: {listing.name}</Text>
                    <Text style={styles.infoSub}>Provider: {listing.providerId?.name || 'Local Expert'}</Text>
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
                                        <Text style={[styles.slotLabel, isSelected && styles.slotLabelActive]}>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 40, // Margin Increased
        marginBottom: 16,
    },
    backBtn: {
        marginRight: 16,
        padding: 8,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    backIcon: { color: '#111827', fontSize: 18, fontWeight: 'bold' },
    headerTitle: { color: '#0f172a', fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
    headerSub: { color: '#64748b', fontSize: 15, marginTop: 2, fontWeight: '600' },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 110,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    infoTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
    infoSub: { color: '#64748b', fontSize: 14, fontWeight: '600' },
    sectionTitle: {
        color: '#0f172a',
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    calendarContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 32,
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
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        width: '48%',
        alignItems: 'center',
    },
    slotCardActive: {
        borderColor: '#0f172a',
        backgroundColor: '#f8fafc',
        borderWidth: 2,
    },
    slotLabel: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    slotLabelActive: {
        color: '#0f172a',
        fontWeight: '800',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    summaryContainer: {
        flex: 1,
    },
    summaryLabel: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryValue: {
        color: '#0f172a',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    payConfirmBtn: {
        backgroundColor: '#0f172a',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    payConfirmBtnDisabled: {
        backgroundColor: '#e2e8f0',
        shadowOpacity: 0,
        elevation: 0,
    },
    payConfirmBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 0.5,
    }
});
