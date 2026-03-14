import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, StatusBar, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIME_SLOTS = [
    { start: '08:00', end: '09:00', label: '8:00 AM - 9:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { start: '12:00', end: '13:00', label: '12:00 PM - 1:00 PM' },
    { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
    { start: '16:00', end: '17:00', label: '4:00 PM - 5:00 PM' },
];

const API_URL = 'http://10.113.112.195:5000/api/bookings';

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

            const bookingData = {
                providerId: listing.providerId?._id || listing.providerId,
                listingId: listing._id || listing.id,
                date: selectedDate,
                startTime: selectedSlot.start,
                endTime: selectedSlot.end,
                notes: `Booking for ${listing.name}`
            };

            await axios.post(API_URL, bookingData, config);

            Alert.alert(
                'Booking Requested!',
                `Your request for ${selectedDate} at ${selectedSlot.label} has been sent to the provider.`,
                [{ text: 'OK', onPress: () => navigation.navigate('Home') }] // Go back to home after booking
            );
        } catch (error) {
            console.error('Booking error:', error.response?.data || error.message);
            Alert.alert('Booking Failed', 'There was an issue sending your request.');
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
                <Text style={styles.headerTitle}>Schedule Booking</Text>
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
                        <Text style={styles.sectionTitle}>2. Select a Time</Text>
                        <View style={styles.slotsGrid}>
                            {TIME_SLOTS.map((slot, index) => {
                                const isSelected = selectedSlot?.start === slot.start;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.slot, isSelected && styles.slotActive]}
                                        onPress={() => setSelectedSlot(slot)}
                                    >
                                        <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>
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
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Total Price</Text>
                    <Text style={styles.priceValue}>₹{listing.price}</Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.confirmBtn,
                        (!selectedDate || !selectedSlot || isBooking) && styles.confirmBtnDisabled
                    ]}
                    disabled={!selectedDate || !selectedSlot || isBooking}
                    onPress={handleConfirmBooking}
                >
                    {isBooking ? (
                        <ActivityIndicator color="#f8f9fa" />
                    ) : (
                        <Text style={styles.confirmBtnText}>Confirm Booking</Text>
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
    headerTitle: { color: '#111827', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 110,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    infoTitle: { color: '#111827', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    infoSub: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
    sectionTitle: {
        color: '#111827',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    calendarContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 28,
        backgroundColor: '#ffffff',
    },
    slotsSection: {
        marginBottom: 20,
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    slot: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        width: '48%',
        alignItems: 'center',
    },
    slotActive: {
        borderColor: '#111827',
        backgroundColor: '#f3f4f6',
    },
    slotText: {
        color: '#6b7280',
        fontSize: 15,
        fontWeight: '500',
    },
    slotTextActive: {
        color: '#111827',
        fontWeight: 'bold',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '600',
    },
    priceValue: {
        color: '#111827',
        fontSize: 26,
        fontWeight: '800',
    },
    confirmBtn: {
        backgroundColor: '#111827',
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 160,
    },
    confirmBtnDisabled: {
        backgroundColor: '#e5e7eb',
    },
    confirmBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
