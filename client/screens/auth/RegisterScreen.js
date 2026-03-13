import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, KeyboardAvoidingView,
    Platform, ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('consumer');
    const { register } = useAuth();

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />
            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <Text style={styles.appName}>🌾 EverythingBooking</Text>
                    <Text style={styles.tagline}>Your village, connected</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join your village network</Text>

                    <Text style={styles.roleLabel}>I am a:</Text>
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'consumer' && styles.roleActive]}
                            onPress={() => setRole('consumer')}
                        >
                            <Text style={styles.roleIcon}>🛒</Text>
                            <Text style={[styles.roleText, role === 'consumer' && styles.roleTextActive]}>
                                Consumer
                            </Text>
                            <Text style={styles.roleDesc}>I want to book services</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'provider' && styles.roleActive]}
                            onPress={() => setRole('provider')}
                        >
                            <Text style={styles.roleIcon}>🏪</Text>
                            <Text style={[styles.roleText, role === 'provider' && styles.roleTextActive]}>
                                Provider
                            </Text>
                            <Text style={styles.roleDesc}>I offer services</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Full name"
                        placeholderTextColor="#aaa"
                        value={name}
                        onChangeText={setName}
                    />

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
                        placeholder="Phone number"
                        placeholderTextColor="#aaa"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity style={styles.button} onPress={async () => {
                        if (!name || !email || !phone || !password) {
                            alert('Please fill all fields');
                            return;
                        }
                        try {
                            const result = await register(name, email, phone, password, role);
                            if (result && result.success) {
                                alert('Registration successful! Please log in to continue.');
                                navigation.replace('Login');
                            }
                        } catch (err) {
                            alert('Unexpected error: ' + (err.message || 'Check your connection.'));
                        }
                    }}>
                        <Text style={styles.buttonText}>Create Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>
                            Already have an account? <Text style={styles.link}>Login</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f8',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 48,
        marginBottom: 32,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    tagline: {
        color: '#6b7280',
        fontSize: 15,
        marginTop: 6,
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 6,
    },
    subtitle: {
        color: '#6b7280',
        fontSize: 15,
        marginBottom: 24,
    },
    roleLabel: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    roleBtn: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    roleActive: {
        borderColor: '#111827',
        backgroundColor: '#f3f4f6',
    },
    roleIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    roleText: {
        color: '#6b7280',
        fontWeight: '600',
        fontSize: 15,
    },
    roleTextActive: {
        color: '#111827',
        fontWeight: 'bold',
    },
    roleDesc: {
        color: '#9ca3af',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#ffffff',
        color: '#111827',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    button: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    linkText: {
        color: '#6b7280',
        textAlign: 'center',
        fontSize: 15,
    },
    link: {
        color: '#111827',
        fontWeight: 'bold',
    },
});