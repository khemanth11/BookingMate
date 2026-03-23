import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const navigation = useNavigation();

    const handleDone = async () => {
        await AsyncStorage.setItem('hasOnboarded', 'true');
        navigation.replace('Login');
    };

    return (
        <Onboarding
            onDone={handleDone}
            onSkip={handleDone}
            containerStyles={{ paddingHorizontal: 20 }}
            pages={[
                {
                    backgroundColor: '#ffffff',
                    image: <Text style={{ fontSize: 100 }}>🏘️</Text>,
                    title: 'EverythingBooking',
                    titleStyles: { fontWeight: '900', color: '#0f172a', fontSize: 32, letterSpacing: -1 },
                    subtitle: 'Connecting you to quality services and local specialists with ease.',
                    subTitleStyles: { color: '#64748b', fontSize: 16, fontWeight: '600' }
                },
                {
                    backgroundColor: '#ffffff',
                    image: <Text style={{ fontSize: 100 }}>📅</Text>,
                    title: 'Smart Scheduling',
                    titleStyles: { fontWeight: '900', color: '#0f172a', fontSize: 28, letterSpacing: -0.8 },
                    subtitle: 'Book plumbers, tutors, and more with just a few intuitive taps.',
                    subTitleStyles: { color: '#64748b', fontSize: 16, fontWeight: '600' }
                },
                {
                    backgroundColor: '#ffffff',
                    image: <Text style={{ fontSize: 100 }}>🔒</Text>,
                    title: 'Secure Payments',
                    titleStyles: { fontWeight: '900', color: '#0f172a', fontSize: 28, letterSpacing: -0.8 },
                    subtitle: 'Verified providers and secure Stripe payments for peace of mind.',
                    subTitleStyles: { color: '#64748b', fontSize: 16, fontWeight: '600' }
                },
            ]}
        />
    );
}
