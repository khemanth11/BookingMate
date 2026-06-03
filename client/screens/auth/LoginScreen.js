import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';


export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('consumer');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const result = await login(email, password);
            
            if (result.success) {
                // Check if the role the user selected in the UI matches their actual database role
                if (result.role !== role) {
                    Alert.alert('Login Failed', `Your account is registered as a ${result.role}, not a ${role}.`);
                    return; // Stop them from proceeding
                }

                if (result.role === 'provider') {
                    navigation.replace('ProviderDashboard');
                } else {
                    navigation.replace('Home');
                }
            }
        } catch (error) {
            console.error('Login Error:', error);
            // Error is already handled/alerted in AuthContext.login
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />

            <View style={styles.header}>
                <Text style={styles.appName}>EverythingBooking</Text>
                <Text style={styles.tagline}>Excellence in every reservation</Text>
            </View>

            <View style={styles.authCard}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Enter your details to continue</Text>

                {/* Role Selection */}
                <Text style={styles.roleLabel}>Login as:</Text>
                <View style={styles.roleContainer}>
                    <TouchableOpacity
                        style={[styles.roleBtn, role === 'consumer' && styles.roleActive]}
                        onPress={() => setRole('consumer')}
                    >
                        <Text style={styles.roleIcon}>🛒</Text>
                        <Text style={[styles.roleText, role === 'consumer' && styles.roleTextActive]}>
                            Consumer
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.roleBtn, role === 'provider' && styles.roleActive]}
                        onPress={() => setRole('provider')}
                    >
                        <Text style={styles.roleIcon}>🏪</Text>
                        <Text style={[styles.roleText, role === 'provider' && styles.roleTextActive]}>
                            Provider
                        </Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#aaa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                    <Text style={styles.loginBtnText}>Login as {role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.footerText}>
                        New to EverythingBooking? <Text style={styles.footerLink}>Create Account</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    appName: {
        fontSize: 24,
        fontFamily: 'Inter_800ExtraBold',
        color: '#111827',
        letterSpacing: -0.5,
    },
    tagline: {
        color: '#6b7280',
        fontSize: 14,
        marginTop: 4,
        fontFamily: 'Inter_500Medium',
    },
    authCard: {
        backgroundColor: '#ffffff',
        padding: 8,
    },
    title: {
        fontSize: 36,
        fontFamily: 'Inter_800ExtraBold',
        color: '#111827',
        marginBottom: 8,
        letterSpacing: -1,
    },
    subtitle: {
        color: '#6b7280',
        fontSize: 15,
        marginBottom: 32,
        fontFamily: 'Inter_500Medium',
    },
    roleLabel: {
        color: '#374151',
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 12,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    roleBtn: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#f3f4f6',
    },
    roleActive: {
        borderColor: '#111827',
        backgroundColor: '#ffffff',
    },
    roleIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    roleText: {
        color: '#6b7280',
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
    },
    roleTextActive: {
        color: '#111827',
        fontFamily: 'Inter_700Bold',
    },
    input: {
        backgroundColor: '#f9fafb',
        color: '#111827',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 18,
        marginBottom: 16,
        fontSize: 16,
        fontFamily: 'Inter_500Medium',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    loginBtn: {
        backgroundColor: '#111827',
        borderRadius: 12,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    loginBtnText: {
        color: '#ffffff',
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
    },
    footerText: {
        color: '#6b7280',
        textAlign: 'center',
        fontSize: 15,
        fontFamily: 'Inter_500Medium',
    },
    footerLink: {
        color: '#111827',
        fontFamily: 'Inter_700Bold',
        textDecorationLine: 'underline',
    },
});