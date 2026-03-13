import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';

const AuthContext = createContext(null);

// Replace this with your computer's local IP address if testing on a physical phone
// e.g., 'http://192.168.1.X:5000'
const API_URL = 'http://10.113.112.195:5000/api/auth';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load token from storage on app start
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    // We have a token, we could technically verify it with the backend here
                    // but for now, we'll extract the user info from local storage
                    const userData = await AsyncStorage.getItem('user');
                    if (userData) {
                        setUser(JSON.parse(userData));
                    }
                }
            } catch (error) {
                console.error('Failed to load user', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password });
            const { token, user } = res.data;

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            setUser(user);
            return { success: true, role: user.role };
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
            return { success: false };
        }
    };

    const register = async (name, email, phone, password, role) => {
        try {
            const res = await axios.post(`${API_URL}/register`, { name, email, phone, password, role });
            const { token, user } = res.data;

            // Return success without logging the user in automatically
            return { success: true, role: user.role };
        } catch (error) {
            console.error('Register error:', error.response?.data || error.message);
            Alert.alert('Registration Failed', error.response?.data?.message || 'Could not create account');
            return { success: false };
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
